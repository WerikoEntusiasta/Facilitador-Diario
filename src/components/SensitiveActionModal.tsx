import React, { useState } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface SensitiveActionModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  currentUser: User | null;
  onConfirm: () => void;
  onClose: () => void;
  confirmKeyword?: string; // e.g. "deletar" or "reverter"
}

export const SensitiveActionModal: React.FC<SensitiveActionModalProps> = ({
  isOpen,
  title = 'Confirmação de Ação Sensível',
  message,
  currentUser,
  onConfirm,
  onClose,
  confirmKeyword = 'deletar',
}) => {
  const [typedText, setTypedText] = useState('');
  const isAdmin = currentUser?.is_admin === 1;

  if (!isOpen) return null;

  const keywordLower = confirmKeyword.toLowerCase();
  const isTypedCorrectly = !isAdmin || typedText.trim().toLowerCase() === keywordLower;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            {isAdmin ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            {isAdmin && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                Modo Administrador • Confirmação Escrita Obrigatória
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        {isAdmin && (
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Para confirmar como Admin, digite <span className="font-mono text-amber-600 font-bold">"{confirmKeyword}"</span> abaixo:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`Digite "${confirmKeyword}"`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isTypedCorrectly}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isTypedCorrectly
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            Confirmar Ação
          </button>
        </div>
      </div>
    </div>
  );
};
