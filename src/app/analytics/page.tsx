'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getExerciseById } from '@/lib/exercises';

type TabType = 'weight' | 'performance';

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

  // Performance data for selected exercise
  const performanceData = useMemo(() => {
    if (!selectedExercise) return null;

    const sessions = data.sessions
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    const dataPoints: { date: string; weight: number; reps: number; volume: number }[] = [];

    for (const session of sessions) {
      const exercise = session.exercises.find((e) => e.exerciseId === selectedExercise);
      if (exercise && exercise.completedSets > 0) {
        const weight = exercise.actualWeight ?? exercise.weight;
        const volume = weight * exercise.reps * exercise.completedSets;
        dataPoints.push({
          date: session.startedAt,
          weight,
          reps: exercise.reps,
          volume,
        });
      }
    }

    if (dataPoints.length === 0) return null;

    const weights = dataPoints.map((d) => d.weight);
    const volumes = dataPoints.map((d) => d.volume);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const latestWeight = weights[weights.length - 1];
    const firstWeight = weights[0];
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analyses</h1>
        <p className="text-gray-600 dark:text-gray-400">Suivez vos progrès</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          onClick={() => setActiveTab('weight')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all btn-press ${
            activeTab === 'weight'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Poids corporel
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all btn-press ${
            activeTab === 'performance'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Performance
        </button>
      </div>

      {activeTab === 'weight' && (
        <div className="space-y-6">
          {/* Add weight entry */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ajouter une pesée</h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Votre poids"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">kg</span>
              </div>
              <button
                onClick={handleAddWeight}
                disabled={!newWeight}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors btn-press"
              >
                Ajouter
              </button>
            </div>
          </div>

          {weightStats ? (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Actuel</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {weightStats.current.toFixed(1)} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Variation totale</p>
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Min</p>
                  <p className="text-2xl font-bold text-emerald-500">{weightStats.min.toFixed(1)} kg</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Max</p>
                  <p className="text-2xl font-bold text-red-500">{weightStats.max.toFixed(1)} kg</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Évolution du poids</h2>
                <LineChart
                  data={weightStats.entries}
                  getY={(d) => d.weight}
                  color="#6366f1"
                />
              </div>

              {/* History */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-100 dark:border-gray-700">
                  Historique ({weightStats.entries.length} entrées)
                </h2>
                <div className="max-h-64 overflow-y-auto">
                  {[...weightStats.entries].reverse().map((entry, i, arr) => {
                    const prevEntry = arr[i + 1];
                    const diff = prevEntry ? entry.weight - prevEntry.weight : null;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune pesée enregistrée
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Commencez à suivre votre poids pour voir vos analyses
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Exercise selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Sélectionnez un exercice</h2>
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
              {/* Performance stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Charge actuelle</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {performanceData.latestWeight} kg
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Progression</p>
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
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Record (PR)</p>
                  <p className="text-2xl font-bold text-amber-500">{performanceData.maxWeight} kg</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Séances</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {performanceData.totalSessions}
                  </p>
                </div>
              </div>

              {/* Weight progression chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Progression des charges</h2>
                <LineChart
                  data={performanceData.dataPoints}
                  getY={(d) => d.weight}
                  color="#10b981"
                />
              </div>

              {/* Volume chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Volume d'entraînement</h2>
                <p className="text-sm text-gray-500 mb-4">Volume = Poids x Reps x Séries</p>
                <LineChart
                  data={performanceData.dataPoints}
                  getY={(d) => d.volume}
                  color="#8b5cf6"
                />
              </div>

              {/* Session history */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <h2 className="font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-100 dark:border-gray-700">
                  Historique des séances
                </h2>
                <div className="max-h-64 overflow-y-auto">
                  {[...performanceData.dataPoints].reverse().map((dp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {dp.weight} kg x {dp.reps} reps
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
    </div>
  );
}
