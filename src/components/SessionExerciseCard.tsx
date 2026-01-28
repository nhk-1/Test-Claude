'use client';

import { useState, useEffect } from 'react';
import { SessionExercise, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import RestTimer from './RestTimer';

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
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 transition-all ${
          isActive
            ? 'border-indigo-500 dark:border-indigo-400'
            : isCompleted
            ? 'border-green-500 dark:border-green-400 opacity-75'
            : 'border-transparent'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
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
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {exercise.completedSets} / {exercise.sets} séries
          </p>
        </div>

        {/* Poids par série */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
            Poids par série (cliquer pour modifier)
          </p>
          <div className="space-y-2">
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
                            className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            value={tempWeights[setIdx] || 0}
                            onChange={(e) => handleWeightChange(setIdx, Number(e.target.value))}
                            onBlur={() => handleWeightSave(setIdx)}
                            onKeyDown={(e) => e.key === 'Enter' && handleWeightSave(setIdx)}
                            className="w-12 text-center font-semibold text-sm bg-white dark:bg-gray-700 border border-indigo-500 rounded px-1 py-0.5"
                            autoFocus
                          />
                          <button
                            onClick={() => handleWeightChange(setIdx, (tempWeights[setIdx] || 0) + 1)}
                            className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                          <span className="text-xs text-gray-500">kg</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingWeightIndex(setIdx)}
                          className="px-2 py-0.5 bg-white dark:bg-gray-700 rounded font-semibold text-sm text-gray-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
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
                              className="w-6 h-6 rounded bg-purple-200 dark:bg-purple-800 flex items-center justify-center"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              value={tempSupersetWeights[setIdx] || 0}
                              onChange={(e) => handleSupersetWeightChange(setIdx, Number(e.target.value))}
                              onBlur={() => handleSupersetWeightSave(setIdx)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSupersetWeightSave(setIdx)}
                              className="w-12 text-center font-semibold text-sm bg-white dark:bg-gray-700 border border-purple-500 rounded px-1 py-0.5"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSupersetWeightChange(setIdx, (tempSupersetWeights[setIdx] || 0) + 1)}
                              className="w-6 h-6 rounded bg-purple-200 dark:bg-purple-800 flex items-center justify-center"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              </svg>
                            </button>
                            <span className="text-xs text-purple-500">kg</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSupersetWeightIndex(setIdx)}
                            className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/30 rounded font-semibold text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
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

        {/* Repos */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Temps de repos</span>
          <span className="font-medium text-gray-900 dark:text-white">{exercise.restTime}s</span>
        </div>

        {/* Actions */}
        {!isCompleted && (
          <button
            onClick={handleCompleteSet}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
