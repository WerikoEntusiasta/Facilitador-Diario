import React, { useState } from 'react';
import { Bell, Volume2, ShieldAlert, Check, X, Sparkles, Sliders } from 'lucide-react';
import { NotificationSettings } from '../types';
import { getStoredNotificationSettings, setStoredNotificationSettings, playNotificationAlertSound } from '../lib/notificationStore';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>(getStoredNotificationSettings);
  const [savedMessage, setSavedMessage] = useState(false);

  if (!isOpen) return null;

  const handleSave = (updated: NotificationSettings) => {
    setSettings(updated);
    setStoredNotificationSettings(updated);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const testAlarm = () => {
    playNotificationAlertSound(settings.bypassDND);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 text-white rounded-3xl max-w-lg w-full border border-indigo-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Notificações & Alertas</h2>
              <p className="text-xs text-slate-400">Configure prioridades, som e regras de alerta</p>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Master Toggle */}
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
            <div>
              <span className="text-sm font-bold block text-white">Ativar Notificações</span>
              <span className="text-xs text-slate-400">Receba avisos em tempo real no navegador</span>
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

          {/* Topics to Notify */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">O que deseja ser notificado?</h3>
            <div className="space-y-2">
              {[
                { key: 'notifyFasting', label: 'Jejum Intermitente', desc: 'Avisar término de metas de jejum' },
                { key: 'notifyWorkout', label: 'Treino da Academia', desc: 'Lembretes dos treinos do dia' },
                { key: 'notifyTasks', label: 'Tarefas e Prazos', desc: 'Alertas de tarefas pendentes e prazos' },
                { key: 'notifyCalendar', label: 'Calendário & Lembretes', desc: 'Compromissos e eventos agendados' },
              ].map((topic) => {
                const isChecked = (settings as any)[topic.key];
                return (
                  <div key={topic.key} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition">
                    <div>
                      <span className="text-xs font-bold text-white block">{topic.label}</span>
                      <span className="text-[11px] text-slate-400">{topic.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!settings.enabled}
                      checked={isChecked}
                      onChange={(e) => handleSave({ ...settings, [topic.key]: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Audio & DND Bypass */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">Regras de Áudio e Prioridade</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 p-3.5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Sons de Alerta</span>
                    <span className="text-[11px] text-slate-400">Tocar som ao disparar alarmes</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={!settings.enabled}
                  checked={settings.soundEnabled}
                  onChange={(e) => handleSave({ ...settings, soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="flex items-center justify-between bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-amber-200 block">Furar "Não Perturbe" (DND)</span>
                    <span className="text-[11px] text-amber-300/80">Forçar alerta de alta prioridade com som forte</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  disabled={!settings.enabled}
                  checked={settings.bypassDND}
                  onChange={(e) => handleSave({ ...settings, bypassDND: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={testAlarm}
              disabled={!settings.enabled}
              className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Testar Alarme Sonoro</span>
            </button>
            {savedMessage && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                <Check className="w-4 h-4" /> Salvo com sucesso!
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-end">
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
