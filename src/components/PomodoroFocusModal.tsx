import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Flame, CheckCircle, Zap } from 'lucide-react';
import { Note, KanbanCard } from '../types';

interface PomodoroFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes?: Note[];
  cards?: KanbanCard[];
}

export const PomodoroFocusModal: React.FC<PomodoroFocusModalProps> = ({
  isOpen,
  onClose,
  notes = [],
  cards = [],
}) => {
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const getDuration = (m: 'focus' | 'shortBreak' | 'longBreak') => {
    switch (m) {
      case 'focus':
        return 25 * 60;
      case 'shortBreak':
        return 5 * 60;
      case 'longBreak':
        return 15 * 60;
    }
  };

  const handleSwitchMode = (m: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(m);
    setTimeLeft(getDuration(m));
    setIsRunning(false);
  };

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        const newCount = completedSessions + 1;
        setCompletedSessions(newCount);
        if (newCount % 4 === 0) {
          handleSwitchMode('longBreak');
        } else {
          handleSwitchMode('shortBreak');
        }
      } else {
        handleSwitchMode('focus');
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, mode, completedSessions]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = getDuration(mode);
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 ${
          mode === 'focus' ? 'bg-indigo-500' : mode === 'shortBreak' ? 'bg-emerald-500' : 'bg-amber-500'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Modo Foco & Pomodoro</h3>
              <p className="text-xs text-slate-400">Maximize sua concentração por ciclos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-2 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/50 relative z-10">
          <button
            onClick={() => handleSwitchMode('focus')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === 'focus' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Foco (25m)
          </button>
          <button
            onClick={() => handleSwitchMode('shortBreak')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === 'shortBreak' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ☕ Pausa Curta (5m)
          </button>
          <button
            onClick={() => handleSwitchMode('longBreak')}
            className={`py-2 rounded-xl text-xs font-bold transition ${
              mode === 'longBreak' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            🌴 Pausa Longa (15m)
          </button>
        </div>

        {/* Timer Display Circle */}
        <div className="flex flex-col items-center justify-center py-6 relative z-10 space-y-4">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                stroke="currentColor"
                strokeWidth="12"
                className={`transition-all duration-1000 ${
                  mode === 'focus' ? 'text-indigo-500' : mode === 'shortBreak' ? 'text-emerald-500' : 'text-amber-500'
                }`}
                fill="transparent"
                strokeDasharray={603}
                strokeDashoffset={603 - (603 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-5xl font-black font-mono tracking-tight text-white">{timeFormatted}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">
                {mode === 'focus' ? 'Sessão de Foco' : 'Descanso'}
              </span>
            </div>
          </div>

          {/* Sessions Completed Indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/50">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Sessões concluídas hoje: <strong className="text-white">{completedSessions}</strong></span>
          </div>
        </div>

        {/* Task Linker */}
        <div className="space-y-1.5 relative z-10">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tarefa em Foco (Opcional)</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Nenhuma tarefa selecionada</option>
            {cards.map((c) => (
              <option key={`card_${c.id}`} value={`card_${c.id}`}>
                [Kanban] {c.title}
              </option>
            ))}
            {notes.map((n) => (
              <option key={`note_${n.id}`} value={`note_${n.id}`}>
                [Nota] {n.title || 'Sem título'}
              </option>
            ))}
          </select>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-2 relative z-10">
          <button
            onClick={() => {
              setTimeLeft(getDuration(mode));
              setIsRunning(false);
            }}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reiniciar Cronômetro"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg transition transform active:scale-95 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Iniciar Foco
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
