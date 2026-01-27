import { AppData, WorkoutTemplate, WorkoutSession } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'sport-tracker-data';
const CURRENT_VERSION = '1.0.0';
const SUPABASE_DATA_ID = 'main-data';

export function getDefaultData(): AppData {
  return {
    templates: [],
    sessions: [],
    version: CURRENT_VERSION,
  };
}

// Charger depuis localStorage
export function loadLocalData(): AppData {
  if (typeof window === 'undefined') {
    return getDefaultData();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultData();
    }
    const data = JSON.parse(stored) as AppData;
    return {
      ...getDefaultData(),
      ...data,
      version: CURRENT_VERSION,
    };
  } catch {
    console.error('Erreur lors du chargement des données locales');
    return getDefaultData();
  }
}

// Sauvegarder dans localStorage
export function saveLocalData(data: AppData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale:', error);
  }
}

// Charger depuis Supabase
export async function loadCloudData(): Promise<AppData | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('fitness_data')
      .select('data')
      .eq('id', SUPABASE_DATA_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return null
        return null;
      }
      throw error;
    }

    if (data?.data) {
      return {
        ...getDefaultData(),
        ...data.data,
        version: CURRENT_VERSION,
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur lors du chargement cloud:', error);
    return null;
  }
}

// Sauvegarder dans Supabase
export async function saveCloudData(data: AppData): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('fitness_data')
      .upsert({
        id: SUPABASE_DATA_ID,
        data: data,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde cloud:', error);
    return false;
  }
}

// Charger les données (cloud prioritaire si configuré)
export async function loadData(): Promise<AppData> {
  // Toujours charger les données locales d'abord
  const localData = loadLocalData();

  // Si Supabase est configuré, essayer de charger les données cloud
  if (isSupabaseConfigured()) {
    const cloudData = await loadCloudData();
    if (cloudData) {
      // Comparer les timestamps pour prendre la version la plus récente
      const localTime = getLatestTimestamp(localData);
      const cloudTime = getLatestTimestamp(cloudData);

      if (cloudTime > localTime) {
        // Cloud plus récent, sauvegarder localement et retourner
        saveLocalData(cloudData);
        return cloudData;
      } else if (localTime > cloudTime) {
        // Local plus récent, synchroniser vers le cloud
        await saveCloudData(localData);
      }
    } else {
      // Pas de données cloud, pousser les données locales
      if (localData.templates.length > 0 || localData.sessions.length > 0) {
        await saveCloudData(localData);
      }
    }
  }

  return localData;
}

// Sauvegarder les données (local + cloud)
export async function saveData(data: AppData): Promise<void> {
  // Toujours sauvegarder localement
  saveLocalData(data);

  // Synchroniser avec le cloud si configuré
  if (isSupabaseConfigured()) {
    await saveCloudData(data);
  }
}

// Obtenir le timestamp le plus récent des données
function getLatestTimestamp(data: AppData): number {
  let latest = 0;

  for (const template of data.templates) {
    const time = new Date(template.updatedAt).getTime();
    if (time > latest) latest = time;
  }

  for (const session of data.sessions) {
    const time = new Date(session.completedAt || session.startedAt).getTime();
    if (time > latest) latest = time;
  }

  return latest;
}

// Forcer la synchronisation
export async function forceSync(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase non configuré' };
  }

  try {
    const localData = loadLocalData();
    const cloudData = await loadCloudData();

    if (!cloudData) {
      await saveCloudData(localData);
      return { success: true, message: 'Données locales envoyées vers le cloud' };
    }

    const localTime = getLatestTimestamp(localData);
    const cloudTime = getLatestTimestamp(cloudData);

    if (cloudTime > localTime) {
      saveLocalData(cloudData);
      return { success: true, message: 'Données cloud récupérées' };
    } else {
      await saveCloudData(localData);
      return { success: true, message: 'Données locales synchronisées' };
    }
  } catch (error) {
    return { success: false, message: 'Erreur de synchronisation' };
  }
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): AppData | null {
  try {
    const data = JSON.parse(jsonString) as AppData;
    if (!data.templates || !data.sessions) {
      throw new Error('Format invalide');
    }
    return {
      ...data,
      version: CURRENT_VERSION,
    };
  } catch {
    console.error('Erreur lors de l\'import');
    return null;
  }
}

export function downloadAsFile(data: AppData, filename: string = 'sport-tracker-backup.json'): void {
  const blob = new Blob([exportData(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
