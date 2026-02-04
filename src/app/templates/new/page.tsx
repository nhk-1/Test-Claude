'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import ExerciseSelector from '@/components/ExerciseSelector';
import { TemplateExercise, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';

export default function NewTemplatePage() {
  const { addTemplate, addExerciseToTemplate, removeExerciseFromTemplate, updateExerciseInTemplate } = useApp();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddExercise = (exercise: TemplateExercise) => {
    setExercises([...exercises, exercise]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<TemplateExercise>) => {
    setExercises(exercises.map((e, i) => (i === index ? { ...e, ...updates } : e)));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Veuillez entrer un nom pour le template');
      return;
    }

    const template = addTemplate(name.trim(), description.trim() || undefined);

    // Add exercises to the template
    exercises.forEach((exercise) => {
      addExerciseToTemplate(template.id, exercise);
    });

    router.push('/templates');
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    const newExercises = [...exercises];
    const [removed] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, removed);
    setExercises(newExercises);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nouveau template
        </h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-7 shadow-sm space-y-7">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Nom du template *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Push Day, Leg Day..."
            className="w-full px-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Description (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de la séance..."
            rows={2}
            className="w-full px-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Exercises */}
      <div>
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Exercices ({exercises.length})
          </h2>
          <button
            onClick={() => setShowExerciseSelector(true)}
            className="flex items-center gap-3 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Ajouter
          </button>
        </div>

        {exercises.length > 0 ? (
          <div className="space-y-5">
            {exercises.map((exercise, index) => {
              const exerciseData = getExerciseById(exercise.exerciseId);
              if (!exerciseData) return null;

              return (
                <div
                  key={`${exercise.exerciseId}-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        {index > 0 && (
                          <button
                            onClick={() => moveExercise(index, index - 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                            </svg>
                          </button>
                        )}
                        {index < exercises.length - 1 && (
                          <button
                            onClick={() => moveExercise(index, index + 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {exerciseData.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {MUSCLE_CATEGORY_LABELS[exerciseData.category]}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>

                  {/* Superset indicator */}
                  {exercise.supersetExerciseId && (
                    <div className="mb-4 pl-3 border-l-2 border-purple-400">
                      {(() => {
                        const supersetData = getExerciseById(exercise.supersetExerciseId!);
                        return supersetData ? (
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                              Superset
                            </span>
                            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                              + {supersetData.name}
                            </span>
                            <span className="text-xs text-purple-500 dark:text-purple-400">
                              ({exercise.supersetReps} reps, {exercise.supersetWeight}kg)
                            </span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Weights per set indicator */}
                  {exercise.weightsPerSet && (
                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                      <span className="font-medium">Poids par série:</span>{' '}
                      {exercise.weightsPerSet.map((w, i) => (
                        <span key={i}>
                          {i > 0 && ' → '}
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{w}kg</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Exercise Config */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Séries</p>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => handleUpdateExercise(index, { sets: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="w-full bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Reps</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={exercise.minReps ?? exercise.reps}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            handleUpdateExercise(index, {
                              minReps: val,
                              reps: val,
                              maxReps: exercise.maxReps && exercise.maxReps > val ? exercise.maxReps : undefined
                            });
                          }}
                          min={1}
                          className="w-full bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none text-center"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          value={exercise.maxReps ?? ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                            handleUpdateExercise(index, { maxReps: val });
                          }}
                          min={exercise.minReps ?? exercise.reps}
                          placeholder="?"
                          className="w-full bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none text-center placeholder:text-gray-300 dark:placeholder:text-gray-600"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Poids (kg)</p>
                      <input
                        type="number"
                        value={exercise.weightsPerSet ? exercise.weightsPerSet[0] : exercise.weight}
                        onChange={(e) => handleUpdateExercise(index, { weight: parseFloat(e.target.value) || 0 })}
                        min={0}
                        step={1}
                        className="w-full bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Repos (s)</p>
                      <input
                        type="number"
                        value={exercise.restTime}
                        onChange={(e) => handleUpdateExercise(index, { restTime: parseInt(e.target.value) || 30 })}
                        min={15}
                        step={15}
                        className="w-full bg-transparent font-semibold text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-7">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Ajoutez des exercices à votre template
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="sticky bottom-20 md:bottom-4 bg-gray-50 dark:bg-gray-950 py-5 -mx-4 px-4">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          Créer le template
        </button>
      </div>

      {/* Exercise Selector Modal */}
      {showExerciseSelector && (
        <ExerciseSelector
          onSelect={handleAddExercise}
          onClose={() => setShowExerciseSelector(false)}
        />
      )}
    </div>
  );
}
