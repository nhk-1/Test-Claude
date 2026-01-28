// Types pour l'application de gestion de séances de sport

export type MuscleCategory =
  | 'chest'      // Pectoraux
  | 'back'       // Dos
  | 'shoulders'  // Épaules
  | 'biceps'     // Biceps
  | 'triceps'    // Triceps
  | 'legs'       // Jambes
  | 'glutes'     // Fessiers
  | 'abs'        // Abdominaux
  | 'cardio';    // Cardio

export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  description?: string;
}

export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  minReps?: number; // Pour les fourchettes ex: 6-8
  maxReps?: number;
  weight: number; // en kg (poids par défaut)
  weightsPerSet?: number[]; // Poids différent par série ex: [20, 18, 16]
  restTime: number; // en secondes
  // Superset
  supersetExerciseId?: string; // ID du 2ème exercice pour superset
  supersetReps?: number;
  supersetMinReps?: number;
  supersetMaxReps?: number;
  supersetWeight?: number;
  supersetWeightsPerSet?: number[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionExercise extends TemplateExercise {
  completedSets: number;
  actualWeight?: number; // Deprecated: use actualWeightsPerSet
  actualWeightsPerSet?: number[]; // Poids réellement utilisés par série
  actualSupersetWeightsPerSet?: number[]; // Poids pour le superset par série
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  templateId: string;
  templateName: string;
  startedAt: string;
  completedAt?: string;
  exercises: SessionExercise[];
  status: 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number; // en kg
  notes?: string;
}

export interface AppData {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  weightEntries: WeightEntry[];
  version: string;
}

export const MUSCLE_CATEGORY_LABELS: Record<MuscleCategory, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  glutes: 'Fessiers',
  abs: 'Abdominaux',
  cardio: 'Cardio',
};

export const MUSCLE_CATEGORY_ICONS: Record<MuscleCategory, string> = {
  chest: '💪',
  back: '🔙',
  shoulders: '🎯',
  biceps: '💪',
  triceps: '💪',
  legs: '🦵',
  glutes: '🍑',
  abs: '🎽',
  cardio: '❤️',
};
