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
  weight: number; // en kg
  restTime: number; // en secondes
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
  actualWeight?: number;
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

export interface AppData {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
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
