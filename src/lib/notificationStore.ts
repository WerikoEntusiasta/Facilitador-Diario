import { NotificationSettings } from '../types';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  notifyFasting: true,
  notifyWorkout: true,
  notifyTasks: true,
  notifyCalendar: true,
  soundEnabled: true,
  bypassDND: true,
  alertVolume: 80,
};

export const getStoredNotificationSettings = (): NotificationSettings => {
  try {
    const saved = localStorage.getItem('kb_notification_settings');
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_NOTIFICATION_SETTINGS;
};

export const setStoredNotificationSettings = (settings: NotificationSettings) => {
  try {
    localStorage.setItem('kb_notification_settings', JSON.stringify(settings));
  } catch (e) {}
};

export const playNotificationAlertSound = (bypass: boolean = true) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = bypass ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};
