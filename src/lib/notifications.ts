// Notification management module

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Show rest timer complete notification
 */
export function showRestTimerNotification(exerciseName?: string) {
  const title = 'Repos terminé !';
  const body = exerciseName
    ? `Prêt pour la prochaine série de ${exerciseName}`
    : 'Prêt pour la prochaine série';

  return showNotification(title, {
    body,
    tag: 'rest-timer',
    requireInteraction: false,
  } as NotificationOptions);
}

/**
 * Show workout reminder notification
 */
export function showWorkoutReminderNotification(message: string) {
  return showNotification('Rappel d\'entraînement', {
    body: message,
    tag: 'workout-reminder',
    requireInteraction: true,
  } as NotificationOptions);
}

/**
 * Schedule a workout reminder
 * Returns a timeout ID that can be used to cancel the reminder
 */
export function scheduleWorkoutReminder(
  message: string,
  delayInMinutes: number
): number {
  const delayInMs = delayInMinutes * 60 * 1000;

  return window.setTimeout(() => {
    showWorkoutReminderNotification(message);
  }, delayInMs) as unknown as number;
}

/**
 * Cancel a scheduled reminder
 */
export function cancelScheduledReminder(timerId: number) {
  clearTimeout(timerId);
}

/**
 * Schedule daily workout reminders
 * @param hour Hour (0-23)
 * @param minute Minute (0-59)
 * @param message Notification message
 * @returns Timer ID for cancellation
 */
export function scheduleDailyReminder(
  hour: number,
  minute: number,
  message: string
): number {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();

  return window.setTimeout(() => {
    showWorkoutReminderNotification(message);

    // Reschedule for next day
    scheduleDailyReminder(hour, minute, message);
  }, delay) as unknown as number;
}
