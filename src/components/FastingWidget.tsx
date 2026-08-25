import React, { useState, useEffect } from 'react';
import { Play, Square, Droplets, Volume2, Sparkles, CheckCircle2, Clock, Shield, Flame, Dumbbell, Calendar, Target } from 'lucide-react';
import { FastingSession } from '../types';
import { playFastingCompletionSound, requestFastingNotificationPermission, sendFastingCompletionNotification } from '../lib/fastingSound';
import { calculateFastingEnd } from '../lib/fastingUtils';
import { apiGetWorkouts } from '../lib/api';

interface FastingWidgetProps {
  activeSession: FastingSession | null;
  onStartFasting: (targetHours: number, protocolName?: string) => void;
  onEndFasting: () => void;
  onAddWater: (ml: number) => void;
  compact?: boolean;
}

export const FastingWidget: React.FC<FastingWidgetProps> = ({
  activeSession,
  onStartFasting,
  onEndFasting,
  onAddWater,
  compact = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setElapsedSeconds(0);
      setNotified(false);
      return;
    }

    const startMs = new Date(activeSession.start_time).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setElapsedSeconds(diffSec);

      const targetSec = activeSession.target_hours * 3600;
      if (diffSec >= targetSec && !notified) {
        setNotified(true);
        playFastingCompletionSound();
        sendFastingCompletionNotification(activeSession.target_hours);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSession, notified]);

  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('keepflow_widget_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('keepflow_widget_size', size);
  };

  const targetSeconds = (activeSession?.target_hours || 16) * 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / targetSeconds) * 100);

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const isFinished = elapsedSeconds >= targetSeconds && activeSession?.status === 'active';

  const endEstimate = activeSession && activeSession.status === 'active'
    ? calculateFastingEnd(activeSession.start_time, activeSession.target_hours)
    : null;

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
        const dayIndex = new Date().getDay(); // 0: Sun, 1: Mon, ...
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

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/20 relative overflow-hidden ${compact ? 'max-w-sm' : 'w-full'}`}>
      {/* Background Glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Widget Header Badge & Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Widget de Jejum & Treino</h3>
            <p className="text-[11px] text-slate-400">
              {activeSession?.protocolName || (activeSession ? `${activeSession.target_hours}h Intermitente` : 'Sem Jejum Ativo')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px]">
          <button
            onClick={() => handleSizeChange('minimal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'minimal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            title="Tamanho Mínimo (Compacto)"
          >
            Mín
          </button>
          <button
            onClick={() => handleSizeChange('normal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'normal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            title="Tamanho Padrão"
          >
            Padrão
          </button>
          <button
            onClick={() => handleSizeChange('detailed')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            title="Tamanho Expandido / Detalhado"
          >
            Expandido
          </button>
        </div>
      </div>

      {/* MINIMAL SIZE VIEW */}
      {widgetSize === 'minimal' && (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-indigo-300 uppercase font-bold">Jejum & Treino</span>
            <div className="text-lg font-black font-mono">
              {activeSession && activeSession.status === 'active' ? formatHMS(remainingSeconds) : 'Inativo'}
            </div>
            {endEstimate && (
              <span className="text-[10px] text-amber-300 font-medium block">
                Término: {endEstimate.dayLabel} {endEstimate.timeStr}
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[11px] text-emerald-300 font-semibold block">
              {todayWorkout?.dayName || 'Hoje'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
              {todayWorkout?.isRest ? 'Descanso' : (todayWorkout?.subtitle || todayWorkout?.routineTitle || 'Treino')}
            </span>
          </div>
        </div>
      )}

      {/* NORMAL SIZE VIEW */}
      {widgetSize === 'normal' && (
        <>
          {activeSession && activeSession.status === 'active' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-indigo-300 block mb-0.5">
                    {isFinished ? '🎉 Meta Alcançada!' : 'Tempo Restante'}
                  </span>
                  <div className="text-2xl font-black font-mono tracking-tight text-white">
                    {isFinished ? '00:00:00' : formatHMS(remainingSeconds)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Decorrido: <span className="text-emerald-400 font-medium">{formatHMS(elapsedSeconds)}</span>
                  </p>
                </div>
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
                    <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - progressPercent / 100)} className="text-indigo-400" strokeLinecap="round" fill="transparent" />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-indigo-200">{Math.floor(progressPercent)}%</span>
                </div>
              </div>

              {/* End Time Badge */}
              {endEstimate && (
                <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    Término Previsto:
                  </span>
                  <span className="font-bold text-amber-200">
                    {endEstimate.dayLabel} às {endEstimate.timeStr}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAddWater(250)}
                  className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Droplets className="w-4 h-4 text-blue-400" />
                  +250ml ({activeSession.water_ml || 0}ml)
                </button>
                <button
                  onClick={onEndFasting}
                  className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">Iniciar cronômetro de jejum:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { hours: 12, label: '12h' },
                  { hours: 16, label: '16h' },
                  { hours: 18, label: '18h' },
                ].map((preset) => {
                  const preview = calculateFastingEnd(new Date(), preset.hours);
                  return (
                    <button
                      key={preset.hours}
                      onClick={() => {
                        requestFastingNotificationPermission();
                        onStartFasting(preset.hours, `${preset.hours}h Intermitente`);
                      }}
                      className="py-2 px-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 rounded-xl text-xs font-bold text-indigo-200 flex flex-col items-center justify-center gap-0.5 transition"
                      title={`Término: ${preview.dayLabel} às ${preview.timeStr}`}
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-current" />
                      <span>{preset.label}</span>
                      <span className="text-[9px] text-amber-300/90 font-normal">
                        até {preview.timeStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Treino do dia normal */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-emerald-300 font-bold">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Treino de Hoje ({todayWorkout?.dayName || 'Hoje'}):</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                {todayWorkout?.isRest ? 'Descanso' : `${todayWorkout?.exercisesCount || 0} Exs`}
              </span>
            </div>
            {todayWorkout ? (
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white">{todayWorkout.subtitle || todayWorkout.routineTitle}</p>
                <p className="text-[11px] text-slate-300 truncate">
                  {todayWorkout.exercises && todayWorkout.exercises.length > 0
                    ? todayWorkout.exercises.map(e => e.name).join(', ')
                    : 'Nenhum exercício hoje.'}
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Carregando...</p>
            )}
          </div>
        </>
      )}

      {/* DETAILED / EXPANDED SIZE VIEW */}
      {widgetSize === 'detailed' && (
        <div className="space-y-4">
          {activeSession && activeSession.status === 'active' ? (
            <>
              <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-indigo-300 block mb-0.5">
                    {isFinished ? '🎉 Meta Alcançada!' : 'Tempo Restante'}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {isFinished ? '00:00:00' : formatHMS(remainingSeconds)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Decorrido: <span className="text-emerald-400 font-medium">{formatHMS(elapsedSeconds)}</span> (Meta: {activeSession.target_hours}h)
                  </p>
                </div>
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" className="text-slate-800" fill="transparent" />
                    <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="5" strokeDasharray={2 * Math.PI * 26} strokeDashoffset={2 * Math.PI * 26 * (1 - progressPercent / 100)} className="text-indigo-400" strokeLinecap="round" fill="transparent" />
                  </svg>
                  <span className="absolute text-xs font-bold text-indigo-200">{Math.floor(progressPercent)}%</span>
                </div>
              </div>

              {/* Detailed Schedule Box */}
              {endEstimate && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Início: {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      Término: {endEstimate.dayLabel} às {endEstimate.timeStr}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-200/80 text-right">
                    {endEstimate.fullDateStr}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-300 font-semibold">Iniciar protocolo de jejum:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { hours: 12, label: '12h Iniciante' },
                  { hours: 16, label: '16h Padrão' },
                  { hours: 18, label: '18h Avançado' },
                ].map((preset) => {
                  const preview = calculateFastingEnd(new Date(), preset.hours);
                  return (
                    <button
                      key={preset.hours}
                      onClick={() => {
                        requestFastingNotificationPermission();
                        onStartFasting(preset.hours, `${preset.hours}h Protocolo`);
                      }}
                      className="py-2.5 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 rounded-xl text-xs font-bold text-indigo-200 flex flex-col items-center justify-center gap-1 transition"
                      title={`Término: ${preview.dayLabel} às ${preview.timeStr}`}
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                      <span>{preset.label}</span>
                      <span className="text-[9px] text-amber-300/90 font-normal">
                        término {preview.dayLabel} {preview.timeStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSession && activeSession.status === 'active' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddWater(250)}
                className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                +250ml Água ({activeSession.water_ml || 0}ml)
              </button>
              <button
                onClick={onEndFasting}
                className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Concluir Jejum
              </button>
            </div>
          )}

          {/* Treino de Hoje Detalhado Completo */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Treino de Hoje ({todayWorkout?.dayName || 'Hoje'}):</span>
              </div>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                {todayWorkout?.isRest ? 'Dia de Descanso' : `${todayWorkout?.exercisesCount || 0} Exercícios`}
              </span>
            </div>

            {todayWorkout ? (
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold text-white">{todayWorkout.subtitle || todayWorkout.routineTitle}</p>
                  <span className="text-[10px] text-indigo-300">{todayWorkout.routineTitle}</span>
                </div>
                {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {todayWorkout.exercises.map((ex: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-xs">
                        <span className="font-medium text-slate-200">{idx + 1}. {ex.name}</span>
                        <span className="text-indigo-300 font-mono font-semibold">{ex.sets} séries × {ex.reps}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum exercício agendado para hoje. Aproveite para descansar!</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Carregando treino detalhado...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
