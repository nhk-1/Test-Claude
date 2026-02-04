'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getExerciseById } from '@/lib/exercises';
import Link from 'next/link';

interface PRRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
  sessionId: string;
  isNewPR: boolean;
}

export default function PRHistoryPage() {
  const { data } = useApp();
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | '30days' | '90days' | '365days'>('all');

  // Helper to get weights used in a session exercise
  const getSessionWeights = (exercise: typeof data.sessions[0]['exercises'][0]) => {
    if (exercise.actualWeightsPerSet?.length) {
      return exercise.actualWeightsPerSet.slice(0, exercise.completedSets);
    }
    if (exercise.weightsPerSet?.length) {
      return exercise.weightsPerSet.slice(0, exercise.completedSets);
    }
    const w = exercise.actualWeight ?? exercise.weight;
    return Array(exercise.completedSets).fill(w);
  };

  // Calculate all PRs
  const allPRs = useMemo(() => {
    const prMap = new Map<string, PRRecord[]>();

    // Sort sessions chronologically
    const sessions = [...data.sessions]
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    for (const session of sessions) {
      for (const exercise of session.exercises) {
        if (exercise.completedSets === 0) continue;

        const exerciseInfo = getExerciseById(exercise.exerciseId);
        if (!exerciseInfo) continue;

        const weights = getSessionWeights(exercise);
        const maxWeight = Math.max(...weights);

        // Get current PR history for this exercise
        const history = prMap.get(exercise.exerciseId) || [];
        const currentPR = history.length > 0 ? history[history.length - 1].weight : 0;

        // Check if this is a new PR
        const isNewPR = maxWeight > currentPR;

        if (isNewPR) {
          history.push({
            exerciseId: exercise.exerciseId,
            exerciseName: exerciseInfo.name,
            weight: maxWeight,
            reps: exercise.reps,
            date: session.startedAt,
            sessionId: session.id,
            isNewPR: true,
          });
          prMap.set(exercise.exerciseId, history);
        }
      }
    }

    // Flatten all PRs
    const allRecords: PRRecord[] = [];
    prMap.forEach(records => allRecords.push(...records));

    return allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.sessions]);

  // Filter PRs
  const filteredPRs = useMemo(() => {
    let filtered = allPRs;

    // Filter by exercise
    if (selectedExercise !== 'all') {
      filtered = filtered.filter(pr => pr.exerciseId === selectedExercise);
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      const daysAgo = new Date();
      if (timeFilter === '30days') daysAgo.setDate(now.getDate() - 30);
      else if (timeFilter === '90days') daysAgo.setDate(now.getDate() - 90);
      else if (timeFilter === '365days') daysAgo.setDate(now.getDate() - 365);

      filtered = filtered.filter(pr => new Date(pr.date) >= daysAgo);
    }

    return filtered;
  }, [allPRs, selectedExercise, timeFilter]);

  // Get unique exercises with PRs
  const exercisesWithPRs = useMemo(() => {
    const exerciseMap = new Map<string, { id: string; name: string; count: number }>();

    for (const pr of allPRs) {
      const existing = exerciseMap.get(pr.exerciseId);
      if (existing) {
        existing.count++;
      } else {
        exerciseMap.set(pr.exerciseId, {
          id: pr.exerciseId,
          name: pr.exerciseName,
          count: 1,
        });
      }
    }

    return Array.from(exerciseMap.values()).sort((a, b) => b.count - a.count);
  }, [allPRs]);

  // Stats
  const stats = useMemo(() => {
    if (filteredPRs.length === 0) return null;

    const latestPR = filteredPRs[0];
    const daysSinceLastPR = Math.floor((new Date().getTime() - new Date(latestPR.date).getTime()) / (1000 * 60 * 60 * 24));

    // Calculate biggest improvement
    let biggestImprovement = { exercise: '', increase: 0, from: 0, to: 0 };
    const prByExercise = new Map<string, PRRecord[]>();

    for (const pr of allPRs) {
      const history = prByExercise.get(pr.exerciseId) || [];
      history.push(pr);
      prByExercise.set(pr.exerciseId, history);
    }

    prByExercise.forEach(history => {
      if (history.length >= 2) {
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const improvement = last.weight - first.weight;

        if (improvement > biggestImprovement.increase) {
          biggestImprovement = {
            exercise: last.exerciseName,
            increase: improvement,
            from: first.weight,
            to: last.weight,
          };
        }
      }
    });

    return {
      totalPRs: filteredPRs.length,
      latestPR,
      daysSinceLastPR,
      biggestImprovement,
    };
  }, [filteredPRs, allPRs]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/analytics" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Records Personnels</h1>
          <p className="text-gray-600 dark:text-gray-400">Historique de vos PR</p>
        </div>
      </div>

      {stats ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total PRs</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalPRs}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">Dernier PR</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {stats.latestPR.exerciseName}
              </p>
              <p className="text-xs text-gray-500">
                {stats.daysSinceLastPR === 0 ? "Aujourd'hui" : `Il y a ${stats.daysSinceLastPR}j`}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Meilleure progression</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.biggestImprovement.exercise || '-'}
              </p>
              {stats.biggestImprovement.increase > 0 && (
                <p className="text-xs text-gray-500">
                  {stats.biggestImprovement.from}kg → {stats.biggestImprovement.to}kg (+{stats.biggestImprovement.increase}kg)
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Exercise filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Exercice
                </label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tous les exercices ({allPRs.length} PRs)</option>
                  {exercisesWithPRs.map(ex => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.count} PRs)
                    </option>
                  ))}
                </select>
              </div>

              {/* Time filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Période
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tout l'historique</option>
                  <option value="30days">30 derniers jours</option>
                  <option value="90days">3 derniers mois</option>
                  <option value="365days">12 derniers mois</option>
                </select>
              </div>
            </div>
          </div>

          {/* PR Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white p-5 border-b border-gray-100 dark:border-gray-700">
              Timeline des PRs {filteredPRs.length > 0 && `(${filteredPRs.length})`}
            </h2>
            {filteredPRs.length > 0 ? (
              <div className="max-h-[600px] overflow-y-auto">
                {filteredPRs.map((pr, index) => {
                  const prevPR = index < filteredPRs.length - 1 ? filteredPRs[index + 1] : null;
                  const improvement = prevPR && prevPR.exerciseId === pr.exerciseId
                    ? pr.weight - prevPR.weight
                    : null;

                  return (
                    <div
                      key={`${pr.sessionId}-${pr.exerciseId}`}
                      className="p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {pr.exerciseName}
                            </h3>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                              PR
                            </span>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {pr.weight} kg
                            </p>
                            <span className="text-gray-400">×</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {pr.reps} reps
                            </p>
                            {improvement && improvement > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                  +{improvement}kg
                                </p>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(pr.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        {/* Trophy icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                Aucun PR trouvé pour ces filtres
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Aucun record personnel
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Complétez des séances et battez vos records pour les voir apparaître ici
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Voir les templates
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
