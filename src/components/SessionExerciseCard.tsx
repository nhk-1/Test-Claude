'use client';

import { useState, useEffect } from 'react';
import { SessionExercise, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import RestTimer from './RestTimer';
import { haptics } from '@/lib/haptics';

interface SessionExerciseCardProps {
  exercise: SessionExercise;
  index: number;
  onCompleteSet: () => void;
  onUpdateWeight: (weight: number, setIndex?: number) => void;
  onUpdateSupersetWeight?: (weight: number, setIndex?: number) => void;
  isActive: boolean;
}

export default function SessionExerciseCard({
  exercise,
  index,
  onCompleteSet,
  onUpdateWeight,
  onUpdateSupersetWeight,
  isActive,
}: SessionExerciseCardProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [editingWeightIndex, setEditingWeightIndex] = useState<number | null>(null);
  const [editingSupersetWeightIndex, setEditingSupersetWeightIndex] = useState<number | null>(null);
  const [tempWeights, setTempWeights] = useState<number[]>([]);
  const [tempSupersetWeights, setTempSupersetWeights] = useState<number[]>([]);

  const exerciseData = getExerciseById(exercise.exerciseId);
  const supersetExerciseData = exercise.supersetExerciseId
    ? getExerciseById(exercise.supersetExerciseId)
    : null;

  const isCompleted = exercise.completedSets >= exercise.sets;
  const progress = (exercise.completedSets / exercise.sets) * 100;
  const isSuperset = !!supersetExerciseData;

  // Initialiser les poids temporaires
  useEffect(() => {
    const weights = exercise.actualWeightsPerSet || exercise.weightsPerSet ||
      Array(exercise.sets).fill(exercise.actualWeight ?? exercise.weight);
    setTempWeights(weights);

    if (isSuperset) {
      const supersetWeights = exercise.actualSupersetWeightsPerSet || exercise.supersetWeightsPerSet ||
        Array(exercise.sets).fill(exercise.supersetWeight ?? 0);
      setTempSupersetWeights(supersetWeights);
    }
  }, [exercise, isSuperset]);

  const handleCompleteSet = () => {
    if (!isCompleted) {
      // Haptic feedback
      if (exercise.completedSets + 1 === exercise.sets) {
        // Last set - success pattern
        haptics.success();
      } else {
        // Regular set - medium impact
        haptics.setComplete();
      }

      onCompleteSet();
      if (exercise.completedSets + 1 < exercise.sets) {
        setShowTimer(true);
      }
    }
  };

  const handleWeightChange = (setIndex: number, value: number) => {
    const newWeights = [...tempWeights];
    newWeights[setIndex] = value;
    setTempWeights(newWeights);
  };

  const handleWeightSave = (setIndex: number) => {
    onUpdateWeight(tempWeights[setIndex], setIndex);
    setEditingWeightIndex(null);
  };

  const handleSupersetWeightChange = (setIndex: number, value: number) => {
    const newWeights = [...tempSupersetWeights];
    newWeights[setIndex] = value;
    setTempSupersetWeights(newWeights);
  };

  const handleSupersetWeightSave = (setIndex: number) => {
    if (onUpdateSupersetWeight) {
      onUpdateSupersetWeight(tempSupersetWeights[setIndex], setIndex);
    }
    setEditingSupersetWeightIndex(null);
  };

  // Obtenir le poids pour une série donnée
  const getWeightForSet = (setIndex: number): number => {
    if (exercise.actualWeightsPerSet?.[setIndex] !== undefined) {
      return exercise.actualWeightsPerSet[setIndex];
    }
    if (exercise.weightsPerSet?.[setIndex] !== undefined) {
      return exercise.weightsPerSet[setIndex];
    }
    return exercise.actualWeight ?? exercise.weight;
  };

  const getSupersetWeightForSet = (setIndex: number): number => {
    if (exercise.actualSupersetWeightsPerSet?.[setIndex] !== undefined) {
      return exercise.actualSupersetWeightsPerSet[setIndex];
    }
    if (exercise.supersetWeightsPerSet?.[setIndex] !== undefined) {
      return exercise.supersetWeightsPerSet[setIndex];
    }
    return exercise.supersetWeight ?? 0;
  };

  if (!exerciseData) return null;

  return (
    <>
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-2 transition-all ${
          isActive
            ? 'border-indigo-500 dark:border-indigo-400'
            : isCompleted
            ? 'border-green-500 dark:border-green-400 opacity-75'
            : 'border-transparent'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {exerciseData.name}
              </h3>
              {isSuperset && (
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                  Superset
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
              {MUSCLE_CATEGORY_LABELS[exerciseData.category]}
            </p>
            {isSuperset && supersetExerciseData && (
              <div className="ml-8 mt-2 pl-3 border-l-2 border-purple-300 dark:border-purple-700">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  + {supersetExerciseData.name}
                </p>
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  {MUSCLE_CATEGORY_LABELS[supersetExerciseData.category]}
                </p>
              </div>
            )}
          </div>
          {isCompleted && (
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {exercise.completedSets} / {exercise.sets} séries
          </p>
        </div>

        {/* Poids par série */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
            Poids par série (cliquer pour modifier)
          </p>
          <div className="space-y-3">
            {Array.from({ length: exercise.sets }).map((_, setIdx) => {
              const isSetCompleted = setIdx < exercise.completedSets;
              const isCurrentSet = setIdx === exercise.completedSets;

              return (
                <div
                  key={setIdx}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    isSetCompleted
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : isCurrentSet
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'bg-gray-50 dark:bg-gray-700/30'
                  }`}
                >
                  {/* Numéro de série */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    isSetCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrentSet
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    {isSetCompleted ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      setIdx + 1
                    )}
                  </div>

                  {/* Exercice principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-14">
                        {exercise.maxReps ? `${exercise.minReps ?? exercise.reps}-${exercise.maxReps}` : exercise.reps} reps
                      </span>
                      {editingWeightIndex === setIdx ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleWeightChange(setIdx, Math.max(0, (tempWeights[setIdx] || 0) - 1))}
                            className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center active:bg-gray-300 dark:active:bg-gray-500 touch-target"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={tempWeights[setIdx] || 0}
                            onChange={(e) => handleWeightChange(setIdx, Number(e.target.value))}
                            onBlur={() => handleWeightSave(setIdx)}
                            onKeyDown={(e) => e.key === 'Enter' && handleWeightSave(setIdx)}
                            className="w-14 h-9 text-center font-semibold text-base bg-white dark:bg-gray-700 border-2 border-indigo-500 rounded-lg"
                            autoFocus
                          />
                          <button
                            onClick={() => handleWeightChange(setIdx, (tempWeights[setIdx] || 0) + 1)}
                            className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center active:bg-gray-300 dark:active:bg-gray-500 touch-target"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-500">kg</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingWeightIndex(setIdx)}
                          className="px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg font-semibold text-sm text-gray-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100 transition-colors min-h-[36px]"
                        >
                          {getWeightForSet(setIdx)} kg
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Superset */}
                  {isSuperset && supersetExerciseData && (
                    <div className="flex-1 pl-2 border-l border-purple-200 dark:border-purple-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-500 dark:text-purple-400 w-14">
                          {exercise.supersetMaxReps
                            ? `${exercise.supersetMinReps ?? exercise.supersetReps}-${exercise.supersetMaxReps}`
                            : exercise.supersetReps} reps
                        </span>
                        {editingSupersetWeightIndex === setIdx ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSupersetWeightChange(setIdx, Math.max(0, (tempSupersetWeights[setIdx] || 0) - 1))}
                              className="w-9 h-9 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center active:bg-purple-300 dark:active:bg-purple-700 touch-target"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={tempSupersetWeights[setIdx] || 0}
                              onChange={(e) => handleSupersetWeightChange(setIdx, Number(e.target.value))}
                              onBlur={() => handleSupersetWeightSave(setIdx)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSupersetWeightSave(setIdx)}
                              className="w-14 h-9 text-center font-semibold text-base bg-white dark:bg-gray-700 border-2 border-purple-500 rounded-lg"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSupersetWeightChange(setIdx, (tempSupersetWeights[setIdx] || 0) + 1)}
                              className="w-9 h-9 rounded-lg bg-purple-200 dark:bg-purple-800 flex items-center justify-center active:bg-purple-300 dark:active:bg-purple-700 touch-target"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                            <span className="text-xs text-purple-500">kg</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSupersetWeightIndex(setIdx)}
                            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg font-semibold text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 active:bg-purple-200 transition-colors min-h-[36px]"
                          >
                            {getSupersetWeightForSet(setIdx)} kg
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes et Form Cues */}
        {(exercise.notes || exercise.formCues || exercise.videoUrl) && (
          <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            {exercise.formCues && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                  </svg>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Form Cues</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{exercise.formCues}</p>
              </div>
            )}
            {exercise.notes && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Notes</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{exercise.notes}</p>
              </div>
            )}
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Voir vidéo de référence
              </a>
            )}
          </div>
        )}

        {/* Repos */}
        <div className="flex items-center justify-between mb-5 text-sm text-gray-500 dark:text-gray-400">
          <span>Temps de repos</span>
          <span className="font-medium text-gray-900 dark:text-white">{exercise.restTime}s</span>
        </div>

        {/* Actions */}
        {!isCompleted && (
          <button
            onClick={handleCompleteSet}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 touch-target text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Valider la série {exercise.completedSets + 1}
            {isSuperset && ' (superset)'}
          </button>
        )}
      </div>

      {showTimer && (
        <RestTimer
          initialTime={exercise.restTime}
          onComplete={() => setShowTimer(false)}
          onClose={() => setShowTimer(false)}
        />
      )}
    </>
  );
}
