'use client';

import { WorkoutTemplate, MUSCLE_CATEGORY_LABELS, MuscleCategory } from '@/lib/types';
import { getExerciseById } from '@/lib/exercises';
import Link from 'next/link';

interface TemplateCardProps {
  template: WorkoutTemplate;
  onStart?: () => void;
  onDelete?: () => void;
}

export default function TemplateCard({ template, onStart, onDelete }: TemplateCardProps) {
  // Get unique muscle categories
  const categories = [...new Set(
    template.exercises
      .map((e) => getExerciseById(e.exerciseId)?.category)
      .filter((c): c is MuscleCategory => c !== undefined)
  )];

  const totalSets = template.exercises.reduce((acc, e) => acc + e.sets, 0);
  const exerciseCount = template.exercises.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/templates/${template.id}`}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </Link>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Supprimer ce template ?')) {
                  onDelete();
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-3">
        {categories.map((cat) => (
          <span
            key={cat}
            className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full"
          >
            {MUSCLE_CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
          {totalSets} série{totalSets > 1 ? 's' : ''}
        </span>
      </div>

      {/* Start Button */}
      {onStart && (
        <button
          onClick={onStart}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
          Démarrer la séance
        </button>
      )}
    </div>
  );
}
