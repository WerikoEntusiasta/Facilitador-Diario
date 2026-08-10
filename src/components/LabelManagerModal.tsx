import React, { useState } from 'react';
import { X, Tag, Plus, Trash2 } from 'lucide-react';
import { Label } from '../types';

interface LabelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onDeleteLabel: (id: number) => Promise<void>;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const LabelManagerModal: React.FC<LabelManagerModalProps> = ({
  isOpen,
  onClose,
  labels,
  onCreateLabel,
  onDeleteLabel,
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateLabel(name.trim(), selectedColor);
      setName('');
    } catch (err) {
      console.error('Erro ao criar etiqueta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Gerenciar Etiquetas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Add Label Form */}
        <form onSubmit={handleCreate} className="space-y-3">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Nova Etiqueta
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Urgente, Faculdade..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1"
            >
              <Plus size={16} />
              <span>Criar</span>
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Cor:</span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`w-5 h-5 rounded-full transition ${
                  selectedColor === c ? 'ring-2 ring-indigo-600 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </form>

        {/* Existing Labels List */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 max-h-60 overflow-y-auto">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Etiquetas Existentes ({labels.length})
          </label>

          {labels.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Nenhuma etiqueta cadastrada.</p>
          ) : (
            labels.map((lbl) => (
              <div
                key={lbl.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: lbl.color }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {lbl.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteLabel(lbl.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition"
                  title="Excluir Etiqueta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
