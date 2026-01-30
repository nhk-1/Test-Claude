// Advanced analytics calculations

import { WorkoutSession, SessionExercise } from './types';

/**
 * Calculate estimated 1RM (One Rep Max) using Epley formula
 * Formula: 1RM = weight * (1 + reps/30)
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Calculate estimated 1RM using Brzycki formula (alternative)
 * Formula: 1RM = weight * (36 / (37 - reps))
 */
export function calculateEstimated1RMBrzycki(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) return weight; // Formula doesn't work for very high reps
  return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
}

/**
 * Detect plateau for an exercise (no progress in recent sessions)
 */
export function detectPlateauForExercise(
  sessions: Array<{ date: string; maxWeight: number }>,
  weeksThreshold: number = 4
): boolean {
  if (sessions.length < 3) return false;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeksThreshold * 7));

  const recentSessions = sessions.filter(s => new Date(s.date) >= cutoffDate);
  if (recentSessions.length < 2) return false;

  // Check if max weight hasn't increased
  const weights = recentSessions.map(s => s.maxWeight);
  const maxWeight = Math.max(...weights);
  const firstWeight = weights[0];

  // Plateau if no improvement or regression
  return maxWeight <= firstWeight;
}

/**
 * Calculate fatigue index based on volume and frequency
 * Returns a score from 0-100 (higher = more fatigued)
 */
export function calculateFatigueIndex(
  sessions: WorkoutSession[],
  daysToAnalyze: number = 14
): {
  score: number;
  level: 'low' | 'moderate' | 'high' | 'very_high';
  recommendation: string;
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);

  const recentSessions = sessions.filter(
    s => s.status === 'completed' && new Date(s.startedAt) >= cutoffDate
  );

  if (recentSessions.length === 0) {
    return {
      score: 0,
      level: 'low',
      recommendation: 'Pas assez de données récentes pour calculer la fatigue.',
    };
  }

  // Calculate metrics
  const totalSessions = recentSessions.length;
  const avgSessionsPerWeek = (totalSessions / daysToAnalyze) * 7;

  // Calculate total volume
  let totalVolume = 0;
  for (const session of recentSessions) {
    for (const exercise of session.exercises) {
      const weights = exercise.actualWeightsPerSet ||
                     exercise.weightsPerSet ||
                     [exercise.actualWeight || exercise.weight];
      const volume = weights.reduce((sum, w) => sum + (w * exercise.reps), 0);
      totalVolume += volume;
    }
  }

  const avgVolumePerSession = totalVolume / totalSessions;

  // Calculate score based on frequency and volume
  let score = 0;

  // Frequency component (0-40 points)
  if (avgSessionsPerWeek >= 6) score += 40;
  else if (avgSessionsPerWeek >= 5) score += 30;
  else if (avgSessionsPerWeek >= 4) score += 20;
  else if (avgSessionsPerWeek >= 3) score += 10;

  // Volume component (0-40 points)
  if (avgVolumePerSession >= 15000) score += 40;
  else if (avgVolumePerSession >= 10000) score += 30;
  else if (avgVolumePerSession >= 7000) score += 20;
  else if (avgVolumePerSession >= 5000) score += 10;

  // Rest days component (0-20 points)
  const sessionDates = recentSessions
    .map(s => new Date(s.startedAt).getTime())
    .sort((a, b) => a - b);

  let totalRestDays = 0;
  for (let i = 1; i < sessionDates.length; i++) {
    const daysBetween = (sessionDates[i] - sessionDates[i - 1]) / (1000 * 60 * 60 * 24);
    totalRestDays += daysBetween;
  }
  const avgRestDays = totalRestDays / (sessionDates.length - 1);

  if (avgRestDays < 1) score += 20;
  else if (avgRestDays < 1.5) score += 10;
  else if (avgRestDays < 2) score += 5;

  // Determine level and recommendation
  let level: 'low' | 'moderate' | 'high' | 'very_high';
  let recommendation: string;

  if (score >= 80) {
    level = 'very_high';
    recommendation = 'Fatigue très élevée ! Prenez une semaine de décharge (50% volume) pour récupérer.';
  } else if (score >= 60) {
    level = 'high';
    recommendation = 'Fatigue élevée. Réduisez le volume de 30% cette semaine ou prenez 2-3 jours de repos.';
  } else if (score >= 40) {
    level = 'moderate';
    recommendation = 'Fatigue modérée. Assurez-vous de bien récupérer entre les séances.';
  } else {
    level = 'low';
    recommendation = 'Niveau de fatigue normal. Continuez votre entraînement !';
  }

  return { score, level, recommendation };
}

/**
 * Calculate training volume trend (increasing/decreasing)
 */
export function calculateVolumeTrend(
  sessions: WorkoutSession[],
  weeksToCompare: number = 4
): {
  trend: 'increasing' | 'stable' | 'decreasing';
  percentChange: number;
} {
  if (sessions.length < 2) {
    return { trend: 'stable', percentChange: 0 };
  }

  const sortedSessions = [...sessions]
    .filter(s => s.status === 'completed')
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (weeksToCompare * 7));

  const recentSessions = sortedSessions.filter(s => new Date(s.startedAt) >= cutoffDate);

  if (recentSessions.length < 2) {
    return { trend: 'stable', percentChange: 0 };
  }

  // Split into two halves
  const midpoint = Math.floor(recentSessions.length / 2);
  const firstHalf = recentSessions.slice(0, midpoint);
  const secondHalf = recentSessions.slice(midpoint);

  const calculateVolume = (sessions: WorkoutSession[]) => {
    let total = 0;
    for (const session of sessions) {
      for (const exercise of session.exercises) {
        const weights = exercise.actualWeightsPerSet ||
                       exercise.weightsPerSet ||
                       [exercise.actualWeight || exercise.weight];
        total += weights.reduce((sum, w) => sum + (w * exercise.reps), 0);
      }
    }
    return total;
  };

  const firstVolume = calculateVolume(firstHalf);
  const secondVolume = calculateVolume(secondHalf);

  const percentChange = ((secondVolume - firstVolume) / firstVolume) * 100;

  let trend: 'increasing' | 'stable' | 'decreasing';
  if (percentChange > 10) trend = 'increasing';
  else if (percentChange < -10) trend = 'decreasing';
  else trend = 'stable';

  return { trend, percentChange: Math.round(percentChange) };
}

/**
 * Suggest deload week based on fatigue and volume trends
 */
export function shouldDeload(
  sessions: WorkoutSession[],
  weeksSinceLastDeload?: number
): {
  shouldDeload: boolean;
  reason: string;
} {
  const fatigue = calculateFatigueIndex(sessions);
  const volumeTrend = calculateVolumeTrend(sessions);

  // Auto-deload every 4-6 weeks
  if (weeksSinceLastDeload && weeksSinceLastDeload >= 6) {
    return {
      shouldDeload: true,
      reason: 'Décharge recommandée : 6+ semaines depuis la dernière décharge.',
    };
  }

  // Deload if high fatigue
  if (fatigue.level === 'very_high' || fatigue.level === 'high') {
    return {
      shouldDeload: true,
      reason: `Décharge recommandée : ${fatigue.recommendation}`,
    };
  }

  // Deload if volume is increasing too fast
  if (volumeTrend.trend === 'increasing' && volumeTrend.percentChange > 30) {
    return {
      shouldDeload: true,
      reason: 'Décharge recommandée : augmentation trop rapide du volume (+' + volumeTrend.percentChange + '%).',
    };
  }

  return {
    shouldDeload: false,
    reason: 'Pas de décharge nécessaire pour le moment.',
  };
}
