import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  FileText,
  Sparkles,
  Dumbbell,
  Send,
  KeyRound,
  QrCode,
} from 'lucide-react';
import { WorkoutRoutine } from '../types';
import {
  buildWorkoutShareUrl,
  buildWorkoutTextSummary,
  getPublicAppBaseUrl,
} from '../lib/workoutShare';

interface WorkoutShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutRoutine | null;
}

export const WorkoutShareModal: React.FC<WorkoutShareModalProps> = ({
  isOpen,
  onClose,
  workout,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen || !workout) return null;

  const shareCode = workout.share_code || `TRN-${workout.id}`;
  const shareUrl = buildWorkoutShareUrl(workout);
  const textSummary = buildWorkoutTextSummary(workout);
  const publicBaseUrl = getPublicAppBaseUrl();

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 3000);
    } catch (err) {
      prompt('Copie o código do treino:', shareCode);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (err) {
      prompt('Copie o link de compartilhamento:', shareUrl);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textSummary);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (err) {
      prompt('Copie o texto da ficha:', textSummary);
    }
  };

  const handleShareWhatsApp = () => {
    const whatsappMessage = `🏋️ *Ficha de Treino: ${workout.title}*\n\n🔑 *Código no KeepFlow:* ${shareCode}\n\nPara copiar este treino para a sua conta, abra a aba *Treino* no KeepFlow, clique em *Importar por Código* e digite: *${shareCode}*\n\nOu acesse diretamente pelo link:\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha de Treino: ${workout.title}`,
          text: `Código de Treino no KeepFlow: ${shareCode}. Copie na aba Treinos!`,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored or cancelled by user
      }
    }
  };

  const totalExercises = workout.days.reduce(
    (acc, day) => acc + (day.exercises ? day.exercises.length : 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" /> Compartilhamento de Treino
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Compartilhar Ficha
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. HIGHLIGHTED SHARE CODE SECTION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" /> Código de Compartilhamento
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Copiar com 1 Clique
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <div className="text-center sm:text-left">
              <span className="text-[11px] text-indigo-200 block font-medium">Código do Treino:</span>
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-300 select-all">
                {shareCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
                copiedCode
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" /> Código Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Código
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-indigo-200/90 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5">
            👉 <strong>Como o outro usuário importa:</strong> Ele só precisa abrir a aba <strong>Treino</strong> no aplicativo, clicar em <strong>"Importar por Código"</strong> e digitar este código. A ficha completa será copiada instantaneamente para a conta dele!
          </div>
        </div>

        {/* Workout Preview Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-emerald-500" />
              {workout.title}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {totalExercises} exercícios • 7 dias
            </span>
          </div>
          {workout.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {workout.description}
            </p>
          )}
        </div>

        {/* Share Link Field (Alternative) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ou Compartilhe via Link Direto
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 select-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" /> Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copiar Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Enviar no WhatsApp com Código
          </button>

          <button
            onClick={handleCopyText}
            className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              copiedText
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" /> Texto Copiado!
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-slate-500" /> Copiar Texto Completo
              </>
            )}
          </button>
        </div>

        {/* Native Web Share API if supported */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Compartilhar pelo Sistema do Smartphone
          </button>
        )}
      </div>
    </div>
  );
};
