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

  const handleUpdateWeight = (exerciseIndex: number, weight: number, setIndex?: number) => {
    if (!activeSession) return;
    const exercise = activeSession.exercises[exerciseIndex];

    if (setIndex !== undefined) {
      const currentWeights = exercise.actualWeightsPerSet ||
        exercise.weightsPerSet ||
        Array(exercise.sets).fill(exercise.actualWeight ?? exercise.weight);
      const newWeights = [...currentWeights];
      newWeights[setIndex] = weight;
      updateSessionExercise(activeSession.id, exerciseIndex, { actualWeightsPerSet: newWeights });
    } else {
      updateSessionExercise(activeSession.id, exerciseIndex, { actualWeight: weight });
    }
  };

  const handleUpdateSupersetWeight = (exerciseIndex: number, weight: number, setIndex?: number) => {
    if (!activeSession) return;
    const exercise = activeSession.exercises[exerciseIndex];

    if (setIndex !== undefined) {
      const currentWeights = exercise.actualSupersetWeightsPerSet ||
        exercise.supersetWeightsPerSet ||
        Array(exercise.sets).fill(exercise.supersetWeight ?? 0);
      const newWeights = [...currentWeights];
      newWeights[setIndex] = weight;
      updateSessionExercise(activeSession.id, exerciseIndex, { actualSupersetWeightsPerSet: newWeights });
    }
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
        <div className="spinner" />
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="animate-fade-in">
        <header className="page-header">
          <h1 className="page-title">Séance d'entraînement</h1>
        </header>

        <section className="card p-10 md:p-16 text-center">
          <div className="empty-state-icon mx-auto">
            <svg className="w-9 h-9 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
          <h3 className="empty-state-title">Pas de séance en cours</h3>
          <p className="empty-state-description mx-auto">
            Démarrez une séance à partir d'un de vos templates.
          </p>
          <Link
            href="/templates"
            className="btn btn-primary px-8 py-4"
          >
            Voir les templates
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Session Header Card */}
      <section className="card-elevated p-6 md:p-8 mb-8">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {activeSession.templateName}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Séance en cours
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl md:text-4xl font-bold gradient-text tabular-nums">
              {formatTime(elapsedTime)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">durée</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Progression</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {completedSets}/{totalSets} séries
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Exercises */}
      <section className="space-y-5">
        {activeSession.exercises.map((exercise, index) => (
          <SessionExerciseCard
            key={`${exercise.exerciseId}-${index}`}
            exercise={exercise}
            index={index}
            isActive={index === activeExerciseIndex}
            onCompleteSet={() => handleCompleteSet(index)}
            onUpdateWeight={(weight, setIndex) => handleUpdateWeight(index, weight, setIndex)}
            onUpdateSupersetWeight={(weight, setIndex) => handleUpdateSupersetWeight(index, weight, setIndex)}
          />
        ))}
      </section>

      {/* Actions */}
      <section className="mt-10 space-y-4">
        {isSessionComplete ? (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 touch-target shadow-lg shadow-emerald-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Terminer la séance
          </button>
        ) : (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="btn btn-primary w-full py-4 text-base"
          >
            Terminer la séance ({Math.round(progress)}% complété)
          </button>
        )}
        <button
          onClick={handleAbandonSession}
          className="btn btn-secondary w-full py-4 text-base"
        >
          Abandonner
        </button>
      </section>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div
          className="modal-bottom-sheet"
          onClick={(e) => e.target === e.currentTarget && setShowCompleteModal(false)}
        >
          <div className="modal-content p-8 md:p-10 safe-area-bottom">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              Terminer la séance
            </h2>

            {/* Progress Summary */}
            <div className="mb-8">
              <div className="flex items-center justify-between p-5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Progression</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">
                  {completedSets}/{totalSets} séries ({Math.round(progress)}%)
                </span>
              </div>
            </div>

            {/* Notes Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Notes (optionnel)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Comment s'est passée la séance ?"
                rows={4}
                className="input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn btn-secondary flex-1 py-4"
              >
                Annuler
              </button>
              <button
                onClick={handleFinishSession}
                className="flex-1 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 touch-target"
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
