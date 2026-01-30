import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Cmd/Ctrl + K: Quick search (currently just opens templates)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        router.push('/templates');
        return;
      }

      // Shortcuts without modifiers
      switch (event.key) {
        case 'h':
          // Go home
          if (pathname !== '/') {
            event.preventDefault();
            router.push('/');
          }
          break;
        case 't':
          // Go to templates
          if (pathname !== '/templates') {
            event.preventDefault();
            router.push('/templates');
          }
          break;
        case 's':
          // Go to session
          if (pathname !== '/session') {
            event.preventDefault();
            router.push('/session');
          }
          break;
        case 'a':
          // Go to analytics
          if (pathname !== '/analytics') {
            event.preventDefault();
            router.push('/analytics');
          }
          break;
        case '?':
          // Show keyboard shortcuts help
          event.preventDefault();
          alert(`Raccourcis clavier:

h - Accueil
t - Templates
s - Séance
a - Analytics
Cmd/Ctrl + K - Recherche rapide

Naviguez rapidement entre les pages !`);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, pathname]);
}
