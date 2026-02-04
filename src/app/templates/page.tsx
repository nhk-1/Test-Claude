'use client';

import { useApp } from '@/context/AppContext';
import TemplateCard from '@/components/TemplateCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const { data, isLoading, deleteTemplate, startSession } = useApp();
  const router = useRouter();

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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-10 md:mb-12">
        <div className="page-header mb-0">
          <h1 className="page-title">Templates de séances</h1>
          <p className="page-subtitle">
            Créez et gérez vos programmes d'entraînement
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link
            href="/templates/share"
            className="btn btn-secondary py-4 px-5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Importer</span>
          </Link>
          <Link
            href="/templates/new"
            className="btn btn-primary py-4 px-5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Nouveau</span>
          </Link>
        </div>
      </header>

      {/* Templates Grid */}
      {data.templates.length > 0 ? (
        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {data.templates.map((template, index) => (
            <div key={template.id} className={`animate-fade-in stagger-${Math.min(index + 1, 5)}`}>
              <TemplateCard
                template={template}
                onStart={() => handleStartSession(template)}
                onDelete={() => deleteTemplate(template.id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <section className="card p-10 md:p-16 text-center">
          <div className="empty-state-icon mx-auto">
            <svg className="w-9 h-9 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="empty-state-title">Aucun template créé</h3>
          <p className="empty-state-description mx-auto">
            Créez votre premier template pour commencer à organiser vos séances.
          </p>
          <Link
            href="/templates/new"
            className="btn btn-primary px-8 py-5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Créer un template
          </Link>
        </section>
      )}
    </div>
  );
}
