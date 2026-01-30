// Haptic feedback utilities using Vibration API

export const haptics = {
  // Light tap feedback
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  // Medium impact feedback
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  // Heavy impact feedback
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  // Success notification
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Warning notification
  warning: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 100, 15, 100, 15]);
    }
  },

  // Error notification
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 100, 20]);
    }
  },

  // Set complete pattern
  setComplete: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },

  // Session complete pattern
  sessionComplete: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50, 100, 100]);
    }
  },
};
