'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import SessionExerciseCard from '@/components/SessionExerciseCard';
import Link from 'next/link';

export default function SessionPage() {
  const {
    data,
    isLoading,
    getActiveSession,
    completeSet,
    updateSessionExercise,
    completeSession,
    abandonSession,
  } = useApp();
  const router = useRouter();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const activeSession = getActiveSession();

  // Timer
  useEffect(() => {
    if (!activeSession) return;

    const startTime = new Date(activeSession.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Auto-advance to next incomplete exercise
  useEffect(() => {
    if (!activeSession) return;

    const nextIncomplete = activeSession.exercises.findIndex(
      (e) => e.completedSets < e.sets
    );
    if (nextIncomplete !== -1 && nextIncomplete !== activeExerciseIndex) {
      setActiveExerciseIndex(nextIncomplete);
    }
  }, [activeSession, activeExerciseIndex]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteSet = (exerciseIndex: number) => {
    if (!activeSession) return;
    completeSet(activeSession.id, exerciseIndex);
  };

  const handleUpdateWeight = (exerciseIndex: number, weight: number) => {
    if (!activeSession) return;
    updateSessionExercise(activeSession.id, exerciseIndex, { actualWeight: weight });
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    completeSession(activeSession.id, sessionNotes || undefined);
    setShowCompleteModal(false);
    router.push('/history');
  };

  const handleAbandonSession = () => {
    if (!activeSession) return;
    if (confirm('Êtes-vous sûr de vouloir abandonner cette séance ?')) {
      abandonSession(activeSession.id);
      router.push('/');
    }
  };

  const isSessionComplete = activeSession?.exercises.every(
    (e) => e.completedSets >= e.sets
  );

  const totalSets = activeSession?.exercises.reduce((acc, e) => acc + e.sets, 0) || 0;
  const completedSets = activeSession?.exercises.reduce((acc, e) => acc + e.completedSets, 0) || 0;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Séance d'entraînement
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Pas de séance en cours
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Démarrez une séance à partir d'un de vos templates.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Voir les templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeSession.templateName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Séance en cours
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatTime(elapsedTime)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">durée</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {completedSets}/{totalSets} séries
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {activeSession.exercises.map((exercise, index) => (
          <SessionExerciseCard
            key={`${exercise.exerciseId}-${index}`}
            exercise={exercise}
            index={index}
            isActive={index === activeExerciseIndex}
            onCompleteSet={() => handleCompleteSet(index)}
            onUpdateWeight={(weight) => handleUpdateWeight(index, weight)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="sticky bottom-20 md:bottom-4 bg-gray-50 dark:bg-gray-950 py-4 -mx-4 px-4 space-y-3">
        {isSessionComplete ? (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Terminer la séance
          </button>
        ) : (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Terminer la séance ({Math.round(progress)}% complété)
          </button>
        )}
        <button
          onClick={handleAbandonSession}
          className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
        >
          Abandonner
        </button>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Terminer la séance
            </h2>

            <div className="mb-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <span className="text-gray-700 dark:text-gray-300">Progression</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {completedSets}/{totalSets} séries ({Math.round(progress)}%)
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Comment s'est passée la séance ?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleFinishSession}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
