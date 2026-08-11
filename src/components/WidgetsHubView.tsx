import React, { useState } from 'react';
import { Sparkles, Bell, Layers, CheckSquare, Dumbbell, Flame, Calendar, Smartphone } from 'lucide-react';
import { CombinedWidget } from './widgets/CombinedWidget';
import { TasksWidget } from './widgets/TasksWidget';
import { WorkoutWidgetComponent } from './widgets/WorkoutWidgetComponent';
import { CalendarRemindersWidget } from './widgets/CalendarRemindersWidget';
import { FastingWidget } from './FastingWidget';
import { FastingSession } from '../types';
import { AndroidWidgetCodeModal } from './AndroidWidgetCodeModal';

interface WidgetsHubViewProps {
  activeSession: FastingSession | null;
  onStartFasting: (hours: number, name: string) => void;
  onEndFasting: () => void;
  onAddWater: (ml: number) => void;
  onOpenNotificationModal: () => void;
}

export const WidgetsHubView: React.FC<WidgetsHubViewProps> = ({
  activeSession,
  onStartFasting,
  onEndFasting,
  onAddWater,
  onOpenNotificationModal,
}) => {
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Central de Widgets Interativos & Nativos Android</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Widgets com Múltiplos Tamanhos</h1>
          <p className="text-xs text-slate-300 mt-1">Escolha entre Mínimo, Padrão ou Expandido para cada widget do seu aplicativo ou consulte o código AppWidget nativo Android.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Código Nativo Android</span>
          </button>
          <button
            onClick={onOpenNotificationModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition"
          >
            <Bell className="w-4 h-4" />
            <span>Notificações & DND</span>
          </button>
        </div>
      </div>

      <AndroidWidgetCodeModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Combined Widget */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Widget Combinado (Tarefas + Jejum + Treino)</span>
          </div>
          <CombinedWidget
            activeSession={activeSession}
            onStartFasting={onStartFasting}
            onEndFasting={onEndFasting}
            onAddWater={onAddWater}
          />
        </div>

        {/* 2. Tasks Widget */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <CheckSquare className="w-4 h-4 text-amber-500" />
            <span>Widget Exclusivo de Tarefas</span>
          </div>
          <TasksWidget />
        </div>

        {/* 3. Workout Widget */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Dumbbell className="w-4 h-4 text-emerald-500" />
            <span>Widget Exclusivo de Treino do Dia</span>
          </div>
          <WorkoutWidgetComponent />
        </div>

        {/* 4. Fasting Widget */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Flame className="w-4 h-4 text-indigo-500" />
            <span>Widget Exclusivo de Jejum Intermitente</span>
          </div>
          <FastingWidget
            activeSession={activeSession}
            onStartFasting={onStartFasting}
            onEndFasting={onEndFasting}
            onAddWater={onAddWater}
          />
        </div>

        {/* 5. Calendar & Reminders Widget */}
        <div className="space-y-2 lg:col-span-2">
          <div className="flex items-center gap-2 px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>Widget de Calendário & Lembretes</span>
          </div>
          <CalendarRemindersWidget />
        </div>
      </div>
    </div>
  );
};
