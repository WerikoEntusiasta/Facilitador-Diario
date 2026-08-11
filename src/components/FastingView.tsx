import React, { useState, useEffect } from 'react';
import {
  Flame,
  Play,
  Square,
  Clock,
  Droplets,
  Volume2,
  Bell,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  ChevronRight,
  Smartphone,
  Plus,
  Trash2,
  Award,
  Zap,
  RotateCcw,
} from 'lucide-react';
import { FastingSession } from '../types';
import {
  playFastingCompletionSound,
  requestFastingNotificationPermission,
  sendFastingCompletionNotification,
} from '../lib/fastingSound';
import { FastingWidget } from './FastingWidget';

interface FastingViewProps {
  sessions: FastingSession[];
  activeSession: FastingSession | null;
  onStartFasting: (hours: number, protocolName?: string, notes?: string) => void;
  onEndFasting: (notes?: string) => void;
  onCancelFasting: () => void;
  onAddWater: (ml: number) => void;
  onUndoWater?: () => void;
  onUpdateWaterGoal?: (goal: number) => void;
  onDeleteSession: (id: string) => void;
  showFloatingWidget: boolean;
  onToggleFloatingWidget: (show: boolean) => void;
}

const PROTOCOLS = [
  { hours: 12, name: '12:12 Iniciante', desc: '12h de Jejum / 12h Alimentação. Ideal para quem está começando.' },
  { hours: 16, name: '16:8 Intermitente', desc: '16h de Jejum / 8h Alimentação. O método mais popular e eficaz.' },
  { hours: 18, name: '18:6 Avançado', desc: '18h de Jejum / 6h Alimentação. Estimula maior autofagia e cetose.' },
  { hours: 20, name: '20:4 Guerreiro', desc: '20h de Jejum / 4h Alimentação. Janela de alimentação curta.' },
  { hours: 24, name: '24h OMAD', desc: 'Uma refeição por dia (One Meal A Day). Renovação celular intensa.' },
];

const FASTING_STAGES = [
  { minHours: 0, maxHours: 4, title: 'Nível de Açúcar Estável', desc: 'O corpo está processando a última refeição e estabilizando a glicose.', color: 'text-blue-500' },
  { minHours: 4, maxHours: 8, title: 'Queda de Insulina', desc: 'A insulina diminui e o corpo começa a usar o glicogênio estocado no fígado.', color: 'text-indigo-500' },
  { minHours: 8, maxHours: 12, title: 'Início da Cetose', desc: 'Reserva de glicogênio esgotando. O corpo começa a queimar gordura para gerar energia.', color: 'text-purple-500' },
  { minHours: 12, maxHours: 18, title: 'Queima de Gordura Profunda', desc: 'Aceleração do estado de cetose. Produção de corpos cetônicos para o cérebro.', color: 'text-amber-500' },
  { minHours: 18, maxHours: 24, title: 'Autofagia Celular', desc: 'Limpeza e reciclagem celular. Remoção de componentes celulares velhos e danificados.', color: 'text-emerald-500' },
];

