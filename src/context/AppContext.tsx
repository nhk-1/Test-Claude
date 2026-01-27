'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppData, WorkoutTemplate, WorkoutSession, TemplateExercise, SessionExercise } from '@/lib/types';
import {
  loadData,
  saveData,
  getDefaultData,
  downloadAsFile,
  importData,
  forceSync,
  loadLocalData,
  saveLocalData,
} from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  isSyncing: boolean;
  isCloudEnabled: boolean;

  // Templates
  addTemplate: (name: string, description?: string) => WorkoutTemplate;
  updateTemplate: (id: string, updates: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addExerciseToTemplate: (templateId: string, exercise: TemplateExercise) => void;
  updateExerciseInTemplate: (templateId: string, exerciseIndex: number, updates: Partial<TemplateExercise>) => void;
  removeExerciseFromTemplate: (templateId: string, exerciseIndex: number) => void;
  reorderExercisesInTemplate: (templateId: string, exercises: TemplateExercise[]) => void;

  // Sessions
  startSession: (template: WorkoutTemplate) => WorkoutSession;
  updateSessionExercise: (sessionId: string, exerciseIndex: number, updates: Partial<SessionExercise>) => void;
  completeSet: (sessionId: string, exerciseIndex: number) => void;
  completeSession: (sessionId: string, notes?: string) => void;
  abandonSession: (sessionId: string) => void;
  deleteSession: (id: string) => void;
  getActiveSession: () => WorkoutSession | undefined;

  // Data management
  exportData: () => void;
  importDataFromFile: (file: File) => Promise<boolean>;
  resetData: () => void;
  syncNow: () => Promise<{ success: boolean; message: string }>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(getDefaultData());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudEnabled, setIsCloudEnabled] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données au démarrage
  useEffect(() => {
    const initData = async () => {
      setIsCloudEnabled(isSupabaseConfigured());

      // Charger d'abord les données locales pour affichage rapide
      const localData = loadLocalData();
      setData(localData);
      setIsLoading(false);

      // Ensuite synchroniser avec le cloud si disponible
      if (isSupabaseConfigured()) {
        setIsSyncing(true);
        try {
          const cloudData = await loadData();
          setData(cloudData);
        } catch (error) {
          console.error('Erreur de synchronisation initiale:', error);
        }
        setIsSyncing(false);
      }
    };

    initData();
  }, []);

  // Sauvegarder à chaque changement (avec debounce pour le cloud)
  useEffect(() => {
    if (isLoading) return;

    // Sauvegarde locale immédiate
    saveLocalData(data);

    // Sauvegarde cloud avec debounce
    if (isSupabaseConfigured()) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSyncing(true);
        await saveData(data);
        setIsSyncing(false);
      }, 1000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, isLoading]);

  // Templates
  const addTemplate = useCallback((name: string, description?: string): WorkoutTemplate => {
    const now = new Date().toISOString();
    const newTemplate: WorkoutTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };
    setData((prev) => ({
      ...prev,
      templates: [...prev.templates, newTemplate],
    }));
    return newTemplate;
  }, []);

  const updateTemplate = useCallback((id: string, updates: Partial<WorkoutTemplate>) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.filter((t) => t.id !== id),
    }));
  }, []);

  const addExerciseToTemplate = useCallback((templateId: string, exercise: TemplateExercise) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              exercises: [...t.exercises, exercise],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  }, []);

  const updateExerciseInTemplate = useCallback(
    (templateId: string, exerciseIndex: number, updates: Partial<TemplateExercise>) => {
      setData((prev) => ({
        ...prev,
        templates: prev.templates.map((t) =>
          t.id === templateId
            ? {
                ...t,
                exercises: t.exercises.map((e, i) =>
                  i === exerciseIndex ? { ...e, ...updates } : e
                ),
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
      }));
    },
    []
  );

  const removeExerciseFromTemplate = useCallback((templateId: string, exerciseIndex: number) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              exercises: t.exercises.filter((_, i) => i !== exerciseIndex),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
  }, []);

  const reorderExercisesInTemplate = useCallback((templateId: string, exercises: TemplateExercise[]) => {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((t) =>
        t.id === templateId
          ? { ...t, exercises, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
  }, []);

  // Sessions
  const startSession = useCallback((template: WorkoutTemplate): WorkoutSession => {
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
    setData((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }));
    return session;
  }, []);

  const updateSessionExercise = useCallback(
    (sessionId: string, exerciseIndex: number, updates: Partial<SessionExercise>) => {
      setData((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises.map((e, i) =>
                  i === exerciseIndex ? { ...e, ...updates } : e
                ),
              }
            : s
        ),
      }));
    },
    []
  );

  const completeSet = useCallback((sessionId: string, exerciseIndex: number) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              exercises: s.exercises.map((e, i) =>
                i === exerciseIndex
                  ? { ...e, completedSets: Math.min(e.completedSets + 1, e.sets) }
                  : e
              ),
            }
          : s
      ),
    }));
  }, []);

  const completeSession = useCallback((sessionId: string, notes?: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              notes: notes || s.notes,
            }
          : s
      ),
    }));
  }, []);

  const abandonSession = useCallback((sessionId: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: 'abandoned' as const, completedAt: new Date().toISOString() }
          : s
      ),
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== id),
    }));
  }, []);

  const getActiveSession = useCallback((): WorkoutSession | undefined => {
    return data.sessions.find((s) => s.status === 'in_progress');
  }, [data.sessions]);

  // Data management
  const exportDataFn = useCallback(() => {
    const date = new Date().toISOString().split('T')[0];
    downloadAsFile(data, `sport-tracker-backup-${date}.json`);
  }, [data]);

  const importDataFromFile = useCallback(async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const imported = importData(content);
        if (imported) {
          setData(imported);
          resolve(true);
        } else {
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  const resetData = useCallback(async () => {
    const defaultData = getDefaultData();
    setData(defaultData);
  }, []);

  const syncNow = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Synchronisation cloud non configurée' };
    }

    setIsSyncing(true);
    try {
      const result = await forceSync();
      if (result.success) {
        const newData = await loadData();
        setData(newData);
      }
      setIsSyncing(false);
      return result;
    } catch (error) {
      setIsSyncing(false);
      return { success: false, message: 'Erreur de synchronisation' };
    }
  }, []);

  const value: AppContextType = {
    data,
    isLoading,
    isSyncing,
    isCloudEnabled,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addExerciseToTemplate,
    updateExerciseInTemplate,
    removeExerciseFromTemplate,
    reorderExercisesInTemplate,
    startSession,
    updateSessionExercise,
    completeSet,
    completeSession,
    abandonSession,
    deleteSession,
    getActiveSession,
    exportData: exportDataFn,
    importDataFromFile,
    resetData,
    syncNow,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
