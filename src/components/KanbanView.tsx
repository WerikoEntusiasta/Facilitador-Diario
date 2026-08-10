import React, { useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Plus,
  MoreVertical,
  Calendar,
  AlertCircle,
  FileDown,
  CheckSquare,
  Trash2,
  Edit2,
  FolderPlus,
  Kanban as KanbanIcon,
} from 'lucide-react';
import { KanbanBoard, KanbanColumn, KanbanCard, Label, Priority } from '../types';
import { exportBoardToPdf } from '../lib/pdfExport';

interface KanbanViewProps {
  boards: KanbanBoard[];
  activeBoard: KanbanBoard | null;
  onSelectBoard: (boardId: number) => void;
  onCreateBoard: (board: { title: string; description?: string; color?: string }) => Promise<void>;
  onDeleteBoard: (id: number) => Promise<void>;
  onCreateColumn: (boardId: number, title: string) => Promise<void>;
  onDeleteColumn: (id: number) => Promise<void>;
  onSaveCard: (cardData: Partial<KanbanCard> & { labelIds?: number[] }) => Promise<void>;
  onMoveCard: (cardId: number, targetColumnId: number, newPosition: number) => Promise<void>;
  onDeleteCard: (id: number) => Promise<void>;
  onOpenCardModal: (card: Partial<KanbanCard> | null, columnId?: number) => void;
  allLabels: Label[];
  searchQuery: string;
}