export const FastingView: React.FC<FastingViewProps> = ({
  sessions,
  activeSession,
  onStartFasting,
  onEndFasting,
  onCancelFasting,
  onAddWater,
  onUndoWater,
  onUpdateWaterGoal,
  onDeleteSession,
  showFloatingWidget,
  onToggleFloatingWidget,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(16);
  const [selectedProtocolName, setSelectedProtocolName] = useState<string>('16:8 Intermitente');
  const [customHours, setCustomHours] = useState<number>(16);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customSeconds, setCustomSeconds] = useState<number>(0);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  
  const [customWaterInput, setCustomWaterInput] = useState<string>('');
  const [goalInput, setGoalInput] = useState<string>(activeSession?.water_goal ? String(activeSession.water_goal) : '2500');
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  useEffect(() => {
    if (activeSession?.water_goal) {
      setGoalInput(String(activeSession.water_goal));
    }
  }, [activeSession?.water_goal]);

  const waterGoal = activeSession?.water_goal || 2500;
  const currentWater = activeSession?.water_ml || 0;
  const waterProgress = Math.min(100, Math.round((currentWater / waterGoal) * 100));
  const waterHistory = activeSession?.water_history || [];

  const handleAddCustomWater = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customWaterInput, 10);
    if (!isNaN(val) && val > 0) {
      onAddWater(val);
      setCustomWaterInput('');
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0 && onUpdateWaterGoal) {
      onUpdateWaterGoal(val);
      setIsEditingGoal(false);
    }
  };
  
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [notified, setNotified] = useState<boolean>(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean>(false);

  // Check notification permissions on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Timer loop for active session
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

  const handleEnableNotifications = async () => {
    const granted = await requestFastingNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      alert('Notificações ativadas! Você receberá um aviso assim que o tempo de jejum for concluído.');
    } else {
      alert('Não foi possível ativar as notificações do navegador. Verifique as permissões de notificação do site.');
    }
  };

  const handleStart = () => {
    let target = selectedHours;
    let protocol = selectedProtocolName;
    if (isCustom) {
      target = customHours + customMinutes / 60 + customSeconds / 3600;
      protocol = `Personalizado ${String(customHours).padStart(2, '0')}:${String(customMinutes).padStart(2, '0')}:${String(customSeconds).padStart(2, '0')}`;
    }
    requestFastingNotificationPermission();
    onStartFasting(target, protocol, notes);
    setNotes('');
  };

  const targetSeconds = (activeSession?.target_hours || 16) * 3600;
  const elapsedHours = elapsedSeconds / 3600;
  const progressPercent = Math.min(100, (elapsedSeconds / targetSeconds) * 100);
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const isFinished = elapsedSeconds >= targetSeconds && activeSession?.status === 'active';

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Find current metabolic stage
  const currentStage = FASTING_STAGES.find(
    (s) => elapsedHours >= s.minHours && elapsedHours < s.maxHours
  ) || FASTING_STAGES[FASTING_STAGES.length - 1];

  // Stats calculation
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalFastedHours = completedSessions.reduce((acc, curr) => {
    if (curr.end_time && curr.start_time) {
      const dur = (new Date(curr.end_time).getTime() - new Date(curr.start_time).getTime()) / 3600000;
      return acc + Math.max(0, dur);
    }
    return acc + curr.target_hours;
  }, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Sessão de Jejum Intermitente
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                Saúde & Performance
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Defina a meta de tempo, acompanhe no widget e receba alarme sonoro e notificação quando concluir.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Notification Button */}
          <button
            onClick={handleEnableNotifications}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
              notificationPermissionGranted
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {notificationPermissionGranted ? 'Notificações Ativas' : 'Ativar Notificações'}
          </button>

          {/* Test Sound Button */}
          <button
            onClick={() => playFastingCompletionSound()}
            className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition flex items-center gap-2"
            title="Testar sinal sonoro de término de jejum"
          >
            <Volume2 className="w-4 h-4" />
            Testar Som
          </button>

          {/* Toggle Floating Widget Button */}
          <button
            onClick={() => onToggleFloatingWidget(!showFloatingWidget)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
              showFloatingWidget
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {showFloatingWidget ? 'Ocultar Mini-Widget' : 'Ativar Mini-Widget Flutuante'}
          </button>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Timer or New Fast Selector */}
        <div className="lg:col-span-7 space-y-6">
          {activeSession && activeSession.status === 'active' ? (
            /* Active Fast Card */
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    Jejum em Andamento
                  </span>
                  <h2 className="text-xl font-black text-white mt-2">
                    Protocolo {activeSession.protocol_name || `${activeSession.target_hours}h`}
                  </h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Iniciado em</span>
                  <span className="text-xs font-mono font-medium text-slate-200">
                    {new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Huge Timer Ring & Digital Counter */}
              <div className="flex flex-col items-center justify-center my-6 space-y-4">
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 110}
                      strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
                      className="text-amber-400 transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-xs uppercase font-bold text-slate-400 mb-1">
                      {isFinished ? '🎉 META CONCLUÍDA!' : 'Tempo Restante'}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
                      {isFinished ? '00:00:00' : formatHMS(remainingSeconds)}
                    </span>
                    <span className="text-xs text-amber-300 font-semibold mt-1">
                      Decorrito: {formatHMS(elapsedSeconds)}
                    </span>
                    <span className="text-sm font-extrabold text-indigo-300 mt-1">
                      {Math.floor(progressPercent)}% Concluído
                    </span>
                  </div>
                </div>

                {isFinished && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-bounce">
                    <Award className="w-5 h-5 text-emerald-400" />
                    Parabéns! Você alcançou a sua meta. Pode encerrar e alimentar-se.
                  </div>
                )}
              </div>

              {/* Water Log Controls & Goal */}
              <div className="bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Hidratação & Meta de Água</h4>
                      <p className="text-xs text-blue-200 font-semibold">
                        {currentWater} ml / {waterGoal} ml ({waterProgress}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onUpdateWaterGoal && (
                      <button
                        onClick={() => setIsEditingGoal(!isEditingGoal)}
                        className="text-[11px] text-indigo-300 hover:text-indigo-200 underline font-medium"
                      >
                        {isEditingGoal ? 'Cancelar' : 'Definir Meta'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${waterProgress}%` }}
                    />
                  </div>
                </div>

                {/* Edit Goal Form */}
                {isEditingGoal && (
                  <form onSubmit={handleSaveGoal} className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="Meta em ml (ex: 3000)"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      min="100"
                      step="50"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                    >
                      Salvar Meta
                    </button>
                  </form>
                )}

                {/* Custom Water Input & Undo */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-white/10">
                  <form onSubmit={handleAddCustomWater} className="flex-1 flex items-center gap-2 w-full">
                    <input
                      type="number"
                      value={customWaterInput}
                      onChange={(e) => setCustomWaterInput(e.target.value)}
                      placeholder="Digite a quantidade em ml (ex: 300)"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      min="1"
                      step="1"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Água
                    </button>
                  </form>

                  {onUndoWater && waterHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={onUndoWater}
                      className="w-full sm:w-auto px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 shrink-0"
                      title="Voltar atrás / Desfazer último registro de água"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Voltar Atrás (-{waterHistory[waterHistory.length - 1]}ml)
                    </button>
                  )}
                </div>
              </div>

              {/* Stop / Cancel Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onEndFasting()}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Concluir & Salvar Jejum
                </button>

                <button
                  onClick={onCancelFasting}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* Configure New Fasting Session Form */
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Iniciar Nova Sessão de Jejum
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selecione um protocolo recomendado ou defina um tempo personalizado.
                </p>
              </div>

              {/* Protocol Options List */}
              <div className="space-y-2.5">
                {PROTOCOLS.map((p) => {
                  const isSelected = !isCustom && selectedHours === p.hours;
                  return (
                    <div
                      key={p.hours}
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedHours(p.hours);
                        setSelectedProtocolName(p.name);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          {p.desc}
                        </span>
                      </div>
                      <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400 shrink-0 ml-3">
                        {p.hours}h
                      </span>
                    </div>
                  );
                })}

                {/* Custom Option Toggle */}
                <div
                  onClick={() => setIsCustom(true)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isCustom
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Tempo Personalizado
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Defina a Duração
                    </span>
                  </div>

                  {isCustom && (
                    <div className="pt-3 grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Horas</label>
                        <input
                          type="number"
                          min="0"
                          max="168"
                          value={customHours}
                          onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Minutos</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Segundos</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={customSeconds}
                          onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Action Button */}
              <button
                onClick={handleStart}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98"
              >
                <Play className="w-5 h-5 fill-current" />
                Iniciar Cronômetro de Jejum Agora
              </button>
            </div>
          )}

          {/* Metabolic Fasting Stages Guide */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Etapas Metabólicas do Jejum
            </h3>

            <div className="space-y-3">
              {FASTING_STAGES.map((stage, idx) => {
                const isActiveStage =
                  activeSession?.status === 'active' &&
                  elapsedHours >= stage.minHours &&
                  elapsedHours < stage.maxHours;

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isActiveStage
                        ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${stage.color}`}>
                        {stage.minHours}h - {stage.maxHours}h: {stage.title}
                      </span>
                      {isActiveStage && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                          Fase Atual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Widget Card & Fasting History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Fasting Widget Box */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Widget em Tempo Real
            </h3>
            <FastingWidget
              activeSession={activeSession}
              onStartFasting={(hours, protocol) => onStartFasting(hours, protocol)}
              onEndFasting={() => onEndFasting()}
              onAddWater={onAddWater}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Total de Jejuns
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {completedSessions.length}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                Horas em Jejum
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                {Math.floor(totalFastedHours)}h
              </span>
            </div>
          </div>

          {/* Fasting History List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Histórico de Jejuns
              </h3>
              <span className="text-xs text-slate-400">{completedSessions.length} salvos</span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum jejum concluído ainda. Inicie o seu primeiro jejum acima!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {sessions.map((session) => {
                  const isDone = session.status === 'completed';
                  return (
                    <div
                      key={session.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {session.protocol_name || `${session.target_hours}h`}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isDone ? 'Concluído' : session.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {new Date(session.start_time).toLocaleDateString()} às{' '}
                          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.water_ml && session.water_ml > 0 && (
                          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                            <Droplets className="w-3 h-3" />
                            {session.water_ml}ml
                          </span>
                        )}

                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Excluir histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
