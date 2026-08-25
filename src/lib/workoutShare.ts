import { WorkoutRoutine } from '../types';
import { getServerUrl, DEFAULT_SERVER_URL, isLocalhostUrl } from './api';

/**
 * Returns a public, shareable base URL for the app (never localhost)
 */
export function getPublicAppBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && !isLocalhostUrl(origin)) {
      return origin;
    }
  }

  const serverUrl = getServerUrl();
  if (serverUrl && !isLocalhostUrl(serverUrl)) {
    return serverUrl;
  }

  return DEFAULT_SERVER_URL;
}

/**
 * Encodes workout routine data into a safe URL-friendly base64 string
 */
export function encodeWorkoutData(workout: WorkoutRoutine): string {
  const minimalData = {
    id: workout.id,
    title: workout.title,
    description: workout.description || '',
    days: workout.days,
  };
  try {
    const json = JSON.stringify(minimalData);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    console.error('Erro ao codificar treino:', e);
    return '';
  }
}

/**
 * Decodes workout routine data from base64 string
 */
export function decodeWorkoutData(encodedData: string): Partial<WorkoutRoutine> | null {
  if (!encodedData) return null;
  try {
    const json = decodeURIComponent(escape(atob(encodedData)));
    const parsed = JSON.parse(json);
    if (parsed && parsed.title && Array.isArray(parsed.days)) {
      return parsed;
    }
  } catch (e) {
    console.error('Erro ao decodificar treino compartilhado:', e);
  }
  return null;
}

/**
 * Generates the full shareable URL for a workout
 */
export function buildWorkoutShareUrl(workout: WorkoutRoutine): string {
  const baseUrl = getPublicAppBaseUrl();
  const encodedPayload = encodeWorkoutData(workout);
  
  const url = new URL(baseUrl);
  url.searchParams.set('shared_workout', String(workout.id));
  if (encodedPayload) {
    url.searchParams.set('wdata', encodedPayload);
  }
  return url.toString();
}

/**
 * Formats a clean text representation of the workout for messaging apps (WhatsApp, Telegram)
 */
export function buildWorkoutTextSummary(workout: WorkoutRoutine): string {
  const shareUrl = buildWorkoutShareUrl(workout);
  let text = `💪 *${workout.title.toUpperCase()}*\n`;
  if (workout.description) {
    text += `${workout.description}\n`;
  }
  text += `\n📅 *CRONOGRAMA SEMANAL:*\n`;

  workout.days.forEach((day) => {
    const subtitle = day.subtitle ? ` (${day.subtitle})` : '';
    if (day.is_rest_day) {
      text += `\n😴 *${day.day_name}*: Descanso / Recuperação\n`;
    } else if (day.exercises && day.exercises.length > 0) {
      text += `\n🏋️ *${day.day_name}${subtitle}*:\n`;
      day.exercises.forEach((ex, idx) => {
        let exLine = `  ${idx + 1}. ${ex.name} - ${ex.sets || '4'}x ${ex.reps || '10-12'}`;
        if (ex.weight) exLine += ` (${ex.weight})`;
        text += `${exLine}\n`;
      });
    }
  });

  text += `\n📲 *Acesse ou importe a ficha completa pelo KeepFlow:*\n${shareUrl}`;
  return text;
}
