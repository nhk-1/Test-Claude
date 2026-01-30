'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getExerciseById } from '@/lib/exercises';
import { MuscleCategory, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import Link from 'next/link';
import {
  calculateEstimated1RM,
  calculateFatigueIndex,
  calculateVolumeTrend,
  shouldDeload,
  detectPlateauForExercise,
} from '@/lib/analytics';

type TabType = 'weight' | 'performance' | 'muscles' | 'advanced';

export default function AnalyticsPage() {
  const { data, addWeightEntry, deleteWeightEntry } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('weight');
  const [newWeight, setNewWeight] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string>('');

  // Weight stats
  const weightStats = useMemo(() => {
    const entries = [...(data.weightEntries || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (entries.length === 0) {
      return null;
    }

    const weights = entries.map((e) => e.weight);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const totalChange = lastWeight - firstWeight;

    // Last 7 days change
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentEntries = entries.filter((e) => new Date(e.date) >= weekAgo);
    const weekChange = recentEntries.length >= 2
      ? recentEntries[recentEntries.length - 1].weight - recentEntries[0].weight
      : null;

    return {
      entries,
      current: lastWeight,
      min: minWeight,
      max: maxWeight,
      avg: avgWeight,
      totalChange,
      weekChange,
    };
  }, [data.weightEntries]);

  // Get unique exercises from sessions
  const exercisesInSessions = useMemo(() => {
    const exerciseMap = new Map<string, { id: string; name: string; count: number }>();

    for (const session of data.sessions.filter((s) => s.status === 'completed')) {
      for (const exercise of session.exercises) {
        const existing = exerciseMap.get(exercise.exerciseId);
        if (existing) {
          existing.count++;
        } else {
          const exerciseInfo = getExerciseById(exercise.exerciseId);
          if (exerciseInfo) {
            exerciseMap.set(exercise.exerciseId, {
              id: exercise.exerciseId,
              name: exerciseInfo.name,
              count: 1,
            });
          }
        }
      }
    }

    return Array.from(exerciseMap.values()).sort((a, b) => b.count - a.count);
  }, [data.sessions]);

  // Helper to get weights used in a session exercise
  const getSessionWeights = (exercise: typeof data.sessions[0]['exercises'][0]) => {
    // Priorité: actualWeightsPerSet > weightsPerSet > actualWeight > weight
    if (exercise.actualWeightsPerSet?.length) {
      return exercise.actualWeightsPerSet.slice(0, exercise.completedSets);
    }
    if (exercise.weightsPerSet?.length) {
      return exercise.weightsPerSet.slice(0, exercise.completedSets);
    }
    const w = exercise.actualWeight ?? exercise.weight;
    return Array(exercise.completedSets).fill(w);
  };

  // Muscle groups stats
  const muscleGroupStats = useMemo(() => {
    const statsMap = new Map<MuscleCategory, {
      category: MuscleCategory;
      totalVolume: number;
      sessionCount: number;
      exerciseCount: number;
      lastWorked: string | null;
    }>();

    // Initialize all muscle categories
    const categories: MuscleCategory[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'abs', 'cardio'];
    categories.forEach(cat => {
      statsMap.set(cat, {
        category: cat,
        totalVolume: 0,
        sessionCount: 0,
        exerciseCount: 0,
        lastWorked: null,
      });
    });

    // Process completed sessions
    const completedSessions = data.sessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    for (const session of completedSessions) {
      const sessionDate = session.startedAt;
      const processedCategoriesInSession = new Set<MuscleCategory>();

      for (const exercise of session.exercises) {
        const exerciseInfo = getExerciseById(exercise.exerciseId);
        if (!exerciseInfo) continue;

        const category = exerciseInfo.category;
        const stats = statsMap.get(category)!;

        // Calculate volume
        const weights = getSessionWeights(exercise);
        const volume = weights.reduce((total, w) => total + w * exercise.reps, 0);
        stats.totalVolume += volume;

        // Track last worked date
        if (!stats.lastWorked || new Date(sessionDate) > new Date(stats.lastWorked)) {
          stats.lastWorked = sessionDate;
        }

        // Count exercises
        stats.exerciseCount++;

        // Count session only once per muscle group
        if (!processedCategoriesInSession.has(category)) {
          stats.sessionCount++;
          processedCategoriesInSession.add(category);
        }
      }
    }

    return Array.from(statsMap.values())
      .filter(s => s.totalVolume > 0 || s.sessionCount > 0)
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [data.sessions]);

  // Performance data for selected exercise
  const performanceData = useMemo(() => {
    if (!selectedExercise) return null;

    const sessions = data.sessions
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    const dataPoints: { date: string; weight: number; maxWeight: number; reps: number; volume: number; weightsPerSet: number[] }[] = [];

    for (const session of sessions) {
      const exercise = session.exercises.find((e) => e.exerciseId === selectedExercise);
      if (exercise && exercise.completedSets > 0) {
        const weights = getSessionWeights(exercise);
        const maxW = Math.max(...weights);
        const avgW = weights.reduce((a, b) => a + b, 0) / weights.length;
        // Volume = somme des (poids x reps) pour chaque série
        const volume = weights.reduce((total, w) => total + w * exercise.reps, 0);

        dataPoints.push({
          date: session.startedAt,
          weight: avgW, // Poids moyen pour le graphique
          maxWeight: maxW, // Poids max de la séance
          reps: exercise.reps,
          volume,
          weightsPerSet: weights,
        });
      }
    }

    if (dataPoints.length === 0) return null;

    const allMaxWeights = dataPoints.map((d) => d.maxWeight);
    const avgWeights = dataPoints.map((d) => d.weight);
    const volumes = dataPoints.map((d) => d.volume);
    const maxWeight = Math.max(...allMaxWeights);
    const minWeight = Math.min(...allMaxWeights);
    const latestWeight = allMaxWeights[allMaxWeights.length - 1];
    const firstWeight = allMaxWeights[0];
    const progression = latestWeight - firstWeight;
    const maxVolume = Math.max(...volumes);

    return {
      dataPoints,
      maxWeight,
      minWeight,
      latestWeight,
      progression,
      maxVolume,
      totalSessions: dataPoints.length,
    };
  }, [selectedExercise, data.sessions]);

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && weight > 0) {
      addWeightEntry(weight);
      setNewWeight('');
    }
  };

  // Simple SVG line chart component
  function LineChart<T extends { date: string }>({
    data,
    getY,
    color = '#6366f1',
    height = 200
  }: {
    data: T[];
    getY: (d: T) => number;
    color?: string;
    height?: number;
  }) {
    if (data.length < 2) return <p className="text-gray-500 text-center py-8">Pas assez de données pour afficher le graphique</p>;

    const values = data.map(getY);
    const minY = Math.min(...values) * 0.95;
    const maxY = Math.max(...values) * 1.05;
    const range = maxY - minY || 1;

    const width = 100;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((getY(d) - minY) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1="0"
              y1={height * p}
              x2={width}
              y2={height * p}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={points}
            vectorEffect="non-scaling-stroke"
          />

          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((getY(d) - minY) / range) * height;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{new Date(data[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
          <span>{new Date(data[data.length - 1].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analyses</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Suivez vos progrès</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('weight')}
          className={`flex-1 min-w-[70px] py-3 px-4 rounded-lg font-medium transition-all btn-press whitespace-nowrap text-sm ${
            activeTab === 'weight'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Poids
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 min-w-[70px] py-3 px-4 rounded-lg font-medium transition-all btn-press whitespace-nowrap text-sm ${
            activeTab === 'performance'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Perf
        </button>
        <button
          onClick={() => setActiveTab('muscles')}
          className={`flex-1 min-w-[70px] py-3 px-4 rounded-lg font-medium transition-all btn-press whitespace-nowrap text-sm ${
            activeTab === 'muscles'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Muscles
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 min-w-[70px] py-3 px-4 rounded-lg font-medium transition-all btn-press whitespace-nowrap text-sm ${
            activeTab === 'advanced'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Avancé
        </button>
      </div>

      {activeTab === 'weight' && (
        <div className="space-y-10">
          {/* Add weight entry */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Ajouter une pesée</h2>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Votre poids"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">kg</span>
              </div>
              <button
                onClick={handleAddWeight}
                disabled={!newWeight}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors btn-press touch-target"
              >
                Ajouter
              </button>
            </div>
          </div>

          {weightStats ? (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Actuel</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weightStats.current.toFixed(1)} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Variation totale</p>
                  <p className={`text-2xl font-bold ${
                    weightStats.totalChange > 0
                      ? 'text-red-500'
                      : weightStats.totalChange < 0
                        ? 'text-emerald-500'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    {weightStats.totalChange > 0 ? '+' : ''}{weightStats.totalChange.toFixed(1)} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Min</p>
                  <p className="text-2xl font-bold text-emerald-500">{weightStats.min.toFixed(1)} kg</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Max</p>
                  <p className="text-2xl font-bold text-red-500">{weightStats.max.toFixed(1)} kg</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Évolution du poids</h2>
                <LineChart
                  data={weightStats.entries}
                  getY={(d) => d.weight}
                  color="#6366f1"
                />
              </div>

              {/* History */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white p-5 border-b border-gray-100 dark:border-gray-700">
                  Historique ({weightStats.entries.length} entrées)
                </h2>
                <div className="max-h-64 overflow-y-auto">
                  {[...weightStats.entries].reverse().map((entry, i, arr) => {
                    const prevEntry = arr[i + 1];
                    const diff = prevEntry ? entry.weight - prevEntry.weight : null;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.weight.toFixed(1)} kg
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {diff !== null && (
                            <span className={`text-sm font-medium ${
                              diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-gray-400'
                            }`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          )}
                          <button
                            onClick={() => deleteWeightEntry(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Aucune pesée enregistrée
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Commencez à suivre votre poids pour voir vos analyses
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-10">
          {/* Exercise selector */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Sélectionnez un exercice</h2>
            {exercisesInSessions.length > 0 ? (
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Choisir un exercice --</option>
                {exercisesInSessions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.count} séances)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                Aucune séance terminée. Complétez des séances pour voir vos statistiques.
              </p>
            )}
          </div>

          {selectedExercise && performanceData ? (
            <>
              {/* Link to PR History */}
              <Link
                href="/analytics/pr-history"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl p-4 shadow-sm flex items-center justify-between transition-all btn-press"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.22 49.22 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Historique des Records</h3>
                    <p className="text-sm text-white/80">Voir tous vos PRs</p>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>

              {/* Performance stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Charge actuelle</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {performanceData.latestWeight} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Progression</p>
                  <p className={`text-2xl font-bold ${
                    performanceData.progression > 0
                      ? 'text-emerald-500'
                      : performanceData.progression < 0
                        ? 'text-red-500'
                        : 'text-gray-900 dark:text-white'
                  }`}>
                    {performanceData.progression > 0 ? '+' : ''}{performanceData.progression} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Record (PR)</p>
                  <p className="text-2xl font-bold text-amber-500">{performanceData.maxWeight} kg</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Séances</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceData.totalSessions}
                  </p>
                </div>
              </div>

              {/* Weight progression chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Progression des charges (max par séance)</h2>
                <LineChart
                  data={performanceData.dataPoints}
                  getY={(d) => d.maxWeight}
                  color="#10b981"
                />
              </div>

              {/* Volume chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Volume d'entraînement</h2>
                <p className="text-sm text-gray-500 mb-6">Volume = Poids x Reps x Séries</p>
                <LineChart
                  data={performanceData.dataPoints}
                  getY={(d) => d.volume}
                  color="#8b5cf6"
                />
              </div>

              {/* Session history */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white p-5 border-b border-gray-100 dark:border-gray-700">
                  Historique des séances
                </h2>
                <div className="max-h-80 overflow-y-auto">
                  {[...performanceData.dataPoints].reverse().map((dp, i) => (
                    <div
                      key={i}
                      className="p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Max: {dp.maxWeight} kg x {dp.reps} reps
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(dp.date).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-purple-600 dark:text-purple-400">
                            {dp.volume} kg
                          </p>
                          <p className="text-xs text-gray-500">volume</p>
                        </div>
                      </div>
                      {/* Poids par série */}
                      {dp.weightsPerSet.length > 1 && (
                        <div className="flex gap-1 flex-wrap">
                          {dp.weightsPerSet.map((w, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                            >
                              S{idx + 1}: {w}kg
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : selectedExercise ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <p className="text-gray-500">Aucune donnée pour cet exercice</p>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'muscles' && (
        <div className="space-y-10">
          {muscleGroupStats.length > 0 ? (
            <>
              {/* Overview stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Groupes travaillés</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {muscleGroupStats.length}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Plus travaillé</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {MUSCLE_CATEGORY_LABELS[muscleGroupStats[0]?.category] || '-'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm col-span-2 md:col-span-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Volume total</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {muscleGroupStats.reduce((sum, s) => sum + s.totalVolume, 0).toLocaleString()} kg
                  </p>
                </div>
              </div>

              {/* Volume distribution chart (bar chart) */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-6">Répartition du volume par groupe musculaire</h2>
                <div className="space-y-4">
                  {muscleGroupStats.map((stat) => {
                    const maxVolume = muscleGroupStats[0]?.totalVolume || 1;
                    const percentage = (stat.totalVolume / maxVolume) * 100;

                    return (
                      <div key={stat.category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {MUSCLE_CATEGORY_LABELS[stat.category]}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {stat.totalVolume.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Muscle groups cards */}
              <div className="grid md:grid-cols-2 gap-5">
                {muscleGroupStats.map((stat) => {
                  const daysSinceWorked = stat.lastWorked
                    ? Math.floor((new Date().getTime() - new Date(stat.lastWorked).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div key={stat.category} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {MUSCLE_CATEGORY_LABELS[stat.category]}
                        </h3>
                        {daysSinceWorked !== null && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            daysSinceWorked === 0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : daysSinceWorked <= 3
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : daysSinceWorked <= 7
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {daysSinceWorked === 0 ? "Aujourd'hui" : `Il y a ${daysSinceWorked}j`}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-5">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {stat.totalVolume.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">kg</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Séances</p>
                          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {stat.sessionCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Exercices</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {stat.exerciseCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Balance warning */}
              {muscleGroupStats.length >= 2 && (
                (() => {
                  const maxVolume = muscleGroupStats[0].totalVolume;
                  const minVolume = muscleGroupStats[muscleGroupStats.length - 1].totalVolume;
                  const ratio = maxVolume / (minVolume || 1);

                  if (ratio > 3) {
                    return (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                        <div className="flex gap-3">
                          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                              Déséquilibre détecté
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              Il y a un déséquilibre important entre vos groupes musculaires.
                              Pensez à rééquilibrer votre entraînement pour éviter les blessures et optimiser vos résultats.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Aucune donnée disponible
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Complétez des séances pour voir vos statistiques par groupe musculaire
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-10">
          {data.sessions.filter(s => s.status === 'completed').length > 0 ? (
            <>
              {/* Fatigue Index */}
              {(() => {
                const fatigue = calculateFatigueIndex(data.sessions);
                const volumeTrend = calculateVolumeTrend(data.sessions);
                const deloadCheck = shouldDeload(data.sessions);

                return (
                  <>
                    {/* Fatigue Card */}
                    <div className={`rounded-2xl p-6 shadow-sm border-2 ${
                      fatigue.level === 'very_high'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : fatigue.level === 'high'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                        : fatigue.level === 'moderate'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Index de Fatigue
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Basé sur les 14 derniers jours
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {fatigue.score}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">/ 100</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full transition-all duration-500 ${
                            fatigue.level === 'very_high'
                              ? 'bg-red-500'
                              : fatigue.level === 'high'
                              ? 'bg-orange-500'
                              : fatigue.level === 'moderate'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${fatigue.score}%` }}
                        />
                      </div>

                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {fatigue.recommendation}
                      </p>
                    </div>

                    {/* Volume Trend */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Tendance du Volume
                      </h3>
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          volumeTrend.trend === 'increasing'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : volumeTrend.trend === 'decreasing'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <svg className={`w-8 h-8 ${
                            volumeTrend.trend === 'increasing'
                              ? 'text-green-600 dark:text-green-400'
                              : volumeTrend.trend === 'decreasing'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            {volumeTrend.trend === 'increasing' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                            ) : volumeTrend.trend === 'decreasing' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {volumeTrend.trend === 'increasing' ? 'En hausse' : volumeTrend.trend === 'decreasing' ? 'En baisse' : 'Stable'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {volumeTrend.percentChange > 0 ? '+' : ''}{volumeTrend.percentChange}% sur 4 semaines
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deload Recommendation */}
                    {deloadCheck.shouldDeload && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 rounded-2xl p-6">
                        <div className="flex gap-3">
                          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                          </svg>
                          <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                              Semaine de Décharge Recommandée
                            </h3>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              {deloadCheck.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* 1RM Calculator */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Estimations 1RM (One Rep Max)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Basé sur vos meilleurs performances récentes
                </p>

                <div className="space-y-4">
                  {exercisesInSessions.slice(0, 5).map((ex) => {
                    const sessionsWithEx = data.sessions
                      .filter(s => s.status === 'completed')
                      .filter(s => s.exercises.some(e => e.exerciseId === ex.id))
                      .map(s => {
                        const exercise = s.exercises.find(e => e.exerciseId === ex.id)!;
                        const weights = exercise.actualWeightsPerSet ||
                                       exercise.weightsPerSet ||
                                       [exercise.actualWeight || exercise.weight];
                        return {
                          weight: Math.max(...weights),
                          reps: exercise.reps,
                        };
                      })
                      .sort((a, b) => b.weight - a.weight);

                    if (sessionsWithEx.length === 0) return null;

                    const best = sessionsWithEx[0];
                    const estimated1RM = calculateEstimated1RM(best.weight, best.reps);

                    return (
                      <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{ex.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Meilleure : {best.weight}kg × {best.reps} reps
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {estimated1RM}kg
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">1RM estimé</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Plateau Detection */}
              {(() => {
                const exercisesWithPlateau = exercisesInSessions
                  .map(ex => {
                    const sessionData = data.sessions
                      .filter(s => s.status === 'completed')
                      .map(s => {
                        const exercise = s.exercises.find(e => e.exerciseId === ex.id);
                        if (!exercise) return null;

                        const weights = exercise.actualWeightsPerSet ||
                                       exercise.weightsPerSet ||
                                       [exercise.actualWeight || exercise.weight];
                        return {
                          date: s.startedAt,
                          maxWeight: Math.max(...weights),
                        };
                      })
                      .filter(Boolean) as Array<{ date: string; maxWeight: number }>;

                    const hasPlateau = detectPlateauForExercise(sessionData, 4);
                    return hasPlateau ? { ...ex, sessionData } : null;
                  })
                  .filter(Boolean);

                if (exercisesWithPlateau.length === 0) return null;

                return (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-200 mb-2">
                      Plateaux Détectés
                    </h3>
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-6">
                      Ces exercices n'ont pas progressé depuis 4+ semaines
                    </p>
                    <div className="space-y-3">
                      {exercisesWithPlateau.map((ex: any) => (
                        <div key={ex.id} className="flex items-center gap-2 text-sm text-orange-900 dark:text-orange-200">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                          </svg>
                          {ex.name}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-4">
                      💡 Conseil : Essayez de varier les exercices, augmenter le volume ou prendre une semaine de décharge
                    </p>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Aucune donnée disponible
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                Complétez des séances pour voir vos analyses avancées
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
