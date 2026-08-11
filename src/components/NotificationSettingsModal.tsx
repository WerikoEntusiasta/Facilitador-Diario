import React, { useState } from 'react';
import { Bell, Volume2, ShieldAlert, Check, X, Sparkles, Sliders, VolumeX } from 'lucide-react';
import { NotificationSettings, NotificationPriority } from '../types';
import { getStoredNotificationSettings, setStoredNotificationSettings, playNotificationAlertSound, SOUND_OPTIONS } from '../lib/notificationStore';

interface NotificationSettingsModalProps {
prologue?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>(getStoredNotificationSettings);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (updated: NotificationSettings) => {
    // Automatically enable bypassDND if any notification is set to 'alta' or 'urgente'
    const hasHighOrUrgent =
      updated.fastingPriority === 'alta' ||
      updated.fastingPriority === 'urgente' ||
      updated.workoutPriority === 'alta' ||
      updated.workoutPriority === 'urgente' ||
      updated.tasksPriority === 'alta' ||
      updated.tasksPriority === 'urgente' ||
      updated.calendarPriority === 'alta' ||
      updated.calendarPriority === 'urgente';

    const finalSettings = {
      ...updated,
      bypassDND: hasHighOrUrgent ? true : updated.bypassDND,
    };

    setSettings(finalSettings);
    setStoredNotificationSettings(finalSettings);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const testAlarm = () => {
    playNotificationAlertSound(settings.selectedSound, settings.alertVolume, settings.bypassDND);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-white rounded-3xl max-w-xl w-full border border-indigo-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central Avançada de Notificações</h2>
              <p className="text-xs text-slate-400">Configure prioridades, 10 sons e regras de Não Perturbe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Master Toggle */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
            <div>
              <span className="text-sm font-bold block text-white">Ativar Sistema de Notificações</span>
              <span className="text-xs text-slate-400">Receba avisos detalhados em tempo real</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSave({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Detailed Topics & Priorities */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Configuração por Categoria & Prioridade</h3>
            <div className="space-y-3">
              {[
                {
                  key: 'notifyFasting',
                  priorityKey: 'fastingPriority',
                  label: 'Jejum Intermitente',
                  desc: 'Avisos de conclusão de ciclos de jejum',
                },
                {
                  key: 'notifyWorkout',
                  priorityKey: 'workoutPriority',
                  label: 'Treinos da Academia',
                  desc: 'Lembretes e rotinas de treino',
                },
                {
                  key: 'notifyTasks',
                  priorityKey: 'tasksPriority',
                  label: 'Tarefas e Prazos',
                  desc: 'Alertas de tarefas pendentes e prazos',
                },
                {
                  key: 'notifyCalendar',
                  priorityKey: 'calendarPriority',
                  label: 'Calendário & Lembretes',
                  desc: 'Compromissos agendados e eventos',
                },
              ].map((topic) => {
                const isChecked = (settings as any)[topic.key];
                const currentPriority = (settings as any)[topic.priorityKey] as NotificationPriority;
                return (
                  <div key={topic.key} className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={!settings.enabled}
                          checked={isChecked}
                          onChange={(e) => handleSave({ ...settings, [topic.key]: e.target.checked })}
                          className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{topic.label}</span>
                          <span className="text-[11px] text-slate-400">{topic.desc}</span>
                        </div>
                      </div>

                      {/* Priority selector */}
                      <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 text-[10px]">
                        {(['baixa', 'media', 'alta', 'urgente'] as NotificationPriority[]).map((p) => {
                          const active = currentPriority === p;
                          let activeColor = 'bg-slate-700 text-white';
                          if (active) {
                            if (p === 'baixa') activeColor = 'bg-blue-600 text-white';
                            if (p === 'media') activeColor = 'bg-emerald-600 text-white';
                            if (p === 'alta') activeColor = 'bg-amber-600 text-white';
                            if (p === 'urgente') activeColor = 'bg-rose-600 text-white animate-pulse';
                          }
                          return (
                            <button
                              key={p}
                              disabled={!settings.enabled || !isChecked}
                              onClick={() => handleSave({ ...settings, [topic.priorityKey]: p })}
                              className={`px-2 py-1 rounded-lg font-semibold capitalize transition ${activeColor} ${
                                !active ? 'text-slate-400 hover:text-white' : ''
                              } disabled:opacity-40`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 10 Sound Options & Volume */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Escolha de Som (10 Opções) & Volume</h3>
            <div className="space-y-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Toque de Notificação</span>
                  </div>
                  <span className="text-[11px] text-indigo-300 font-mono">Volume: {settings.alertVolume}%</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  disabled={!settings.enabled || !settings.soundEnabled}
                  value={settings.alertVolume}
                  onChange={(e) => handleSave({ ...settings, alertVolume: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer disabled:opacity-50"
                />

                <select
                  disabled={!settings.enabled || !settings.soundEnabled}
                  value={settings.selectedSound}
                  onChange={(e) => handleSave({ ...settings, selectedSound: e.target.value as any })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {SOUND_OPTIONS.map((snd) => (
                    <option key={snd.id} value={snd.id}>
                      {snd.label} — {snd.desc}
                    </option>
                  ))}
                </select>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!settings.enabled}
                      checked={settings.soundEnabled}
                      onChange={(e) => handleSave({ ...settings, soundEnabled: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-300">Habilitar Efeitos Sonoros</span>
                  </div>
                  <button
                    onClick={testAlarm}
                    disabled={!settings.enabled || !settings.soundEnabled}
                    className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Testar Som</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DND Bypass Rule */}
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 flex-shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-200 block">Furar "Não Perturbe" (DND) Automático</span>
                <span className="text-[11px] text-amber-300/80">Notificações com prioridade Alta ou Urgente ignoram o modo DND do dispositivo e tocam com força total.</span>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!settings.enabled}
              checked={settings.bypassDND}
              onChange={(e) => handleSave({ ...settings, bypassDND: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-50 flex-shrink-0"
            />
          </div>

          {savedMessage && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse py-1">
              <Check className="w-4 h-4" /> Configurações salvas e aplicadas em tempo real!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Gerenciamento persistente local
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg transition"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
