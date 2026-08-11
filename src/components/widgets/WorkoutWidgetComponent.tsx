import React, { useState, useEffect } from 'react';
import { Dumbbell, Calendar, CheckCircle2 } from 'lucide-react';
import { apiGetWorkouts } from '../../lib/api';

export const WorkoutWidgetComponent: React.FC = () => {
  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('kb_widget_workout_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('kb_widget_workout_size', size);
  };

  const [todayWorkout, setTodayWorkout] = useState<any>(null);

  useEffect(() => {
    apiGetWorkouts().then((routines) => {
      if (routines && routines.length > 0) {
        const routine = routines[0];
        const dayIdx = new Date().getDay();
        const day = routine.days?.[dayIdx];
        if (day) setTodayWorkout({ routineTitle: routine.title, ...day });
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-emerald-500/20 relative overflow-hidden">
      {/* Header & Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Widget de Treino</h3>
            <p className="text-[11px] text-slate-400">{todayWorkout?.day_name || 'Hoje'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px]">
          <button
            onClick={() => handleSizeChange('minimal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'minimal' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mín
          </button>
          <button
            onClick={() => handleSizeChange('normal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'normal' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Padrão
          </button>
          <button
            onClick={() => handleSizeChange('detailed')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'detailed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Expandido
          </button>
        </div>
      </div>

      {/* MINIMAL SIZE */}
      {widgetSize === 'minimal' && (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-emerald-300 uppercase font-bold">{todayWorkout?.day_name || 'Hoje'}</span>
            <div className="text-sm font-bold truncate max-w-[180px]">{todayWorkout?.subtitle || 'Treino do Dia'}</div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
            {todayWorkout?.isRest ? 'Descanso' : `${todayWorkout?.exercises?.length || 0} Exs`}
          </span>
        </div>
      )}

      {/* NORMAL SIZE */}
      {widgetSize === 'normal' && (
        <div className="space-y-2.5">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-300">{todayWorkout?.subtitle || todayWorkout?.routineTitle || 'Treino'}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                {todayWorkout?.isRest ? 'Descanso' : `${todayWorkout?.exercises?.length || 0} Exercícios`}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {todayWorkout?.exercises && todayWorkout.exercises.length > 0
                ? todayWorkout.exercises.map((e: any) => e.name).join(', ')
                : 'Nenhum exercício programado para hoje.'}
            </p>
          </div>
        </div>
      )}

      {/* DETAILED SIZE */}
      {widgetSize === 'detailed' && (
        <div className="space-y-3">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold text-white">{todayWorkout?.subtitle || todayWorkout?.routineTitle || 'Treino'}</p>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                {todayWorkout?.isRest ? 'Dia de Descanso' : `${todayWorkout?.exercises?.length || 0} Exercícios`}
              </span>
            </div>
            {todayWorkout?.exercises && todayWorkout.exercises.length > 0 ? (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {todayWorkout.exercises.map((ex: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-xs">
                    <span className="font-medium text-slate-200">{idx + 1}. {ex.name}</span>
                    <span className="text-emerald-300 font-mono font-semibold">{ex.sets} × {ex.reps}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhum exercício agendado para hoje.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
