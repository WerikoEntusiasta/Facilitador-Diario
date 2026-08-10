import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  Bell,
  Tag,
  Palette,
  FileDown,
  Pin,
  Check,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Music,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Note, Label, ChecklistItem, NoteAttachment } from '../types';
import { exportNoteToPdf } from '../lib/pdfExport';
import { PRESET_COLORS, getNoteCardStyle } from '../lib/colors';
import { apiUploadNoteAttachment } from '../lib/api';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Partial<Note> | null;
  onSave: (noteData: Partial<Note> & { labelIds?: number[] }) => Promise<void>;
  allLabels: Label[];
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
  allLabels,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [isPinned, setIsPinned] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setChecklist(note.checklist || []);
      setAttachments(note.attachments || []);
      setColor(note.color || '#ffffff');
      setIsPinned(Boolean(note.is_pinned));
      setReminderDate(note.reminder_date || '');
      setSelectedLabelIds(note.labels ? note.labels.map((l) => l.id) : []);
      setIsChecklistMode((note.checklist && note.checklist.length > 0) || false);
    } else {
      setTitle('');
      setContent('');
      setChecklist([]);
      setAttachments([]);
      setColor('#ffffff');
      setIsPinned(false);
      setReminderDate('');
      setSelectedLabelIds([]);
      setIsChecklistMode(false);
    }
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await apiUploadNoteAttachment(files[i]);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar anexo');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddChecklistItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistText.trim()) return;

    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: newChecklistText.trim(), completed: false },
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
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
    setIsSubmitting(true);
    try {
      await onSave({
        id: note?.id,
        title,
        content,
        checklist,
        attachments,
        color,
        is_pinned: isPinned,
        reminder_date: reminderDate || null,
        labelIds: selectedLabelIds,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao salvar nota:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfExport = async () => {
    const tempNote: Note = {
      id: note?.id || 0,
      title: title || 'Nota sem Título',
      content,
      checklist,
      color,
      is_pinned: isPinned,
      is_archived: false,
      is_trashed: false,
      reminder_date: reminderDate || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: allLabels.filter((l) => selectedLabelIds.includes(l.id)),
    };
    await exportNoteToPdf(tempNote, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        style={getNoteCardStyle(color)}
        className="w-full max-w-2xl rounded-3xl p-6 bg-[var(--note-bg-light)] dark:bg-[var(--note-bg-dark)] shadow-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col max-h-[90vh] overflow-hidden transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-xl transition ${
                isPinned ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={isPinned ? 'Nota Fixada' : 'Fixar Nota'}
            >
              <Pin size={18} />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {note?.id ? 'Editar Nota' : 'Nova Nota'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePdfExport}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-medium"
              title="Exportar em PDF"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título da nota..."
            className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />

          {/* Action buttons (Checklist & File Attachment) */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setIsChecklistMode(!isChecklistMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 transition"
            >
              <CheckSquare size={14} />
              <span>{isChecklistMode ? 'Esconder Lista de Tarefas' : 'Adicionar Lista de Tarefas'}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer font-semibold">
              {isUploading ? (
                <Loader2 size={14} className="animate-spin text-indigo-600" />
              ) : (
                <Paperclip size={14} />
              )}
              <span>{isUploading ? 'Anexando...' : 'Anexar Arquivo/Foto'}</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Anexos ({attachments.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 overflow-hidden hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    {att.type === 'image' ? (
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 shrink-0"
                      />
                    ) : att.type === 'pdf' ? (
                      <div className="w-12 h-12 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-bold text-xs">
                        PDF
                      </div>
                    ) : att.type === 'audio' ? (
                      <div className="w-12 h-12 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Music size={20} />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {att.name}
                      </p>
                      {att.size && (
                        <p className="text-[10px] text-slate-500">
                          {(att.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                      >
                        <ExternalLink size={10} />
                        Abrir / Baixar
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 rounded-lg transition hover:bg-black/10"
                      title="Remover anexo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Text Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite o conteúdo da sua nota aqui..."
            rows={5}
            className="w-full bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed placeholder:text-slate-400 resize-none"
          />

          {/* Interactive Checklist Editor */}
          {isChecklistMode && (
            <div className="space-y-3 pt-2 border-t border-black/10 dark:border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lista de Tarefas
              </h4>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className="text-slate-500 hover:text-indigo-600"
                    >
                      {item.completed ? (
                        <CheckSquare size={18} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setChecklist(
                          checklist.map((c) => (c.id === item.id ? { ...c, text: newText } : c))
                        );
                      }}
                      className={`flex-1 bg-transparent border-b border-black/10 dark:border-white/10 text-sm outline-none ${
                        item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add item input */}
              <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-1">
                <Plus size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Novo item da lista (Pressione Enter)..."
                  className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-700 text-sm outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
                >
                  Adicionar
                </button>
              </form>
            </div>
          )}

          {/* Color Picker & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-black/10 dark:border-white/10">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Cor de Fundo
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center transition ${
                      color === c.value ? 'ring-2 ring-indigo-600 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {color === c.value && <Check size={14} className="text-slate-800" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bell size={14} className="text-amber-500" />
                <span>Lembrete (Data e Hora)</span>
              </label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-100 text-xs border border-transparent outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Labels Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag size={14} className="text-indigo-500" />
              <span>Etiquetas</span>
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
                        : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/10'
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

        {/* Modal Footer */}
        <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Nota'}
          </button>
        </div>
      </div>
    </div>
  );
};
