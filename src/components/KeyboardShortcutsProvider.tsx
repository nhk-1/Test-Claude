'use client';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  return <>{children}</>;
}
