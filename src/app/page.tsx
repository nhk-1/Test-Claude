'use client';

import { useApp } from '@/context/AppContext';
import TemplateCard from '@/components/TemplateCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

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

  // Calculate workout streak
  const streak = useMemo(() => {
    if (completedSessions.length === 0) return 0;

    const sorted = [...completedSessions]
      .sort((a, b) => new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime());

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    for (const session of sorted) {
      const sessionDate = new Date(session.completedAt || session.startedAt);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === currentStreak || diffDays === currentStreak + 1) {
        if (diffDays === currentStreak + 1) {
          currentStreak++;
        }
        checkDate = new Date(sessionDate);
      } else {
        break;
      }
    }

    return currentStreak;
  }, [completedSessions]);

  const handleStartSession = (template: typeof data.templates[0]) => {
    startSession(template);
    router.push('/session');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <header className="page-header mb-10 md:mb-14">
        <h1 className="page-title">
          Bienvenue !
        </h1>
        <p className="page-subtitle mt-3">
          Prêt pour ton entraînement ?
        </p>
      </header>

      {/* Active Session Alert */}
      {activeSession && (
        <Link
          href="/session"
          className="block gradient-bg rounded-2xl p-7 md:p-10 text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 mb-12"
        >
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/80 tracking-wide">Séance en cours</p>
              <p className="text-2xl md:text-3xl font-bold">{activeSession.templateName}</p>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-base font-semibold text-white/90 hidden sm:block">Continuer</span>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <section className="mb-14 md:mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8">
          {/* Streak Card - Special styling */}
          {streak > 0 && (
            <div className="gradient-bg-warm rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-orange-500/20">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                  </svg>
                </div>
                <p className="text-base font-bold text-white/90">Série</p>
              </div>
              <p className="text-5xl md:text-6xl font-bold tracking-tight">{streak}</p>
              <p className="text-base text-white/80 mt-3 font-semibold">{streak === 1 ? 'jour' : 'jours'} consécutifs</p>
            </div>
          )}

          {/* This Week */}
          <div className="stat-card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Cette semaine</p>
            <p className="stat-value">{thisWeekSessions.length}</p>
            <p className="stat-label">séances</p>
          </div>

          {/* Total Sessions */}
          <div className="stat-card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Total</p>
            <p className="stat-value">{completedSessions.length}</p>
            <p className="stat-label">séances</p>
          </div>

          {/* Templates */}
          <div className="stat-card">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Templates</p>
            <p className="stat-value">{data.templates.length}</p>
            <p className="stat-label">créés</p>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      {recentTemplates.length > 0 ? (
        <section className="mb-14 md:mb-16">
          <div className="section-header">
            <h2 className="section-title">Démarrage rapide</h2>
            <Link href="/templates" className="section-link">
              Voir tout
            </Link>
          </div>
          <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recentTemplates.map((template, index) => (
              <div key={template.id} className={`stagger-${index + 1}`}>
                <TemplateCard
                  template={template}
                  onStart={() => handleStartSession(template)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="card text-center mb-14">
          <div className="empty-state-icon mx-auto">
            <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="empty-state-title">
            Créez votre premier template
          </h3>
          <p className="empty-state-description mx-auto">
            Commencez par créer un template de séance pour structurer vos entraînements.
          </p>
          <Link
            href="/templates/new"
            className="btn btn-primary px-10 py-5 text-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Créer un template
          </Link>
        </section>
      )}

      {/* Recent Activity */}
      {completedSessions.length > 0 && (
        <section>
          <div className="section-header">
            <h2 className="section-title">Activité récente</h2>
            <Link href="/history" className="section-link">
              Historique
            </Link>
          </div>
          <div className="card card-flush overflow-hidden">
            {completedSessions.slice(-5).reverse().map((session, index, array) => {
              const date = new Date(session.completedAt || session.startedAt);
              const totalSets = session.exercises.reduce((acc, e) => acc + e.sets, 0);
              const completedSets = session.exercises.reduce((acc, e) => acc + e.completedSets, 0);
              const isLast = index === array.length - 1;

              return (
                <div
                  key={session.id}
                  className={`
                    p-6 md:p-8 flex items-center justify-between gap-4
                    ${!isLast ? 'border-b border-slate-100 dark:border-slate-800' : ''}
                    hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                  `}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900 dark:text-white">
                        {session.templateName}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {date.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-indigo-600 dark:text-indigo-400">
                      {completedSets}/{totalSets}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">séries</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
