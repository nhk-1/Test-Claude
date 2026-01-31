'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleDailyReminder,
  cancelScheduledReminder,
  showWorkoutReminderNotification,
} from '@/lib/notifications';

export default function SettingsPage() {
  const { data, exportData, importDataFromFile, resetData, getNotificationSettings, updateNotificationSettings } = useApp();
  const { user, isConfigured, signOut } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationPermission, setNotificationPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const reminderTimerRef = useRef<number | null>(null);

  const notificationSettings = getNotificationSettings();

  // Check notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(getNotificationPermission());
    }
  }, []);

  // Set up daily reminders
  useEffect(() => {
    if (reminderTimerRef.current) {
      cancelScheduledReminder(reminderTimerRef.current);
    }

    if (
      notificationSettings.enabled &&
      notificationSettings.dailyReminders &&
      notificationPermission === 'granted' &&
      notificationSettings.reminderTime
    ) {
      const { hour, minute } = notificationSettings.reminderTime;
      const message = notificationSettings.reminderMessage || "C'est l'heure de votre entraînement !";
      reminderTimerRef.current = scheduleDailyReminder(hour, minute, message);
    }

    return () => {
      if (reminderTimerRef.current) {
        cancelScheduledReminder(reminderTimerRef.current);
      }
    };
  }, [notificationSettings, notificationPermission]);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      updateNotificationSettings({ enabled: true });
    }
  };

  const handleTestNotification = () => {
    showWorkoutReminderNotification("Ceci est une notification de test !");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await importDataFromFile(file);
    setImportStatus(success ? 'success' : 'error');

    // Reset status after 3 seconds
    setTimeout(() => setImportStatus('idle'), 3000);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes vos données ? Cette action est irréversible.')) {
      if (confirm('Dernière confirmation : toutes les données seront perdues.')) {
        resetData();
      }
    }
  };

  const stats = {
    templates: data.templates.length,
    sessions: data.sessions.length,
    completedSessions: data.sessions.filter((s) => s.status === 'completed').length,
    totalExercises: data.templates.reduce((acc, t) => acc + t.exercises.length, 0),
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <header className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">
          Gérez vos données et préférences
        </p>
      </header>

      {/* Account */}
      <section className="card p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          Compte
        </h2>
        {user ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-2xl font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-lg">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-secondary w-full py-4"
            >
              Se déconnecter
            </button>
          </div>
        ) : isConfigured ? (
          <div className="text-center py-6">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Connectez-vous pour synchroniser vos données
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="btn btn-primary py-3 px-6"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="btn btn-secondary py-3 px-6"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-4">
            Mode hors-ligne - Configurez Supabase pour activer les comptes utilisateurs
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="card p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          Statistiques
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="stat-value">{stats.templates}</p>
            <p className="stat-label">Templates</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.completedSessions}</p>
            <p className="stat-label">Séances terminées</p>
          </div>
          <div className="stat-card">
            <p className="stat-value">{stats.totalExercises}</p>
            <p className="stat-label">Exercices planifiés</p>
          </div>
          <div className="stat-card">
            <p className="stat-value text-lg">{data.version}</p>
            <p className="stat-label">Version données</p>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="card p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          Gestion des données
        </h2>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Exporter les données</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Télécharger une sauvegarde au format JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              className="btn btn-primary py-2.5 px-5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exporter
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Importer des données</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Restaurer depuis un fichier JSON
              </p>
            </div>
            <div className="flex items-center gap-3">
              {importStatus === 'success' && (
                <span className="badge badge-success">Import réussi !</span>
              )}
              {importStatus === 'error' && (
                <span className="badge badge-danger">Erreur d'import</span>
              )}
              <button
                onClick={handleImportClick}
                className="btn btn-secondary py-2.5 px-5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                Importer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card p-6 md:p-8 border-2 border-red-200 dark:border-red-500/30">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          Zone dangereuse
        </h2>

        <div className="flex items-center justify-between p-5 bg-red-50 dark:bg-red-500/10 rounded-xl">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Réinitialiser les données</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supprimer tous les templates et l'historique
            </p>
          </div>
          <button
            onClick={handleReset}
            className="py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {/* About */}
      <section className="card p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          À propos
        </h2>
        <div className="space-y-4 text-slate-600 dark:text-slate-400">
          <p>
            <span className="font-bold text-slate-900 dark:text-white">FitTracker</span> - Application de gestion de séances de sport
          </p>
          <p className="text-sm leading-relaxed">
            Vos données sont stockées localement sur votre appareil. Pensez à faire des sauvegardes régulières.
          </p>
        </div>
      </section>
    </div>
  );
}
