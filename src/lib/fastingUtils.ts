export interface FastingEndEstimate {
  startDate: Date;
  endDate: Date;
  timeStr: string; // e.g. "14:30"
  dateStr: string; // e.g. "26/08"
  fullDateStr: string; // e.g. "Quarta-feira, 26 de Agosto"
  dayName: string; // e.g. "Quarta-feira"
  dayLabel: string; // e.g. "Hoje", "Amanhã", "Depois de amanhã", "Quarta-feira"
  summary: string; // e.g. "Amanhã às 14:30"
  badge: string; // e.g. "Término: Amanhã às 14:30"
  isOvernight: boolean;
  daysDiff: number;
}

export function calculateFastingEnd(
  startTime: string | Date | number = new Date(),
  targetHours: number = 16
): FastingEndEstimate {
  const start = new Date(startTime);
  const durationMs = Math.round(targetHours * 3600 * 1000);
  const end = new Date(start.getTime() + durationMs);
  const now = new Date();

  // Reset hours to compare calendar days
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const daysDiff = Math.round((endDay - today) / (1000 * 60 * 60 * 24));

  let dayLabel = '';
  if (daysDiff === 0) {
    dayLabel = 'Hoje';
  } else if (daysDiff === 1) {
    dayLabel = 'Amanhã';
  } else if (daysDiff === 2) {
    dayLabel = 'Depois de amanhã';
  } else if (daysDiff < 0) {
    dayLabel = 'Concluído';
  } else {
    const rawWeekday = end.toLocaleDateString('pt-BR', { weekday: 'long' });
    dayLabel = rawWeekday.charAt(0).toUpperCase() + rawWeekday.slice(1);
  }

  const timeStr = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const fullDateStr = end.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const rawDayName = end.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);

  const startDayTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const isOvernight = endDay !== startDayTime;

  return {
    startDate: start,
    endDate: end,
    timeStr,
    dateStr,
    fullDateStr: fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1),
    dayName,
    dayLabel,
    summary: `${dayLabel} às ${timeStr}`,
    badge: `Término previsto: ${dayLabel} às ${timeStr}`,
    isOvernight,
    daysDiff,
  };
}

export function formatFastingStart(startTime: string | Date | number): {
  timeStr: string;
  dayLabel: string;
  summary: string;
} {
  const start = new Date(startTime);
  const now = new Date();

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const daysDiff = Math.round((startDay - today) / (1000 * 60 * 60 * 24));

  let dayLabel = 'Hoje';
  if (daysDiff === -1) {
    dayLabel = 'Ontem';
  } else if (daysDiff < -1) {
    const rawWeekday = start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    dayLabel = rawWeekday;
  }

  const timeStr = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return {
    timeStr,
    dayLabel,
    summary: `${dayLabel} às ${timeStr}`,
  };
}
