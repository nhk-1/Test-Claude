'use client';

import { useEffect } from 'react';

export default function ViewportFix() {
  useEffect(() => {
    // Fix for iOS viewport height
    const setVH = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set it as a CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set on load
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  return null;
}
