import React, { useState } from 'react';
import {
  Plus,
  Grid,
  List,
  Pin,
  CheckSquare,
  Palette,
  Bell,
  Tag,
  Search,
  Filter,
} from 'lucide-react';
import { Note, Label } from '../types';
import { NoteCard } from './NoteCard';
import { PRESET_COLORS, getNoteCardStyle } from '../lib/colors';

interface KeepNotesProps {
  notes: Note[];
  labels: Label[];
  searchQuery: string;
  selectedLabelId: number | null;
  onSelectLabel: (id: number | null) => void;
  onCreateNote: (note: Partial<Note> & { labelIds?: number[] }) => Promise<void>;
  onUpdateNote: (id: number, updated: Partial<Note> & { labelIds?: number[] }) => Promise<void>;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onToggleTrash: (id: number) => void;
  onOpenEditModal: (note: Note) => void;
}

export const KeepNotes: React.FC<KeepNotesProps> = ({
  notes,
  labels,
  searchQuery,
  selectedLabelId,
  onSelectLabel,
  onCreateNote,
  onUpdateNote,
  onTogglePin,
  onToggleArchive,
  onToggleTrash,
  onOpenEditModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isExpanded, setIsExpanded] = useState(false);

  // Quick creator state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [isPinned, setIsPinned] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickCreate = async () => {
    if (!title.trim() && !content.trim()) {
      setIsExpanded(false);
      return;
    }

    setIsCreating(true);
    try {
      await onCreateNote({
        title: title.trim(),
        content: content.trim(),
        checklist: [],
        color,
        is_pinned: isPinned,
        reminder_date: reminderDate || null,
        labelIds: selectedLabelIds,
      });

      // Reset form
      setTitle('');
      setContent('');
      setColor('#ffffff');
      setIsPinned(false);
      setReminderDate('');
      setSelectedLabelIds([]);
      setIsExpanded(false);
    } catch (err) {
      console.error('Erro ao criar nota:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter notes based on search query & selected label
  const filteredNotes = notes.filter((n) => {
    if (selectedLabelId && !n.labels.some((l) => l.id === selectedLabelId)) {
      return false;
    }

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = n.title.toLowerCase().includes(query);
    const contentMatch = n.content.toLowerCase().includes(query);
    const checklistMatch = n.checklist.some((c) => c.text.toLowerCase().includes(query));
    const labelMatch = n.labels.some((l) => l.name.toLowerCase().includes(query));

    return titleMatch || contentMatch || checklistMatch || labelMatch;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const otherNotes = filteredNotes.filter((n) => !n.is_pinned);

  const activeLabel = labels.find((l) => l.id === selectedLabelId);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Active Filter Banner if label or search is set */}
      {(selectedLabelId || searchQuery) && (
        <div className="flex items-center justify-between p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Filter size={16} />
            <span>
              Filtro Ativo:{' '}
              {activeLabel ? `Etiqueta "${activeLabel.name}"` : ''}
              {activeLabel && searchQuery ? ' • ' : ''}
              {searchQuery ? `Busca "${searchQuery}"` : ''}
            </span>
          </div>

          <button
            onClick={() => onSelectLabel(null)}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Remover Filtros
          </button>
        </div>
      )}

      {/* Top Quick Note Creator (Google Keep Style) */}
      <div className="max-w-xl mx-auto">
        <div
          style={getNoteCardStyle(color)}
          className={`rounded-2xl bg-[var(--note-bg-light)] dark:bg-[var(--note-bg-dark)] border border-slate-300 dark:border-slate-700 shadow-md transition-all duration-200 overflow-hidden ${
            isExpanded ? 'p-4' : 'px-4 py-3 cursor-pointer'
          }`}
          onClick={() => {
            if (!isExpanded) setIsExpanded(true);
          }}
        >
          {!isExpanded ? (
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm font-medium">
              <span>Criar uma nova nota...</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition"
                  title="Nova Nota"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Title & Pin */}
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título..."
                  className="w-full text-base font-bold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsPinned(!isPinned)}
                  className={`p-1.5 rounded-full transition ${
                    isPinned ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-black/5'
                  }`}
                  title={isPinned ? 'Desafixar' : 'Fixar no Topo'}
                >
                  <Pin size={16} />
                </button>
              </div>

              {/* Content textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Criar uma nota..."
                rows={3}
                className="w-full bg-transparent border-none outline-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed placeholder:text-slate-400 resize-none"
              />

              {/* Labels & Colors */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Preset colors */}
                  {[
                    '#ffffff',
                    '#fef3c7',
                    '#e0f2fe',
                    '#dcfce7',
                    '#f3e8ff',
                    '#fce7f3',
                    '#ffedd5',
                  ].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      className={`w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 transition ${
                        color === hex ? 'ring-2 ring-indigo-600 scale-110' : ''
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickCreate}
                    disabled={isCreating}
                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {isCreating ? 'Salvando...' : 'Concluir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Header & View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Suas Notas ({filteredNotes.length})
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
            title="Visualização em Grade"
          >
            <Grid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
            title="Visualização em Lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredNotes.length === 0 && (
        <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Plus size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nenhuma nota encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Crie sua primeira nota no campo acima ou ajuste os filtros de busca para visualizar mais resultados.
          </p>
        </div>
      )}

      {/* PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Pin size={14} className="text-indigo-500 fill-indigo-500" />
            <span>Fixadas ({pinnedNotes.length})</span>
          </div>

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3 max-w-3xl mx-auto'
            }
          >
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onOpenEditModal}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onToggleTrash={onToggleTrash}
                onUpdateNote={onUpdateNote}
                allLabels={labels}
              />
            ))}
          </div>
        </div>
      )}

      {/* OTHER NOTES SECTION */}
      {otherNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Outras
            </div>
          )}

          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-3 max-w-3xl mx-auto'
            }
          >
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={onOpenEditModal}
                onTogglePin={onTogglePin}
                onToggleArchive={onToggleArchive}
                onToggleTrash={onToggleTrash}
                onUpdateNote={onUpdateNote}
                allLabels={labels}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
