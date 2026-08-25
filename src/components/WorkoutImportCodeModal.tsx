import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Download,
  Dumbbell,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { WorkoutRoutine } from '../types';
import { apiGetWorkoutByCode, apiImportWorkoutByCode } from '../lib/api';

interface WorkoutImportCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkoutImported: (importedWorkout: WorkoutRoutine) => void;
}

export const WorkoutImportCodeModal: React.FC<WorkoutImportCodeModalProps> = ({
  isOpen,
  onClose,
  onWorkoutImported,
}) => {
  const [code, setCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<(WorkoutRoutine & { author_name?: string; total_exercises?: number }) | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearchCode = async (searchVal?: string) => {
    const query = (searchVal !== undefined ? searchVal : code).trim().toUpperCase();
    if (!query) {
      setError('Por favor, digite o código do treino.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setPreviewWorkout(null);
    setSuccessMessage(null);

    try {
      const data = await apiGetWorkoutByCode(query);
      setPreviewWorkout(data);
    } catch (err: any) {
      setError(err.message || `Não foi possível encontrar nenhum treino com o código "${query}".`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async () => {
    const query = code.trim().toUpperCase();
    if (!query && !previewWorkout) {
      setError('Informe o código do treino.');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const targetCode = previewWorkout?.share_code || query;
      const res = await apiImportWorkoutByCode(targetCode);
      if (res.workout) {
        setSuccessMessage(res.message || 'Treino copiado com sucesso!');
        setTimeout(() => {
          onWorkoutImported(res.workout);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar o treino. Verifique sua conexão.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCode(val);
    setError(null);
    if (previewWorkout && previewWorkout.share_code !== val && `TRN-${previewWorkout.share_code}` !== val) {
      setPreviewWorkout(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!previewWorkout) {
        handleSearchCode();
      } else {
        handleImport();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-3 h-3" /> Copiar Rotina de Colega
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Importar Treino por Código
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

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Digite o código de compartilhamento fornecido pelo usuário A (ex: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">TRN-8A9K2</span>). A divisão completa de treinos e exercícios será copiada diretamente para os seus treinos.
        </p>

        {/* Input Box & Search Button */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Código do Treino
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={18} />
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ex: TRN-8A9K2"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono font-bold tracking-wider text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                autoFocus
              />
            </div>
            <button
              onClick={() => handleSearchCode()}
              disabled={isSearching || !code.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                </>
              ) : (
                <>
                  <span>Localizar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* Workout Preview Section */}
        {previewWorkout && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-slate-50 dark:from-indigo-950/30 dark:to-slate-800/50 border border-indigo-200 dark:border-indigo-800/50 space-y-3.5 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-md">
                  Treino Encontrado
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-indigo-500" />
                  {previewWorkout.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                {previewWorkout.share_code}
              </span>
            </div>

            {previewWorkout.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {previewWorkout.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Autor: <strong>{previewWorkout.author_name || 'Colega'}</strong>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                {previewWorkout.days?.length || 0} dias semanais
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                • {previewWorkout.total_exercises || 0} exercícios cadastrados
              </span>
            </div>

            {/* Days Summary preview */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Divisão dos Dias:
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {previewWorkout.days?.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/50"
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {day.day_name}
                      {day.subtitle && <span className="text-slate-400 font-normal"> - {day.subtitle}</span>}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {day.is_rest_day ? 'Descanso' : `${day.exercises?.length || 0} exs`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Copy Button */}
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Copiando Treino para sua Conta...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Copiar Ficha para Meus Treinos
                </>
              )}
            </button>
          </div>
        )}

        {/* Helpful Tips */}
        {!previewWorkout && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              💡 Como funciona o compartilhamento entre usuários:
            </span>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              <li>O <strong>Usuário A</strong> clica em <em>"Compartilhar Link / Código"</em> na ficha dele e copia o código (ex: <strong>TRN-XXXXX</strong>).</li>
              <li>O <strong>Usuário B</strong> digita esse código aqui e clica em <em>"Copiar Ficha"</em>.</li>
              <li>Toda a rotina, divisões musculares, repetições e cargas são clonadas na hora para a conta do Usuário B.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
