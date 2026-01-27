'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { data, exportData, importDataFromFile, resetData } = useApp();
  const { user, isConfigured, signOut } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gérez vos données et préférences
        </p>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Compte
        </h2>
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        ) : isConfigured ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connectez-vous pour synchroniser vos données
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-center py-4">
            Mode hors-ligne - Configurez Supabase pour activer les comptes utilisateurs
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistiques
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.templates}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Templates</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.completedSessions}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Séances terminées</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalExercises}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Exercices planifiés</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {data.version}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Version données</p>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gestion des données
        </h2>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Exporter les données</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Télécharger une sauvegarde au format JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Exporter
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Importer des données</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Restaurer depuis un fichier JSON
              </p>
            </div>
            <div className="flex items-center gap-2">
              {importStatus === 'success' && (
                <span className="text-green-600 dark:text-green-400 text-sm">Import réussi !</span>
              )}
              {importStatus === 'error' && (
                <span className="text-red-600 dark:text-red-400 text-sm">Erreur d'import</span>
              )}
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors flex items-center gap-2"
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
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Zone dangereuse
        </h2>

        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Réinitialiser les données</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supprimer tous les templates et l'historique
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          À propos
        </h2>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium text-gray-900 dark:text-white">FitTracker</span> - Application de gestion de séances de sport
          </p>
          <p className="text-sm">
            Vos données sont stockées localement sur votre appareil. Pensez à faire des sauvegardes régulières.
          </p>
        </div>
      </div>
    </div>
  );
}
