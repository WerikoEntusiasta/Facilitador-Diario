import React, { useState, useEffect } from 'react';
import {
  Activity,
  Award,
  ChevronRight,
  Footprints,
  Flame,
  Clock,
  Compass,
  Smartphone,
  Calendar,
  Sparkles,
  PlusCircle,
  Inbox,
} from 'lucide-react';

export interface ActivitySummaryRecord {
  id?: string;
  date: string;
  totalSteps: number;
  totalCalories: number;
  totalDistanceKm: number;
  durationSeconds: number;
  label?: string;
}

export const DashboardGpsTrackerCard: React.FC<{
  onOpenAndroidApp?: () => void;
}> = ({ onOpenAndroidApp }) => {
  const [activities, setActivities] = useState<ActivitySummaryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('kb_saved_activities_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Atualizar quando houver sincronização de atividades
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('kb_saved_activities_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setActivities(parsed);
        } else {
          setActivities([]);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kb_activity_saved', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kb_activity_saved', handleStorageChange);
    };
  }, []);

  const latestActivity = activities.length > 0 ? activities[0] : null;

  // Totais acumulados reais
  const totalWeeklyKm = activities.reduce((acc, a) => acc + (a.totalDistanceKm || 0), 0);
  const totalWeeklySteps = activities.reduce((acc, a) => acc + (a.totalSteps || 0), 0);
  const totalWeeklyCalories = activities.reduce((acc, a) => acc + (a.totalCalories || 0), 0);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = (secs % 60).toString().padStart(2, '0');
    return `${mins}m ${s}s`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return 'Hoje';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Telemetria & Atividades GPS
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${activities.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {activities.length > 0 ? 'Sincronizado via APK Android' : 'Aguardando sincronização do APK'}
              </span>
            </div>
          </div>
        </div>

        {onOpenAndroidApp && (
          <button
            onClick={onOpenAndroidApp}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-500/20"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Módulo APK</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Main Stats Grid (Totais Reais Acumulados) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Distância */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Percorrido</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalWeeklyKm.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">km</span>
          </div>
        </div>

        {/* Passos */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Passos Gravados</span>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">
            {totalWeeklySteps.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Calorias */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gasto Estimado</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-orange-600 dark:text-orange-400 font-mono">
              {totalWeeklyCalories.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">kcal</span>
          </div>
        </div>

        {/* Média / Último */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Último Treino</span>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
            {latestActivity ? `${latestActivity.totalDistanceKm.toFixed(1)} km` : '--'}
          </div>
        </div>
      </div>

      {/* Histórico Real de Treinos Sincronizados */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Últimas Sessões Registradas</span>
          <span className="text-[10px] font-normal text-slate-400">GPS Haversine + Pedômetro</span>
        </div>

        {activities.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-1">
            <div className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
              Nenhuma atividade gravada ainda
            </div>
            <div className="text-[11px] text-slate-400">
              Ao iniciar e finalizar um percurso pelo <strong>APK Android</strong>, a telemetria em tempo real será exibida aqui.
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {activities.slice(0, 3).map((act, index) => (
              <div
                key={act.id || index}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {act.label || 'Atividade Física'}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {formatDate(act.date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {formatTime(act.durationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {act.totalDistanceKm.toFixed(2)} km
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {act.totalSteps} passos • {act.totalCalories} kcal
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner do APK */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] leading-tight">
            A captação ativa por <strong>GPS de precisão</strong> e <strong>Sensor de Passos (Hardware)</strong> opera exclusivamente no APK nativo do celular para economizar bateria e garantir 100% de estabilidade no PC.
          </span>
        </div>
      </div>
    </div>
  );
};
