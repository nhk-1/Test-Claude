'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { WorkoutSession, MUSCLE_CATEGORY_LABELS, MuscleCategory } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import { exportSessionToPDF, exportMultipleSessionsToPDF } from '@/lib/pdfExport';

export default function HistoryPage() {
  const { data, isLoading, deleteSession } = useApp();
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  // Group sessions by month
  const sessionsByMonth = data.sessions
    .filter((s) => s.status !== 'in_progress')
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .reduce((acc, session) => {
      const date = new Date(session.startedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(session);
      return acc;
    }, {} as Record<string, WorkoutSession[]>);

  const formatMonthYear = (key: string) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return '-';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const mins = Math.round((end - start) / 60000);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedSessionsCount = data.sessions.filter((s) => s.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historique
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {completedSessionsCount} séance{completedSessionsCount > 1 ? 's' : ''} terminée{completedSessionsCount > 1 ? 's' : ''}
          </p>
        </div>
        {completedSessionsCount > 0 && (
          <button
            onClick={() => {
              const completedSessions = data.sessions.filter((s) => s.status !== 'in_progress');
              exportMultipleSessionsToPDF(completedSessions, 'Historique');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Tout exporter (PDF)
          </button>
        )}
      </div>

      {/* Sessions List */}
      {Object.keys(sessionsByMonth).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(sessionsByMonth).map(([monthKey, sessions]) => (
            <div key={monthKey}>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {formatMonthYear(monthKey)}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                {sessions.map((session) => {
                  const date = new Date(session.startedAt);
                  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets, 0);
                  const completedSets = session.exercises.reduce((acc, e) => acc + e.completedSets, 0);
                  const progress = Math.round((completedSets / totalSets) * 100);

                  return (
                    <div
                      key={session.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {session.templateName}
                            </p>
                            {session.status === 'abandoned' && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                                Abandonné
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {date.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                            })}
                            {' • '}
                            {formatDuration(session.startedAt, session.completedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-semibold ${
                              progress === 100
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}>
                              {progress}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {completedSets}/{totalSets}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun historique
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Complétez votre première séance pour voir votre historique ici.
          </p>
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div
          className="modal-bottom-sheet bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setSelectedSession(null)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-lg md:max-h-[85vh] md:mx-4 flex flex-col max-h-[92vh]">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedSession.templateName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedSession.startedAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors touch-target flex items-center justify-center"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats - Fixed */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDuration(selectedSession.startedAt, selectedSession.completedAt)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Durée</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSession.exercises.reduce((acc, e) => acc + e.completedSets, 0)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Séries</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedSession.exercises.length}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Exercices</p>
                </div>
              </div>
            </div>

            {/* Exercises - Scrollable */}
            <div className="modal-scroll-content p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Exercices</h3>
              <div className="space-y-3">
                {selectedSession.exercises.map((exercise, index) => {
                  const exerciseData = getExerciseById(exercise.exerciseId);
                  if (!exerciseData) return null;

                  const isComplete = exercise.completedSets >= exercise.sets;

                  return (
                    <div
                      key={`${exercise.exerciseId}-${index}`}
                      className={`p-3 rounded-lg border ${
                        isComplete
                          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {exerciseData.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {exercise.completedSets}/{exercise.sets} séries • {exercise.reps} reps • {exercise.actualWeight ?? exercise.weight} kg
                          </p>
                        </div>
                        {isComplete && (
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Notes</h3>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    {selectedSession.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0 safe-area-bottom">
              <button
                onClick={() => {
                  exportSessionToPDF(selectedSession);
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 touch-target"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                Exporter en PDF
              </button>
              <button
                onClick={() => {
                  if (confirm('Supprimer cette séance de l\'historique ?')) {
                    deleteSession(selectedSession.id);
                    setSelectedSession(null);
                  }
                }}
                className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors touch-target"
              >
                Supprimer de l'historique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
