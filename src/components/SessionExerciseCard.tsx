'use client';

import { useState } from 'react';
import { SessionExercise, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import RestTimer from './RestTimer';

interface SessionExerciseCardProps {
  exercise: SessionExercise;
  index: number;
  onCompleteSet: () => void;
  onUpdateWeight: (weight: number) => void;
  isActive: boolean;
}

export default function SessionExerciseCard({
  exercise,
  index,
  onCompleteSet,
  onUpdateWeight,
  isActive,
}: SessionExerciseCardProps) {
  const [showTimer, setShowTimer] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(exercise.actualWeight ?? exercise.weight);

  const exerciseData = getExerciseById(exercise.exerciseId);
  const isCompleted = exercise.completedSets >= exercise.sets;
  const progress = (exercise.completedSets / exercise.sets) * 100;

  const handleCompleteSet = () => {
    if (!isCompleted) {
      onCompleteSet();
      if (exercise.completedSets + 1 < exercise.sets) {
        setShowTimer(true);
      }
    }
  };

  const handleWeightSave = () => {
    onUpdateWeight(tempWeight);
    setEditingWeight(false);
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
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-8">
              {MUSCLE_CATEGORY_LABELS[exerciseData.category]}
            </p>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Reps</p>
            <p className="font-semibold text-gray-900 dark:text-white">{exercise.reps}</p>
          </div>
          <div
            className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setEditingWeight(true)}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">Poids</p>
            {editingWeight ? (
              <input
                type="number"
                value={tempWeight}
                onChange={(e) => setTempWeight(Number(e.target.value))}
                onBlur={handleWeightSave}
                onKeyDown={(e) => e.key === 'Enter' && handleWeightSave()}
                className="w-full font-semibold text-gray-900 dark:text-white bg-transparent text-center focus:outline-none"
                autoFocus
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                {exercise.actualWeight ?? exercise.weight} kg
              </p>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Repos</p>
            <p className="font-semibold text-gray-900 dark:text-white">{exercise.restTime}s</p>
          </div>
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
