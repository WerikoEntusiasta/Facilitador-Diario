import React from 'react';
import { X, History, RotateCcw, Clock, FileText } from 'lucide-react';
import { Note } from '../types';

export interface NoteRevision {
  timestamp: string;
  title: string;
  content: string;
}

interface NoteHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  revisions: NoteRevision[];
  onRestoreRevision: (revision: NoteRevision) => void;
}

export const NoteHistoryModal: React.FC<NoteHistoryModalProps> = ({
  isOpen,
  onClose,
  note,
  revisions = [],
  onRestoreRevision,
}) => {
  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Histórico de Versões</h3>
              <p className="text-xs text-slate-400">Visualize e restaure versões passadas desta nota</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Note title */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
          <FileText className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-700 dark:text-slate-200">{note.title || 'Nota Sem Título'}</span>
        </div>

        {/* Revisions list */}
        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {revisions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic space-y-1">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p>Esta é a versão inicial da nota. Nenhuma revisão gravada anteriormente.</p>
            </div>
          ) : (
            revisions.map((rev, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(rev.timestamp).toLocaleString('pt-BR')}
                  </span>
                  <button
                    onClick={() => {
                      onRestoreRevision(rev);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">{rev.title || 'Sem título'}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">{rev.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
