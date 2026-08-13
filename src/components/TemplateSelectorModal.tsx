import React, { useState } from 'react';
import { X, Layout, StickyNote, Sparkles, Plus, Check } from 'lucide-react';
import { NOTE_TEMPLATES, BOARD_TEMPLATES, NoteTemplate, BoardTemplate } from '../lib/templates';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNoteTemplate: (tpl: NoteTemplate) => void;
  onApplyBoardTemplate: (tpl: BoardTemplate) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onApplyNoteTemplate,
  onApplyBoardTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'boards'>('notes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Modelos Prontos (Templates)</h3>
              <p className="text-xs text-slate-400">Comece rapidamente com estruturas pré-formatadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <StickyNote className="w-4 h-4" />
            Modelos de Notas ({NOTE_TEMPLATES.length})
          </button>
          <button
            onClick={() => setActiveTab('boards')}
            className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'boards'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            Modelos de Quadros Kanban ({BOARD_TEMPLATES.length})
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {activeTab === 'notes' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NOTE_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tpl.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      onApplyNoteTemplate(tpl);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Usar este Modelo
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BOARD_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-500 dark:hover:border-indigo-500 transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition">
                      {tpl.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {tpl.columns.map((col, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {col.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onApplyBoardTemplate(tpl);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Quadro
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
