import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Trash2,
  RotateCcw,
  ArchiveRestore,
  Trash,
  Loader2,
  FileText,
  Kanban,
} from 'lucide-react';
import { Note, KanbanCard, Label, User } from '../types';
import {
  apiGetNotes,
  apiToggleArchiveNote,
  apiGetTrashItems,
  apiRestoreTrashItem,
  apiEmptyTrash,
} from '../lib/api';
import { NoteCard } from './NoteCard';
import { SensitiveActionModal } from './SensitiveActionModal';

interface ArchiveTrashViewProps {
  mode: 'archive' | 'trash';
  allLabels: Label[];
  onOpenNoteEdit: (note: Note) => void;
  onRefreshCounts: () => void;
  currentUser?: User | null;
}

export const ArchiveTrashView: React.FC<ArchiveTrashViewProps> = ({
  mode,
  allLabels,
  onOpenNoteEdit,
  onRefreshCounts,
  currentUser,
}) => {
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([]);
  const [trashedCards, setTrashedCards] = useState<KanbanCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    message: string;
    keyword: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [mode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (mode === 'archive') {
        const notes = await apiGetNotes(true, false);
        setArchivedNotes(notes);
      } else {
        const trashData = await apiGetTrashItems();
        setTrashedNotes(trashData.notes);
        setTrashedCards(trashData.cards);
      }
    } catch (err) {
      console.error('Erro ao carregar itens da lixeira/arquivo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = (id: number) => {
    setPendingAction({
      title: 'Confirmar Reversão (Desarquivar)',
      message: 'Deseja desarquivar esta nota e retornar para o bloco principal?',
      keyword: 'reverter',
      onConfirm: async () => {
        try {
          await apiToggleArchiveNote(id);
          setArchivedNotes(archivedNotes.filter((n) => n.id !== id));
          onRefreshCounts();
        } catch (err) {
          console.error('Erro ao desarquivar:', err);
        }
      }
    });
  };

  const handleRestoreTrash = (type: 'note' | 'card', id: number) => {
    setPendingAction({
      title: 'Confirmar Restauração',
      message: 'Deseja restaurar este item da lixeira?',
      keyword: 'restaurar',
      onConfirm: async () => {
        try {
          await apiRestoreTrashItem(type, id);
          if (type === 'note') {
            setTrashedNotes(trashedNotes.filter((n) => n.id !== id));
          } else {
            setTrashedCards(trashedCards.filter((c) => c.id !== id));
          }
          onRefreshCounts();
        } catch (err) {
          console.error('Erro ao restaurar:', err);
        }
      }
    });
  };

  const handleEmptyTrash = () => {
    setPendingAction({
      title: 'Esvaziar Lixeira Permanentemente',
      message: 'Tem certeza que deseja excluir permanentemente todos os itens da lixeira? Esta ação é irreversível.',
      keyword: 'deletar',
      onConfirm: async () => {
        try {
          await apiEmptyTrash();
          setTrashedNotes([]);
          setTrashedCards([]);
          onRefreshCounts();
        } catch (err) {
          console.error('Erro ao esvaziar lixeira:', err);
        }
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            {mode === 'archive' ? <FolderArchive size={26} /> : <Trash2 size={26} />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'archive' ? 'Notas Arquivadas' : 'Lixeira'}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'archive'
                ? 'Notas salvas no arquivo para manter seu bloco limpo'
                : 'Itens excluídos que podem ser restaurados ou limpos'}
            </p>
          </div>
        </div>

        {mode === 'trash' && (trashedNotes.length > 0 || trashedCards.length > 0) && (
          <button
            onClick={handleEmptyTrash}
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
          >
            <Trash size={16} />
            <span>Esvaziar Lixeira</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-2 text-indigo-600" />
          Carregando...
        </div>
      ) : mode === 'archive' ? (
        /* ARCHIVE VIEW */
        archivedNotes.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <FolderArchive size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nenhuma nota arquivada
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {archivedNotes.map((note) => (
              <div key={note.id} className="relative group">
                <NoteCard
                  note={note}
                  onEdit={onOpenNoteEdit}
                  onTogglePin={() => {}}
                  onToggleArchive={() => handleUnarchive(note.id)}
                  onToggleTrash={() => {}}
                  onUpdateNote={() => {}}
                  allLabels={allLabels}
                />
                <button
                  onClick={() => handleUnarchive(note.id)}
                  className="absolute top-2 right-2 p-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition flex items-center gap-1"
                  title="Desarquivar Nota"
                >
                  <ArchiveRestore size={14} />
                  <span>Desarquivar</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TRASH VIEW */
        trashedNotes.length === 0 && trashedCards.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Trash2 size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Sua lixeira está vazia
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Trashed Notes */}
            {trashedNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText size={16} />
                  <span>Notas na Lixeira ({trashedNotes.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trashedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                          {note.title || 'Nota sem título'}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-3 mb-3">
                          {note.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.updated_at).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => handleRestoreTrash('note', note.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <RotateCcw size={14} />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trashed Cards */}
            {trashedCards.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Kanban size={16} />
                  <span>Cartões Kanban na Lixeira ({trashedCards.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trashedCards.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">
                          {card.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-600">
                          {card.priority}
                        </span>
                        <button
                          onClick={() => handleRestoreTrash('card', card.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <RotateCcw size={14} />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
      {pendingAction && (
        <SensitiveActionModal
          isOpen={!!pendingAction}
          title={pendingAction.title}
          message={pendingAction.message}
          confirmKeyword={pendingAction.keyword}
          currentUser={currentUser}
          onConfirm={pendingAction.onConfirm}
          onClose={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};
