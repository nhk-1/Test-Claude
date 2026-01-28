'use client';

import { useState, useEffect } from 'react';
import { exercises, getAllCategories } from '@/lib/exercises';
import { MuscleCategory, MUSCLE_CATEGORY_LABELS, Exercise, TemplateExercise } from '@/lib/types';

interface ExerciseSelectorProps {
  onSelect: (exercise: TemplateExercise) => void;
  onClose: () => void;
}

export default function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [weight, setWeight] = useState(20);
  const [restTime, setRestTime] = useState(90);

  // Poids par série
  const [useWeightsPerSet, setUseWeightsPerSet] = useState(false);
  const [weightsPerSet, setWeightsPerSet] = useState<number[]>([20, 20, 20]);

  // Superset
  const [isSuperset, setIsSuperset] = useState(false);
  const [supersetExercise, setSupersetExercise] = useState<Exercise | null>(null);
  const [selectingSupersetExercise, setSelectingSupersetExercise] = useState(false);
  const [supersetReps, setSupersetReps] = useState(12);
  const [supersetWeight, setSupersetWeight] = useState(20);
  const [useSupersetWeightsPerSet, setUseSupersetWeightsPerSet] = useState(false);
  const [supersetWeightsPerSet, setSupersetWeightsPerSet] = useState<number[]>([20, 20, 20]);

  const categories = getAllCategories();

  const filteredExercises = exercises.filter((e) => {
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Mettre à jour les tableaux de poids quand le nombre de séries change
  useEffect(() => {
    setWeightsPerSet((prev) => {
      const newWeights = [...prev];
      while (newWeights.length < sets) {
        newWeights.push(newWeights[newWeights.length - 1] || weight);
      }
      return newWeights.slice(0, sets);
    });
    setSupersetWeightsPerSet((prev) => {
      const newWeights = [...prev];
      while (newWeights.length < sets) {
        newWeights.push(newWeights[newWeights.length - 1] || supersetWeight);
      }
      return newWeights.slice(0, sets);
    });
  }, [sets, weight, supersetWeight]);

  const handleConfirm = () => {
    if (selectedExercise) {
      const exercise: TemplateExercise = {
        exerciseId: selectedExercise.id,
        sets,
        reps,
        weight: useWeightsPerSet ? weightsPerSet[0] : weight,
        weightsPerSet: useWeightsPerSet ? weightsPerSet : undefined,
        restTime,
      };

      if (isSuperset && supersetExercise) {
        exercise.supersetExerciseId = supersetExercise.id;
        exercise.supersetReps = supersetReps;
        exercise.supersetWeight = useSupersetWeightsPerSet ? supersetWeightsPerSet[0] : supersetWeight;
        exercise.supersetWeightsPerSet = useSupersetWeightsPerSet ? supersetWeightsPerSet : undefined;
      }

      onSelect(exercise);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    if (selectingSupersetExercise) {
      setSupersetExercise(exercise);
      setSelectingSupersetExercise(false);
    } else {
      setSelectedExercise(exercise);
    }
  };

  const updateWeightPerSet = (index: number, value: number) => {
    setWeightsPerSet((prev) => {
      const newWeights = [...prev];
      newWeights[index] = value;
      return newWeights;
    });
  };

  const updateSupersetWeightPerSet = (index: number, value: number) => {
    setSupersetWeightsPerSet((prev) => {
      const newWeights = [...prev];
      newWeights[index] = value;
      return newWeights;
    });
  };

  // Vue de sélection d'exercice (liste)
  const renderExerciseList = () => (
    <>
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          placeholder="Rechercher un exercice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {MUSCLE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => handleSelectExercise(exercise)}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{exercise.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {MUSCLE_CATEGORY_LABELS[exercise.category]}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))}
          {filteredExercises.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Aucun exercice trouvé
            </p>
          )}
        </div>
      </div>
    </>
  );

  // Vue de configuration de l'exercice
  const renderExerciseConfig = () => (
    <>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <button
            onClick={() => {
              if (selectingSupersetExercise) {
                setSelectingSupersetExercise(false);
              } else {
                setSelectedExercise(null);
                setIsSuperset(false);
                setSupersetExercise(null);
              }
            }}
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Retour
          </button>
        </div>

        {/* Exercice principal */}
        <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{selectedExercise?.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedExercise?.description}
          </p>
        </div>

        {/* Toggle Superset */}
        <div className="mb-6">
          <button
            onClick={() => {
              setIsSuperset(!isSuperset);
              if (!isSuperset) {
                setSelectingSupersetExercise(true);
              } else {
                setSupersetExercise(null);
              }
            }}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
              isSuperset
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSuperset ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Superset</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ajouter un 2ème exercice</p>
              </div>
            </div>
            {isSuperset && (
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Superset Exercise Selection */}
        {isSuperset && (
          <div className="mb-6">
            {supersetExercise ? (
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">2ème exercice</p>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{supersetExercise.name}</h4>
                  </div>
                  <button
                    onClick={() => setSelectingSupersetExercise(true)}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Changer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectingSupersetExercise(true)}
                className="w-full p-4 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                + Sélectionner le 2ème exercice
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Sets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de séries
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSets(Math.max(1, sets - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{sets}</span>
              <button
                onClick={() => setSets(sets + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Reps - Exercice 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Répétitions {isSuperset && supersetExercise && `(${selectedExercise?.name})`}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReps(Math.max(1, reps - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{reps}</span>
              <button
                onClick={() => setReps(reps + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Reps - Exercice 2 (Superset) */}
          {isSuperset && supersetExercise && (
            <div>
              <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                Répétitions ({supersetExercise.name})
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSupersetReps(Math.max(1, supersetReps - 1))}
                  className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">{supersetReps}</span>
                <button
                  onClick={() => setSupersetReps(supersetReps + 1)}
                  className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Weight - Exercice 1 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Poids (kg) {isSuperset && supersetExercise && `- ${selectedExercise?.name}`}
              </label>
              <button
                onClick={() => setUseWeightsPerSet(!useWeightsPerSet)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  useWeightsPerSet
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {useWeightsPerSet ? 'Par série' : 'Uniforme'}
              </button>
            </div>

            {useWeightsPerSet ? (
              <div className="space-y-2">
                {weightsPerSet.map((w, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-16">Série {i + 1}</span>
                    <button
                      onClick={() => updateWeightPerSet(i, Math.max(0, w - 1))}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="text-lg font-bold text-gray-900 dark:text-white w-12 text-center">{w}</span>
                    <button
                      onClick={() => updateWeightPerSet(i, w + 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">kg</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setWeight(Math.max(0, weight - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                </button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white w-16 text-center">{weight}</span>
                <button
                  onClick={() => setWeight(weight + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Weight - Exercice 2 (Superset) */}
          {isSuperset && supersetExercise && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Poids (kg) - {supersetExercise.name}
                </label>
                <button
                  onClick={() => setUseSupersetWeightsPerSet(!useSupersetWeightsPerSet)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    useSupersetWeightsPerSet
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {useSupersetWeightsPerSet ? 'Par série' : 'Uniforme'}
                </button>
              </div>

              {useSupersetWeightsPerSet ? (
                <div className="space-y-2">
                  {supersetWeightsPerSet.map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-purple-500 dark:text-purple-400 w-16">Série {i + 1}</span>
                      <button
                        onClick={() => updateSupersetWeightPerSet(i, Math.max(0, w - 1))}
                        className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      </button>
                      <span className="text-lg font-bold text-gray-900 dark:text-white w-12 text-center">{w}</span>
                      <button
                        onClick={() => updateSupersetWeightPerSet(i, w + 1)}
                        className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                      <span className="text-sm text-purple-500 dark:text-purple-400">kg</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSupersetWeight(Math.max(0, supersetWeight - 1))}
                    className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white w-16 text-center">{supersetWeight}</span>
                  <button
                    onClick={() => setSupersetWeight(supersetWeight + 1)}
                    className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rest Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temps de repos (secondes)
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setRestTime(Math.max(15, restTime - 15))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="text-2xl font-bold text-gray-900 dark:text-white w-16 text-center">{restTime}s</span>
              <button
                onClick={() => setRestTime(restTime + 15)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleConfirm}
          disabled={isSuperset && !supersetExercise}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          {isSuperset && supersetExercise
            ? 'Ajouter le superset'
            : 'Ajouter l\'exercice'}
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectingSupersetExercise
              ? 'Choisir le 2ème exercice'
              : selectedExercise
              ? 'Configurer l\'exercice'
              : 'Ajouter un exercice'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!selectedExercise || selectingSupersetExercise
          ? renderExerciseList()
          : renderExerciseConfig()}
      </div>
    </div>
  );
}
