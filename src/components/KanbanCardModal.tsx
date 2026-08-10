import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  AlertCircle,
  Tag,
  AlignLeft,
} from 'lucide-react';
import { KanbanCard, Priority, Label, ChecklistItem } from '../types';

interface KanbanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Partial<KanbanCard> | null;
  columnId?: number;
  boardId?: number;
  onSave: (cardData: Partial<KanbanCard> & { labelIds?: number[] }) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  allLabels: Label[];
}

const PRIORITIES: { label: Priority; color: string; bg: string }[] = [
  { label: 'Baixa', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200' },
  { label: 'Média', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200' },
  { label: 'Alta', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200' },
  { label: 'Urgente', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/50 border-red-200' },
];

export const KanbanCardModal: React.FC<KanbanCardModalProps> = ({
  isOpen,
  onClose,
  card,
  columnId,
  boardId,
  onSave,
  onDelete,
  allLabels,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Média');
  const [dueDate, setDueDate] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title || '');
      setDescription(card.description || '');
      setPriority(card.priority || 'Média');
      setDueDate(card.due_date ? card.due_date.split('T')[0] : '');
      setChecklist(card.checklist || []);
      setSelectedLabelIds(card.labels ? card.labels.map((l) => l.id) : []);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Média');
      setDueDate('');
      setChecklist([]);
      setSelectedLabelIds([]);
    }
  }, [card, isOpen]);

  if (!isOpen) return null;

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistText.trim()) return;

    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleLabelToggle = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      setSelectedLabelIds(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      setSelectedLabelIds([...selectedLabelIds, labelId]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        id: card?.id,
        column_id: card?.column_id || columnId,
        board_id: card?.board_id || boardId,
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate || null,
        checklist,
        labelIds: selectedLabelIds,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar cartão:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {card?.id ? 'Editar Cartão' : 'Novo Cartão'}
          </span>
          <div className="flex items-center gap-2">
            {card?.id && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Deseja excluir este cartão?')) {
                    await onDelete(card.id!);
                    onClose();
                  }
                }}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                title="Excluir Cartão"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Título do Cartão *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Refatorar API de Clientes..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlignLeft size={14} />
              <span>Descrição / Detalhes</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione informações detalhadas sobre esta tarefa..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-500" />
                <span>Nível de Prioridade</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setPriority(p.label)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center ${
                      priority === p.label
                        ? `${p.bg} ${p.color} ring-2 ring-indigo-500`
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-500" />
                <span>Data Limite (Due Date)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare size={14} className="text-emerald-500" />
              <span>Lista de Subtarefas ({checklist.filter((c) => c.completed).length}/{checklist.length})</span>
            </label>

            <div className="space-y-2 mb-3">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(item.id)}
                    className="text-slate-500 hover:text-indigo-600"
                  >
                    {item.completed ? (
                      <CheckSquare size={18} className="text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <span className={`flex-1 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="text-slate-400 hover:text-red-500 transition p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Nova subtarefa..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
              >
                <Plus size={16} />
              </button>
            </form>
          </div>

          {/* Labels Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-500" />
              <span>Etiquetas do Cartão</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allLabels.map((lbl) => {
                const isSelected = selectedLabelIds.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => handleLabelToggle(lbl.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.color }} />
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Cartão'}
          </button>
        </div>
      </div>
    </div>
  );
};
