import { FastingSession } from '../types';

const STORAGE_KEY_ACTIVE = 'kb_fasting_active_session';
const STORAGE_KEY_HISTORY = 'kb_fasting_history_sessions';
const STORAGE_KEY_FLOATING_WIDGET = 'kb_fasting_show_floating_widget';

export function getStoredActiveSession(): FastingSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredActiveSession(session: FastingSession | null): void {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  } else {
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(session));
  }
}

export function getStoredFastingHistory(): FastingSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function setStoredFastingHistory(history: FastingSession[]): void {
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

export function getStoredFloatingWidgetState(): boolean {
  return localStorage.getItem(STORAGE_KEY_FLOATING_WIDGET) === 'true';
}

export function setStoredFloatingWidgetState(show: boolean): void {
  localStorage.setItem(STORAGE_KEY_FLOATING_WIDGET, show ? 'true' : 'false');
}
