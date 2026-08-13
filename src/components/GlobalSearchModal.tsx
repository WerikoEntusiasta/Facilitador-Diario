import React, { useState, useEffect } from 'react';
import { Search, X, StickyNote, Layout, Dumbbell, FileText, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Note, KanbanCard, WorkoutRoutine, PdfDocument } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  cards: KanbanCard[];
  workouts: WorkoutRoutine[];
  documents: PdfDocument[];
  onSelectNote: (note: Note) => void;
  onSelectCard?: (card: KanbanCard) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  notes,
  cards,
  workouts,
  documents,
  onSelectNote,
  onSelectCard,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'cards' | 'workouts' | 'documents'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredNotes = (filterType === 'all' || filterType === 'notes') && q
    ? notes.filter(n => !n.is_trashed && (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)))
    : [];

  const filteredCards = (filterType === 'all' || filterType === 'cards') && q
    ? cards.filter(c => !c.is_trashed && (c.title.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))))
    : [];

  const filteredWorkouts = (filterType === 'all' || filterType === 'workouts') && q
    ? workouts.filter(w => w.title.toLowerCase().includes(q) || (w.description && w.description.toLowerCase().includes(q)))
    : [];

  const filteredDocuments = (filterType === 'all' || filterType === 'documents') && q
    ? documents.filter(d => d.filename.toLowerCase().includes(q) || (d.extracted_text && d.extracted_text.toLowerCase().includes(q)))
    : [];

  const totalResults = filteredNotes.length + filteredCards.length + filteredWorkouts.length + filteredDocuments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisa global em notas, quadros, treinos e PDF..."
            className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">ESC</span>
        </div>

        {/* Filter Categories */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full font-medium transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tudo ({totalResults})
          </button>
          <button
            onClick={() => setFilterType('notes')}
            className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
              filterType === 'notes'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Notas ({filteredNotes.length})
          </button>
          <button
            onClick={() => setFilterType('cards')}
            className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
              filterType === 'cards'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Kanban ({filteredCards.length})
          </button>
          <button
            onClick={() => setFilterType('workouts')}
            className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
              filterType === 'workouts'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Treinos ({filteredWorkouts.length})
          </button>
          <button
            onClick={() => setFilterType('documents')}
            className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 ${
              filterType === 'documents'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Documentos ({filteredDocuments.length})
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {!q ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm">Digite para pesquisar em todo o aplicativo.</p>
              <p className="text-xs text-slate-400">Pressione <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ctrl + K</kbd> a qualquer momento.</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400 italic text-sm">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <div className="space-y-3">
              {/* Notes */}
              {filteredNotes.map((note) => (
                <div
                  key={`n_${note.id}`}
                  onClick={() => {
                    onSelectNote(note);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-slate-100 dark:border-slate-800 hover:border-amber-300 cursor-pointer transition group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <StickyNote className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 transition">
                        {note.title || 'Nota Sem Título'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition shrink-0 mt-1" />
                </div>
              ))}

              {/* Cards */}
              {filteredCards.map((card) => (
                <div
                  key={`c_${card.id}`}
                  onClick={() => {
                    if (onSelectCard) onSelectCard(card);
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-100 dark:border-slate-800 hover:border-blue-300 cursor-pointer transition group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Layout className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition">
                        {card.title}
                      </h4>
                    </div>
                    {card.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition shrink-0 mt-1" />
                </div>
              ))}

              {/* Workouts */}
              {filteredWorkouts.map((w) => (
                <div
                  key={`w_${w.id}`}
                  onClick={() => onClose()}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-100 dark:border-slate-800 hover:border-rose-300 cursor-pointer transition group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        <Dumbbell className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-600 transition">
                        {w.title}
                      </h4>
                    </div>
                    {w.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {w.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Documents */}
              {filteredDocuments.map((doc) => (
                <div
                  key={`d_${doc.id}`}
                  onClick={() => onClose()}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-100 dark:border-slate-800 hover:border-emerald-300 cursor-pointer transition group flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition">
                        {doc.filename}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
