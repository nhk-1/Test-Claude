'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface RestTimerProps {
  initialTime: number;
  onComplete?: () => void;
  onClose: () => void;
}

export default function RestTimer({ initialTime, onComplete, onClose }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasNotifiedRef = useRef(false);

  // Lock body scroll when timer is open
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Initialize audio element
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const context = typeof window !== 'undefined' && 'AudioContext' in window
      ? new AudioContext()
      : null;

    return () => {
      context?.close();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onComplete && !hasNotifiedRef.current) {
        hasNotifiedRef.current = true;

        // Play sound notification
        playNotificationSound();

        // Vibrate if supported
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }

        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // Beep at 3, 2, 1
        if (newTime <= 3 && newTime > 0) {
          playBeep();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const playBeep = () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
    }
  };

  const playNotificationSound = () => {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = 1000;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.5, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  const addTime = useCallback((seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overscroll-contain ${
        isFullscreen ? 'bg-gray-900' : 'bg-black/80'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isFullscreen) {
          onClose();
        }
      }}
    >
      <div className={`${
        isFullscreen
          ? 'w-full h-full flex flex-col items-center justify-center safe-area-top safe-area-bottom'
          : 'bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-8'
      } text-center`}>
        {!isFullscreen && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-8">
            Temps de repos
          </h2>
        )}

        {/* Circular Progress */}
        <div className={`relative mx-auto mb-8 ${
          isFullscreen ? 'w-80 h-80' : 'w-48 h-48'
        }`}>
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className={isFullscreen ? 'text-gray-700' : 'text-gray-200 dark:text-gray-700'}
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (553 * progress) / 100}
              className={`transition-all duration-1000 ${
                timeLeft <= 3
                  ? 'text-red-500'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <span className={`font-bold ${
              isFullscreen
                ? 'text-8xl text-white'
                : 'text-5xl text-gray-900 dark:text-white'
            }`}>
              {formatTime(timeLeft)}
            </span>
            {isFullscreen && timeLeft <= 3 && timeLeft > 0 && (
              <span className="text-2xl text-red-400 font-semibold animate-pulse">
                Prêt !
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center gap-4 mb-8 ${
          isFullscreen ? 'flex-wrap gap-5' : ''
        }`}>
          <button
            onClick={() => addTime(-15)}
            className={`rounded-xl transition-colors touch-target flex items-center justify-center font-medium ${
              isFullscreen
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 text-lg min-w-[72px] py-3 px-5'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 min-w-[56px] py-2 px-4'
            }`}
          >
            -15s
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`rounded-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center transition-colors ${
              isFullscreen ? 'w-20 h-20' : 'w-16 h-16'
            }`}
          >
            {isRunning ? (
              <svg className={isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className={isFullscreen ? 'w-10 h-10' : 'w-7 h-7'} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => addTime(15)}
            className={`rounded-xl transition-colors touch-target flex items-center justify-center font-medium ${
              isFullscreen
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 text-lg min-w-[72px] py-3 px-5'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 min-w-[56px] py-2 px-4'
            }`}
          >
            +15s
          </button>
        </div>

        {/* Action buttons */}
        <div className={`flex gap-4 ${isFullscreen ? 'flex-col w-64' : 'flex-col'}`}>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`py-4 px-5 rounded-xl font-medium transition-colors ${
              isFullscreen
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isFullscreen ? 'Mode normal' : 'Plein écran'}
          </button>
          <button
            onClick={onClose}
            className={`py-4 px-5 rounded-xl font-medium transition-colors ${
              isFullscreen
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            Passer le repos
          </button>
        </div>
      </div>
    </div>
  );
}
