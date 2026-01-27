import { AppData, WorkoutTemplate, WorkoutSession } from './types';

const STORAGE_KEY = 'sport-tracker-data';
const CURRENT_VERSION = '1.0.0';

export function getDefaultData(): AppData {
  return {
    templates: [],
    sessions: [],
    version: CURRENT_VERSION,
  };
}

export function loadData(): AppData {
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
    console.error('Erreur lors du chargement des données');
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
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

// Fonctions utilitaires pour les templates
export function createTemplate(
  data: AppData,
  template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>
): AppData {
  const now = new Date().toISOString();
  const newTemplate: WorkoutTemplate = {
    ...template,
    id: `template-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...data,
    templates: [...data.templates, newTemplate],
  };
}

export function updateTemplate(
  data: AppData,
  templateId: string,
  updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt'>>
): AppData {
  return {
    ...data,
    templates: data.templates.map((t) =>
      t.id === templateId
        ? { ...t, ...updates, updatedAt: new Date().toISOString() }
        : t
    ),
  };
}

export function deleteTemplate(data: AppData, templateId: string): AppData {
  return {
    ...data,
    templates: data.templates.filter((t) => t.id !== templateId),
  };
}

// Fonctions utilitaires pour les sessions
export function createSession(
  data: AppData,
  template: WorkoutTemplate
): { data: AppData; session: WorkoutSession } {
  const session: WorkoutSession = {
    id: `session-${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    startedAt: new Date().toISOString(),
    exercises: template.exercises.map((e) => ({
      ...e,
      completedSets: 0,
    })),
    status: 'in_progress',
  };
  return {
    data: {
      ...data,
      sessions: [...data.sessions, session],
    },
    session,
  };
}

export function updateSession(
  data: AppData,
  sessionId: string,
  updates: Partial<Omit<WorkoutSession, 'id' | 'templateId' | 'templateName' | 'startedAt'>>
): AppData {
  return {
    ...data,
    sessions: data.sessions.map((s) =>
      s.id === sessionId ? { ...s, ...updates } : s
    ),
  };
}

export function completeSession(data: AppData, sessionId: string): AppData {
  return updateSession(data, sessionId, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export function deleteSession(data: AppData, sessionId: string): AppData {
  return {
    ...data,
    sessions: data.sessions.filter((s) => s.id !== sessionId),
  };
}
