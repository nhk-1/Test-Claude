'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { decodeTemplateCode } from '@/lib/templateSharing';
import { getExerciseById } from '@/lib/exercises';
import { TemplateExercise, MUSCLE_CATEGORY_LABELS } from '@/lib/types';
import Link from 'next/link';

function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addTemplate, updateTemplate } = useApp();
  const [code, setCode] = useState('');
  const [decodedTemplate, setDecodedTemplate] = useState<{ name: string; description?: string; exercises: TemplateExercise[] } | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  // Check for code in URL on mount
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleDecode(urlCode);
    }
  }, [searchParams]);

  const handleDecode = (codeToUse?: string) => {
    const codeValue = codeToUse || code;
    if (!codeValue.trim()) {
      setError('Veuillez entrer un code');
      return;
    }

    const decoded = decodeTemplateCode(codeValue.trim());
    if (decoded) {
      setDecodedTemplate(decoded as any);
      setError('');
    } else {
      setError('Code invalide. Vérifiez le code et réessayez.');
      setDecodedTemplate(null);
    }
  };

  const handleImport = () => {
    if (!decodedTemplate) return;

    setImporting(true);

    // Create template and then update it with exercises
    const newTemplate = addTemplate(decodedTemplate.name, decodedTemplate.description);
    updateTemplate(newTemplate.id, { exercises: decodedTemplate.exercises });

    setImporting(false);

    // Redirect to templates
    router.push('/templates');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/templates" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importer un template</h1>
          <p className="text-gray-600 dark:text-gray-400">Importer un template partagé</p>
        </div>
      </div>

      {/* Input Code */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-7 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Code de partage
        </label>
        <div className="flex gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Collez le code de partage ici..."
            className="flex-1 px-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            onKeyDown={(e) => e.key === 'Enter' && handleDecode()}
          />
          <button
            onClick={() => handleDecode()}
            className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            Décoder
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Preview */}
      {decodedTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-7 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {decodedTemplate.name}
                </h2>
                {decodedTemplate.description && (
                  <p className="text-gray-600 dark:text-gray-400">{decodedTemplate.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Exercises List */}
          <div className="p-7">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">
              Exercices ({decodedTemplate.exercises.length})
            </h3>
            <div className="space-y-4">
              {decodedTemplate.exercises.map((ex, index) => {
                const exerciseInfo = getExerciseById(ex.exerciseId);
                const supersetInfo = ex.supersetExerciseId ? getExerciseById(ex.supersetExerciseId) : null;

                return (
                  <div key={index} className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {exerciseInfo?.name || 'Exercice inconnu'}
                          </span>
                          {supersetInfo && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                              Superset
                            </span>
                          )}
                        </div>
                        {exerciseInfo && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {MUSCLE_CATEGORY_LABELS[exerciseInfo.category]}
                          </p>
                        )}
                        {supersetInfo && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                            + {supersetInfo.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ex.sets} × {ex.reps} reps
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {ex.weight} kg • {ex.restTime}s repos
                        </p>
                      </div>
                    </div>
                    {(ex.notes || ex.formCues) && (
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        {ex.formCues && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                            💡 {ex.formCues}
                          </p>
                        )}
                        {ex.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            📝 {ex.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Import Button */}
          <div className="p-7 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              {importing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Importation...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Importer ce template
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Le template sera ajouté à vos templates
            </p>
          </div>
        </div>
      )}

      {/* Help */}
      {!decodedTemplate && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-7">
          <div className="flex gap-4">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                Comment ça marche ?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                <li>1. Demandez à quelqu'un de partager un template depuis l'application</li>
                <li>2. Copiez le code de partage qu'il vous envoie</li>
                <li>3. Collez-le dans le champ ci-dessus et cliquez sur "Décoder"</li>
                <li>4. Vérifiez le template et importez-le dans votre liste</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SharePageContent />
    </Suspense>
  );
}
