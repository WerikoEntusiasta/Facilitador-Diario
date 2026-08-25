import React, { useState } from 'react';
import { Sparkles, Bell, Layers, CheckSquare, Dumbbell, Flame, Calendar, Smartphone, FileText, Plus } from 'lucide-react';
import { CombinedWidget } from './widgets/CombinedWidget';
import { TasksWidget } from './widgets/TasksWidget';
import { WorkoutWidgetComponent } from './widgets/WorkoutWidgetComponent';
import { CalendarRemindersWidget } from './widgets/CalendarRemindersWidget';
import { QuickNoteWidget } from './widgets/QuickNoteWidget';
import { FastingWidget } from './FastingWidget';
import { FastingSession } from '../types';
import { AndroidWidgetCodeModal } from './AndroidWidgetCodeModal';
import { AndroidHomeScreenGuideModal } from './AndroidHomeScreenGuideModal';

interface WidgetsHubViewProps {
  activeSession: FastingSession | null;
  onStartFasting: (hours: number, name: string) => void;
  onEndFasting: () => void;
  onAddWater: (ml: number) => void;
  onOpenNotificationModal: () => void;
  onOpenStandaloneWidget?: () => void;
}

export const WidgetsHubView: React.FC<WidgetsHubViewProps> = ({
  activeSession,
  onStartFasting,
  onEndFasting,
  onAddWater,
  onOpenNotificationModal,
  onOpenStandaloneWidget,
}) => {
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Central de Widgets Interativos & Nativos Android</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Widgets da Tela Inicial do Celular</h1>
          <p className="text-xs text-slate-300 mt-1">
            Crie notas rápidas, acompanhe treinos e controle jejum direto da tela de início sem abrir o app completo.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Como Fixar no Android</span>
          </button>
          <button
            onClick={() => setIsAndroidModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 border border-white/10 transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Código Kotlin / XML</span>
          </button>
          <button
            onClick={onOpenNotificationModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Notificações</span>
          </button>
        </div>
      </div>

      <AndroidWidgetCodeModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

      <AndroidHomeScreenGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenStandaloneWidget={onOpenStandaloneWidget}
      />

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 0. Quick Note Widget (Hero Feature) */}
        <div className="space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Widget de Criação de Nota Rápida (Tela Inicial do Celular)</span>
            </div>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Smartphone size={12} />
              <span>Instruções para Celular Android</span>
            </button>
          </div>
          <QuickNoteWidget
            onOpenGuideModal={() => setIsGuideModalOpen(true)}
            onOpenStandaloneWidget={onOpenStandaloneWidget}
          />
        </div>

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
