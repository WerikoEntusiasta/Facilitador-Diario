import React, { useState } from 'react';
import {
  Pin,
  PinOff,
  Bell,
  FileDown,
  Archive,
  Trash2,
  CheckSquare,
  Square,
  Tag,
  Palette,
  Edit3,
  Paperclip,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Note, Label, ChecklistItem } from '../types';
import { exportNoteToPdf } from '../lib/pdfExport';
import { PRESET_COLORS, getNoteCardStyle } from '../lib/colors';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onTogglePin: (id: number) => void;
  onToggleArchive: (id: number) => void;
  onToggleTrash: (id: number) => void;
  onUpdateNote: (id: number, updated: Partial<Note>) => void;
  allLabels: Label[];
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onToggleTrash,
  onUpdateNote,
  allLabels,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleChecklistToggle = (itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedChecklist = note.checklist.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    onUpdateNote(note.id, { checklist: updatedChecklist });
  };

  const handleColorSelect = (colorHex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote(note.id, { color: colorHex });
    setShowColorPicker(false);
  };

  const handlePdfExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      await exportNoteToPdf(note, true);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const isDarkColor = note.color && note.color !== '#ffffff' && note.color !== '#fef3c7' && note.color !== '#e0f2fe' && note.color !== '#dcfce7' && note.color !== '#f3e8ff' && note.color !== '#fce7f3' && note.color !== '#ffedd5';

  return (
    <div
      onClick={() => onEdit(note)}
      style={getNoteCardStyle(note.color)}
      className={`group relative rounded-2xl p-4 bg-[var(--note-bg-light)] dark:bg-[var(--note-bg-dark)] border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
        note.is_pinned ? 'ring-2 ring-indigo-500/80' : ''
      }`}
    >
      {/* Top Header: Pin & Title */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug break-words pr-6">
            {note.title || 'Nota sem título'}
          </h3>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`p-1.5 rounded-full transition ${
              note.is_pinned
                ? 'bg-indigo-500 text-white shadow-xs'
                : 'text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={note.is_pinned ? 'Desafixar nota' : 'Fixar nota no topo'}
          >
            {note.is_pinned ? <Pin size={16} className="fill-current" /> : <Pin size={16} />}
          </button>
        </div>

        {/* Text Content */}
        {note.content && (
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-6 mb-3">
            {note.content}
          </p>
        )}

        {/* Interactive Checklist */}
        {note.checklist && note.checklist.length > 0 && (
          <div className="space-y-1.5 my-3">
            {note.checklist.slice(0, 8).map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={(e) => handleChecklistToggle(idx, e)}
                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:opacity-80 transition cursor-pointer"
              >
                {item.completed ? (
                  <CheckSquare size={16} className="text-emerald-600 shrink-0 fill-emerald-100 dark:fill-emerald-950" />
                ) : (
                  <Square size={16} className="text-slate-400 shrink-0" />
                )}
                <span className={`break-words ${item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 8 && (
              <div className="text-[11px] text-slate-500 font-medium pt-1">
                + {note.checklist.length - 8} itens adicionais...
              </div>
            )}
          </div>
        )}

        {/* Attachments Preview */}
        {note.attachments && note.attachments.length > 0 && (
          <div className="my-3 space-y-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Paperclip size={12} />
              <span>Anexos ({note.attachments.length})</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {note.attachments.slice(0, 4).map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition overflow-hidden group/att"
                  title={`${att.name} (Clique para abrir)`}
                >
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-slate-800 dark:text-slate-200 truncate">
                      {att.name}
                    </p>
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover/att:underline">
                      Abrir
                    </span>
                  </div>
                </a>
              ))}
            </div>
            {note.attachments.length > 4 && (
              <p className="text-[10px] text-slate-500 font-medium">
                + {note.attachments.length - 4} outros anexos
              </p>
            )}
          </div>
        )}

        {/* Labels & Reminder badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {note.reminder_date && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300/40">
              <Bell size={12} />
              {new Date(note.reminder_date).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          {note.labels &&
            note.labels.map((lbl) => (
              <span
                key={lbl.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-700 dark:text-slate-200 bg-black/5 dark:bg-white/10"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                {lbl.name}
              </span>
            ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          {/* Color palette button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
              title="Cor de Fundo"
            >
              <Palette size={15} />
            </button>

            {showColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 bottom-full mb-2 z-20 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-1.5 min-w-[140px]"
              >
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={(e) => handleColorSelect(c.value, e)}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition"
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Export to PDF button */}
          <button
            onClick={handlePdfExport}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
            title="Exportar Nota para PDF"
          >
            <FileDown size={15} className={isExporting ? 'animate-bounce text-indigo-600' : ''} />
          </button>

          {/* Archive button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleArchive(note.id);
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
            title={note.is_archived ? 'Desarquivar' : 'Arquivar Nota'}
          >
            <Archive size={15} />
          </button>

          {/* Move to Trash */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTrash(note.id);
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-red-500/10 hover:text-red-600 transition"
            title="Mover para Lixeira"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(note);
          }}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1 text-xs font-medium"
        >
          <Edit3 size={14} />
          <span className="hidden sm:inline">Editar</span>
        </button>
      </div>
    </div>
  );
};