const PRIORITY_BADGES: Record<Priority, { bg: string; text: string }> = {
  Baixa: { bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300', text: 'Baixa' },
  Média: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300', text: 'Média' },
  Alta: { bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300', text: 'Alta' },
  Urgente: { bg: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300', text: 'Urgente' },
};

export const KanbanView: React.FC<KanbanViewProps> = ({
  boards,
  activeBoard,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
  onCreateColumn,
  onDeleteColumn,
  onSaveCard,
  onMoveCard,
  onDeleteCard,
  onOpenCardModal,
  allLabels,
  searchQuery,
}) => {
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showNewColumnInput, setShowNewColumnInput] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const cardId = parseInt(draggableId.replace('card-', ''), 10);
    const targetColumnId = parseInt(destination.droppableId.replace('col-', ''), 10);
    const newPosition = destination.index;

    await onMoveCard(cardId, targetColumnId, newPosition);
  };

  const handleExportBoardPdf = async () => {
    if (!activeBoard) return;
    setIsExportingPdf(true);
    try {
      await exportBoardToPdf(activeBoard, true);
    } catch (err) {
      console.error('Erro ao exportar PDF do quadro:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCreateBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    await onCreateBoard({ title: newBoardTitle.trim(), description: newBoardDesc.trim() });
    setNewBoardTitle('');
    setNewBoardDesc('');
    setShowNewBoardModal(false);
  };

  const handleCreateColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBoard || !newColumnTitle.trim()) return;
    await onCreateColumn(activeBoard.id, newColumnTitle.trim());
    setNewColumnTitle('');
    setShowNewColumnInput(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Board Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <KanbanIcon size={20} />
          </div>

          <div className="flex-1 sm:flex-none">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Selecione o Quadro
            </label>
            <select
              value={activeBoard?.id || ''}
              onChange={(e) => onSelectBoard(Number(e.target.value))}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewBoardModal(true)}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
            title="Criar Novo Quadro"
          >
            <FolderPlus size={18} />
            <span className="hidden md:inline">Novo Quadro</span>
          </button>
        </div>

        {/* Action Buttons */}
        {activeBoard && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Export Board to PDF */}
            <button
              onClick={handleExportBoardPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
              title="Exportar Relatório PDF do Quadro"
            >
              <FileDown size={16} className={isExportingPdf ? 'animate-bounce' : ''} />
              <span>Exportar Quadro para PDF</span>
            </button>

            {/* Delete Board */}
            <button
              onClick={async () => {
                if (confirm(`Excluir o quadro "${activeBoard.title}" e todos seus cartões?`)) {
                  await onDeleteBoard(activeBoard.id);
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title="Excluir Quadro"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Main Kanban Board Layout */}
      {!activeBoard ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <KanbanIcon size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            Nenhum quadro selecionado
          </h3>
          <button
            onClick={() => setShowNewBoardModal(true)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            Criar Primeiro Quadro
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex items-start gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-280px)]">
            {/* Columns list */}
            {activeBoard.columns?.map((col) => {
              // Filter cards if search query active
              const filteredCards = (col.cards || []).filter((card) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  card.title.toLowerCase().includes(q) ||
                  card.description.toLowerCase().includes(q) ||
                  card.labels?.some((l) => l.name.toLowerCase().includes(q))
                );
              });

              return (
                <div
                  key={col.id}
                  className="w-80 shrink-0 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/60 flex flex-col max-h-[calc(100vh-280px)]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {col.title}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-slate-600 dark:text-slate-300">
                        {filteredCards.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenCardModal(null, col.id)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition"
                        title="Adicionar Cartão"
                      >
                        <Plus size={18} />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Excluir coluna "${col.title}"?`)) {
                            await onDeleteColumn(col.id);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-500 transition"
                        title="Excluir Coluna"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Cards Droppable Zone */}
                  <Droppable droppableId={`col-${col.id}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto space-y-3 p-1 rounded-xl transition ${
                          snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        {filteredCards.map((card, index) => (
                          <Draggable
                            key={card.id}
                            draggableId={`card-${card.id}`}
                            index={index}
                            {...({} as any)}
                          >
                            {(providedCard, snapshotCard) => (
                              <div
                                ref={providedCard.innerRef}
                                {...providedCard.draggableProps}
                                {...providedCard.dragHandleProps}
                                onClick={() => onOpenCardModal(card)}
                                className={`group bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5 ${
                                  snapshotCard.isDragging ? 'rotate-1 shadow-xl ring-2 ring-indigo-500' : ''
                                }`}
                              >
                                {/* Card Labels */}
                                {card.labels && card.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {card.labels.map((lbl) => (
                                      <span
                                        key={lbl.id}
                                        className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-2xs"
                                        style={{ backgroundColor: lbl.color }}
                                      >
                                        {lbl.name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Card Title */}
                                <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug break-words">
                                  {card.title}
                                </h4>

                                {/* Card Description snippet */}
                                {card.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                    {card.description}
                                  </p>
                                )}

                                {/* Footer Badges: Priority, Due Date, Checklist */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                                  {/* Priority pill */}
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      PRIORITY_BADGES[card.priority || 'Média'].bg
                                    }`}
                                  >
                                    {card.priority || 'Média'}
                                  </span>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    {/* Checklist counter */}
                                    {card.checklist && card.checklist.length > 0 && (
                                      <span className="flex items-center gap-1 font-medium">
                                        <CheckSquare size={13} className="text-emerald-500" />
                                        {card.checklist.filter((c) => c.completed).length}/{card.checklist.length}
                                      </span>
                                    )}

                                    {/* Due date */}
                                    {card.due_date && (
                                      <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                                        <Calendar size={13} className="text-indigo-500" />
                                        {new Date(card.due_date).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Quick Add Card Button */}
                        <button
                          onClick={() => onOpenCardModal(null, col.id)}
                          className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1"
                        >
                          <Plus size={14} />
                          <span>Adicionar Cartão</span>
                        </button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

            {/* Add Column Button / Form */}
            <div className="w-72 shrink-0">
              {!showNewColumnInput ? (
                <button
                  onClick={() => setShowNewColumnInput(true)}
                  className="w-full py-3 bg-slate-200/50 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl border border-slate-300/60 dark:border-slate-700/60 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Adicionar Nova Coluna</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCreateColumnSubmit}
                  className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-2"
                >
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Nome da coluna (ex: Revisão)..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewColumnInput(false)}
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                    >
                      Criar Coluna
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Modal: New Board */}
      {showNewBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateBoardSubmit}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Criar Novo Quadro Kanban
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Título do Quadro *
              </label>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Ex: Projeto Lançamento 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
                placeholder="Objetivos e informações do quadro..."
                rows={3}
                className="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBoardModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Criar Quadro
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
