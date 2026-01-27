'use client';

import { useApp } from '@/context/AppContext';
import TemplateCard from '@/components/TemplateCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data, isLoading, startSession, getActiveSession } = useApp();
  const router = useRouter();

  const activeSession = getActiveSession();
  const recentTemplates = data.templates.slice(-3).reverse();
  const completedSessions = data.sessions.filter((s) => s.status === 'completed');
  const thisWeekSessions = completedSessions.filter((s) => {
    const sessionDate = new Date(s.completedAt || s.startedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  });

  const handleStartSession = (template: typeof data.templates[0]) => {
    startSession(template);
    router.push('/session');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenue !
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Prêt pour ton entraînement ?
        </p>
      </div>

      {/* Active Session Alert */}
      {activeSession && (
        <Link
          href="/session"
          className="block bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium opacity-90">Séance en cours</p>
              <p className="text-xl font-bold">{activeSession.templateName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-90">Continuer</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cette semaine</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {thisWeekSessions.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">séances</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {completedSessions.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">séances</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Templates</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {data.templates.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">créés</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">Exercices</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {data.templates.reduce((acc, t) => acc + t.exercises.length, 0)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">planifiés</p>
        </div>
      </div>

      {/* Quick Start */}
      {recentTemplates.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Démarrage rapide
            </h2>
            <Link
              href="/templates"
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onStart={() => handleStartSession(template)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Créez votre premier template
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Commencez par créer un template de séance pour structurer vos entraînements.
          </p>
          <Link
            href="/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Créer un template
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      {completedSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Activité récente
            </h2>
            <Link
              href="/history"
              className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
            >
              Historique
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {completedSessions.slice(-5).reverse().map((session) => {
              const date = new Date(session.completedAt || session.startedAt);
              const totalSets = session.exercises.reduce((acc, e) => acc + e.sets, 0);
              const completedSets = session.exercises.reduce((acc, e) => acc + e.completedSets, 0);

              return (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.templateName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {date.toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">
                      {completedSets}/{totalSets}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">séries</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
