import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Flame,
  Dumbbell,
  Clock,
  Droplets,
  Play,
  Square,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { FastingSession, TaskItem } from '../../types';
import { apiGetWorkouts } from '../../lib/api';

interface CombinedWidgetProps {
  activeSession: FastingSession | null;
  onStartFasting: (hours: number, name: string) => void;
  onEndFasting: () => void;
  onAddWater: (ml: number) => void;
}

export const CombinedWidget: React.FC<CombinedWidgetProps> = ({
  activeSession,
  onStartFasting,
  onEndFasting,
  onAddWater,
}) => {
  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('kb_widget_combined_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('kb_widget_combined_size', size);
  };

  // Fasting timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setElapsedSeconds(0);
      return;
    }
    const startMs = new Date(activeSession.start_time).getTime();
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const targetSec = (activeSession?.target_hours || 16) * 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / targetSec) * 100);
  const remainingSec = Math.max(0, targetSec - elapsedSeconds);

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Workout state
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

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('kb_tasks_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    localStorage.setItem('kb_tasks_list', JSON.stringify(updated));
  };

  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Header & Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Widget Master (Tarefas + Jejum + Treino)</h3>
            <p className="text-[11px] text-slate-400">Visão integrada do seu dia</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px]">
          <button
            onClick={() => handleSizeChange('minimal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'minimal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mín
          </button>
          <button
            onClick={() => handleSizeChange('normal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'normal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Padrão
          </button>
          <button
            onClick={() => handleSizeChange('detailed')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Expandido
          </button>
        </div>
      </div>

      {/* MINIMAL SIZE */}
      {widgetSize === 'minimal' && (
        <div className="grid grid-cols-3 gap-2 text-center bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-indigo-300 block uppercase font-bold">Jejum</span>
            <span className="text-xs font-mono font-bold">{activeSession ? formatHMS(remainingSec) : 'Inativo'}</span>
          </div>
          <div className="border-x border-white/10 px-1">
            <span className="text-[10px] text-emerald-300 block uppercase font-bold">Treino</span>
            <span className="text-xs font-semibold truncate block">{todayWorkout?.day_name || 'Hoje'}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-300 block uppercase font-bold">Tarefas</span>
            <span className="text-xs font-bold">{tasks.filter(t => !t.completed).length} pendentes</span>
          </div>
        </div>
      )}

      {/* NORMAL SIZE */}
      {widgetSize === 'normal' && (
        <div className="space-y-3">
          {/* Fasting Quick Row */}
          <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 block">Jejum Intermitente</span>
                <span className="text-sm font-mono font-bold">{activeSession ? formatHMS(remainingSec) : 'Nenhum jejum ativo'}</span>
              </div>
            </div>
            {activeSession ? (
              <button
                onClick={onEndFasting}
                className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold"
              >
                Concluir
              </button>
            ) : (
              <button
                onClick={() => onStartFasting(16, '16:8 Padrão')}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Iniciar 16h
              </button>
            )}
          </div>

          {/* Workout & Tasks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs mb-1">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Treino ({todayWorkout?.day_name || 'Hoje'})</span>
              </div>
              <p className="text-xs font-semibold text-white">{todayWorkout?.subtitle || todayWorkout?.routineTitle || 'Descanso'}</p>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs mb-1">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tarefas Pendentes ({tasks.filter(t => !t.completed).length})</span>
              </div>
              {pendingTasks.length > 0 ? (
                <ul className="text-[11px] text-slate-300 space-y-0.5 truncate">
                  {pendingTasks.map(t => (
                    <li key={t.id} className="truncate">• {t.title}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-400">Nenhuma tarefa pendente!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SIZE */}
      {widgetSize === 'detailed' && (
        <div className="space-y-4">
          {/* Fasting section */}
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-indigo-300 font-bold uppercase block">Jejum Ativo</span>
              <div className="text-xl font-mono font-black">{activeSession ? formatHMS(remainingSec) : 'Inativo'}</div>
              <p className="text-[11px] text-slate-400">Meta: {activeSession?.target_hours || 16}h ({Math.floor(progressPercent)}%)</p>
            </div>
            {activeSession ? (
              <div className="flex items-center gap-2">
                <button onClick={() => onAddWater(250)} className="px-3 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-medium flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> +250ml
                </button>
                <button onClick={onEndFasting} className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold">
                  Concluir
                </button>
              </div>
            ) : (
              <button onClick={() => onStartFasting(16, '16:8 Padrão')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                Iniciar Jejum 16h
              </button>
            )}
          </div>

          {/* Workout section */}
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <span>Treino de Hoje ({todayWorkout?.day_name || 'Hoje'})</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                {todayWorkout?.isRest ? 'Descanso' : `${todayWorkout?.exercises?.length || 0} Exercícios`}
              </span>
            </div>
            <p className="text-xs font-bold text-white">{todayWorkout?.subtitle || todayWorkout?.routineTitle || 'Sem treino cadastrado'}</p>
          </div>

          {/* Tasks section */}
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>Tarefas Prioritárias</span>
              </div>
              <span className="text-[10px] text-slate-400">{tasks.filter(t => !t.completed).length} pendentes</span>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-xs">
                    <button onClick={() => toggleTask(t.id)} className="flex items-center gap-2 text-left truncate">
                      {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      <span className={`truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                    </button>
                    <span className="text-[10px] text-indigo-300 font-mono">{t.priority}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Nenhuma tarefa criada ainda.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
