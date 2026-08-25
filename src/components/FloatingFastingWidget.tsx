import React, { useState, useEffect } from 'react';
import { Flame, X, Volume2, Droplets, CheckCircle2, Square, Clock, Dumbbell, Target } from 'lucide-react';
import { FastingSession } from '../types';
import { playFastingCompletionSound } from '../lib/fastingSound';
import { calculateFastingEnd } from '../lib/fastingUtils';
import { apiGetWorkouts } from '../lib/api';

interface FloatingFastingWidgetProps {
  activeSession: FastingSession | null;
  onClose: () => void;
  onEndFasting: () => void;
  onAddWater: (ml: number) => void;
}

export const FloatingFastingWidget: React.FC<FloatingFastingWidgetProps> = ({
  activeSession,
  onClose,
  onEndFasting,
  onAddWater,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setElapsedSeconds(0);
      return;
    }

    const startMs = new Date(activeSession.start_time).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession || activeSession.status !== 'active') return null;

  const targetSeconds = activeSession.target_hours * 3600;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progressPercent = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  const endEstimate = calculateFastingEnd(activeSession.start_time, activeSession.target_hours);

  const [todayWorkout, setTodayWorkout] = useState<{
    routineTitle: string;
    dayName: string;
    subtitle?: string;
    exercisesCount: number;
    isRest?: boolean;
    exercises?: any[];
  } | null>(null);

  useEffect(() => {
    apiGetWorkouts().then((routines) => {
      if (routines && routines.length > 0) {
        const routine = routines[0];
        const dayIndex = new Date().getDay();
        const todayDay = routine.days && routine.days[dayIndex] ? routine.days[dayIndex] : null;
        if (todayDay) {
          setTodayWorkout({
            routineTitle: routine.title,
            dayName: todayDay.day_name,
            subtitle: todayDay.subtitle,
            exercisesCount: todayDay.exercises?.length || 0,
            isRest: todayDay.is_rest_day,
            exercises: todayDay.exercises || [],
          });
        }
      }
    }).catch(() => {});
  }, []);

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-amber-500/30 animate-slideUp">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Jejum {activeSession.protocol_name || `${activeSession.target_hours}h`}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Minimizar Widget"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Timer & Ring */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
            Restante
          </span>
          <span className="text-xl font-mono font-black text-white">
            {formatHMS(remainingSeconds)}
          </span>
          <span className="text-[10px] text-amber-300 block font-semibold mt-0.5">
            {Math.floor(progressPercent)}% Concluído
          </span>
        </div>

        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="18"
              stroke="currentColor"
              strokeWidth="4"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="18"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - progressPercent / 100)}
              className="text-amber-400 transition-all duration-1000 ease-linear"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <Flame className="w-4 h-4 text-amber-400 absolute" />
        </div>
      </div>

      {/* End Time Preview Badge */}
      <div className="mb-3 px-2.5 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-between text-[11px]">
        <span className="text-amber-300 font-semibold flex items-center gap-1">
          <Target className="w-3 h-3 text-amber-400" />
          Término Previsto:
        </span>
        <span className="font-bold text-amber-200">
          {endEstimate.dayLabel} às {endEstimate.timeStr}
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onAddWater(250)}
          className="flex-1 py-1.5 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <Droplets className="w-3.5 h-3.5 text-blue-400" />
          +250ml
        </button>

        <button
          onClick={() => playFastingCompletionSound()}
          className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl border border-white/10 transition-colors"
          title="Testar som"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onEndFasting}
          className="py-1.5 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
        >
          <Square className="w-3 h-3 fill-current" />
          Encerrar
        </button>
      </div>

      {/* Treino de Hoje Integrado */}
      <div className="mt-3 pt-2.5 border-t border-white/10">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <div className="flex items-center gap-1 text-emerald-300 font-bold">
            <Dumbbell className="w-3 h-3 text-emerald-400" />
            <span>Treino de Hoje:</span>
          </div>
          {todayWorkout && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
              {todayWorkout.isRest ? 'Descanso' : `${todayWorkout.exercisesCount} Exs`}
            </span>
          )}
        </div>
        {todayWorkout ? (
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 space-y-0.5">
            <p className="text-[11px] font-bold text-white truncate">{todayWorkout.subtitle || todayWorkout.routineTitle}</p>
            {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
              <p className="text-[10px] text-slate-300 truncate">
                • {todayWorkout.exercises.map(e => e.name).join(', ')}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">Dia de Descanso Total</p>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400">Carregando...</p>
        )}
      </div>
    </div>
  );
};
