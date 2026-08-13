import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { Note, KanbanBoard, WorkoutRoutine, Label } from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  boards: KanbanBoard[];
  workouts: WorkoutRoutine[];
  labels: Label[];
  onImportBackup: (data: { notes?: Note[]; boards?: KanbanBoard[]; workouts?: WorkoutRoutine[]; labels?: Label[] }) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  notes,
  boards,
  workouts,
  labels,
  onImportBackup,
}) => {
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const backupData = {
      app: 'KeepBoard',
      version: '2.0.0',
      exported_at: new Date().toISOString(),
      notes,
      boards,
      workouts,
      labels,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `keepboard_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('Formato de arquivo inválido.');
        }

        onImportBackup({
          notes: Array.isArray(parsed.notes) ? parsed.notes : [],
          boards: Array.isArray(parsed.boards) ? parsed.boards : [],
          workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
          labels: Array.isArray(parsed.labels) ? parsed.labels : [],
        });

        setImportStatus({
          type: 'success',
          msg: 'Backup importado com sucesso! Seus dados foram atualizados.',
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          msg: err.message || 'Erro ao processar o arquivo de backup.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Backup e Restauração de Dados</h3>
              <p className="text-xs text-slate-400">Baixe uma cópia de segurança em JSON ou restaure arquivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status overview */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block">Notas Salvas:</span>
            <strong className="text-sm text-slate-800 dark:text-slate-200">{notes.length} itens</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Quadros Kanban:</span>
            <strong className="text-sm text-slate-800 dark:text-slate-200">{boards.length} quadros</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Treinos:</span>
            <strong className="text-sm text-slate-800 dark:text-slate-200">{workouts.length} rotinas</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Etiquetas:</span>
            <strong className="text-sm text-slate-800 dark:text-slate-200">{labels.length} cadastradas</strong>
          </div>
        </div>

        {/* Export & Import Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExportJson}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Download className="w-4 h-4" /> Exportar Backup Completo (.JSON)
          </button>

          <label className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-dashed border-slate-300 dark:border-slate-700">
            <Upload className="w-4 h-4" /> Importar / Restaurar de Arquivo JSON
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {/* Status Alert */}
        {importStatus && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.msg}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Seus backups são mantidos totalmente privados e compatíveis offline.</span>
        </div>
      </div>
    </div>
  );
};
