import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Check,
  Sparkles,
  Mic,
  MicOff,
  Palette,
  Tag,
  Pin,
  ListTodo,
  ExternalLink,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Note, Label } from '../../types';
import { apiCreateNote, apiGetNotes, apiGetLabels } from '../../lib/api';

const NOTE_COLORS = [
  { name: 'Padrão', value: '#ffffff', darkValue: '#1e293b', border: 'border-slate-300 dark:border-slate-700' },
  { name: 'Amarelo', value: '#fef08a', darkValue: '#713f12', border: 'border-amber-400' },
  { name: 'Verde', value: '#bbf7d0', darkValue: '#14532d', border: 'border-emerald-400' },
  { name: 'Ciano', value: '#bae6fd', darkValue: '#0c4a6e', border: 'border-sky-400' },
  { name: 'Roxo', value: '#e9d5ff', darkValue: '#581c87', border: 'border-purple-400' },
  { name: 'Rosa', value: '#fbcfe8', darkValue: '#831843', border: 'border-pink-400' },
  { name: 'Escuro', value: '#334155', darkValue: '#0f172a', border: 'border-slate-600' },
];

export const QuickNoteWidget: React.FC<{
  onOpenGuideModal?: () => void;
  onOpenStandaloneWidget?: () => void;
  onNoteCreated?: (note: Note) => void;
}> = ({ onOpenGuideModal, onOpenStandaloneWidget, onNoteCreated }) => {
  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('kb_widget_quicknote_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('kb_widget_quicknote_size', size);
  };

  // Note Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [isPinned, setIsPinned] = useState(false);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; completed: boolean }[]>([
    { id: '1', text: '', completed: false },
  ]);
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voice Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Recent notes preview
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Load labels and recent notes
    apiGetLabels().then((lbs) => {
      if (Array.isArray(lbs)) setAvailableLabels(lbs);
    }).catch(() => {});

    loadRecentNotes();
  }, []);

  const loadRecentNotes = () => {
    apiGetNotes(false, false).then((nts) => {
      if (Array.isArray(nts)) {
        setRecentNotes(nts.slice(0, 4));
      }
    }).catch(() => {});
  };

  // Speech Recognition initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'pt-BR';

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recog.onerror = () => {
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Erro ao iniciar microfone:', err);
      }
    }
  };

  const handleAddChecklistItem = () => {
    setChecklistItems([...checklistItems, { id: String(Date.now()), text: '', completed: false }]);
  };

  const handleUpdateChecklistItem = (id: string, text: string) => {
    setChecklistItems(checklistItems.map((it) => (it.id === id ? { ...it, text } : it)));
  };

  const handleRemoveChecklistItem = (id: string) => {
    if (checklistItems.length > 1) {
      setChecklistItems(checklistItems.filter((it) => it.id !== id));
    }
  };

  const handleSaveNote = async () => {
    const cleanTitle = title.trim();
    let finalContent = content.trim();

    if (isChecklistMode) {
      const validItems = checklistItems.filter((it) => it.text.trim());
      if (validItems.length === 0 && !cleanTitle) {
        alert('Digite um título ou item para salvar a nota.');
        return;
      }
      finalContent = validItems.map((it) => `[${it.completed ? 'x' : ' '}] ${it.text.trim()}`).join('\n');
    } else {
      if (!cleanTitle && !finalContent) {
        alert('Digite um título ou conteúdo para a nota.');
        return;
      }
    }

    setIsSaving(true);

    try {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }

      const notePayload: Partial<Note> & { labelIds?: number[] } = {
        title: cleanTitle || 'Nota Rápida',
        content: finalContent,
        color: selectedColor,
        is_pinned: isPinned,
        is_archived: false,
        is_trashed: false,
        labelIds: selectedLabelId ? [selectedLabelId] : [],
      };

      const created = await apiCreateNote(notePayload);

      // Haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }

      // Reset form
      setTitle('');
      setContent('');
      setIsChecklistMode(false);
      setChecklistItems([{ id: '1', text: '', completed: false }]);
      setSelectedColor('#ffffff');
      setSelectedLabelId(null);
      setIsPinned(false);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      loadRecentNotes();

      if (onNoteCreated) {
        onNoteCreated(created);
      }

      window.dispatchEvent(new Event('kb_note_saved'));
    } catch (err: any) {
      alert(`Erro ao salvar nota: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/20 relative overflow-hidden flex flex-col justify-between space-y-4">
      {/* Widget Header & Size Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-white">Widget de Nota Rápida</h3>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                1-Toque
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Captura instantânea de ideias para o Android</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              title="Como colocar na Tela Inicial do Android"
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition text-xs flex items-center gap-1 cursor-pointer"
            >
              <Smartphone size={13} />
              <span className="hidden sm:inline text-[10px] font-bold">Fixar no Celular</span>
            </button>
          )}

          {/* Size switcher */}
          <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-white/10 text-[10px]">
            <button
              onClick={() => handleSizeChange('minimal')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                widgetSize === 'minimal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mini
            </button>
            <button
              onClick={() => handleSizeChange('normal')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                widgetSize === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Card
            </button>
            <button
              onClick={() => handleSizeChange('detailed')}
              className={`px-2 py-0.5 rounded-md font-medium transition cursor-pointer ${
                widgetSize === 'detailed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expandido
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS OVERLAY NOTIFICATION */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Nota rápida criada e salva com sucesso!</span>
          </div>
          <span className="text-[10px] bg-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
            Sincronizado
          </span>
        </div>
      )}

      {/* MINIMAL VIEW (1-Line Quick Input + Voice) */}
      {widgetSize === 'minimal' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 rounded-2xl p-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote();
              }}
              placeholder="Criar nota rápida... (Ex: Comprar café)"
              className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-hidden px-2"
            />

            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-slate-300 hover:text-white'
              }`}
              title="Falar para criar nota por voz"
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            <button
              type="button"
              disabled={isSaving || (!content.trim() && !title.trim())}
              onClick={handleSaveNote}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      )}

      {/* NORMAL & DETAILED VIEW (Interactive Note Box) */}
      {(widgetSize === 'normal' || widgetSize === 'detailed') && (
        <div className="space-y-3">
          {/* Note Input Container */}
          <div
            className="rounded-2xl p-3 border transition space-y-2 relative"
            style={{
              backgroundColor: selectedColor !== '#ffffff' ? `${selectedColor}15` : 'rgba(15, 23, 42, 0.6)',
              borderColor: selectedColor !== '#ffffff' ? selectedColor : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Title & Pin row */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da nota..."
                className="w-full bg-transparent border-none text-sm font-bold text-white placeholder-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  isPinned ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
                title={isPinned ? 'Fixada no topo' : 'Fixar nota'}
              >
                <Pin size={14} className={isPinned ? 'fill-amber-300' : ''} />
              </button>
            </div>

            {/* Note Content OR Checklist */}
            {!isChecklistMode ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={widgetSize === 'detailed' ? 3 : 2}
                placeholder="Escreva sua nota ou anotação rápida aqui..."
                className="w-full bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden resize-none leading-relaxed"
              />
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {checklistItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setChecklistItems(
                          checklistItems.map((it) => (it.id === item.id ? { ...it, completed: !it.completed } : it))
                        )
                      }
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-500 border-emerald-400 text-white'
                          : 'border-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {item.completed && <Check size={10} />}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddChecklistItem();
                      }}
                      placeholder={`Item ${idx + 1}...`}
                      className={`flex-1 bg-transparent border-none text-xs focus:outline-hidden ${
                        item.completed ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    />
                    {checklistItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Adicionar outro item</span>
                </button>
              </div>
            )}

            {/* Bottom Toolbar inside Note Box */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-1.5">
                {/* Voice Dictation */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white font-bold animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Falar para ditar nota por áudio"
                >
                  {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                  {isListening && <span className="text-[10px]">Ouvindo...</span>}
                </button>

                {/* Checklist Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChecklistMode(!isChecklistMode)}
                  className={`p-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                    isChecklistMode
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="Modo Lista de Tarefas / Checklist"
                >
                  <ListTodo size={13} />
                </button>

                {/* Color Selector Pills */}
                <div className="hidden sm:flex items-center gap-1 bg-slate-950/40 px-1.5 py-1 rounded-lg border border-white/5">
                  {NOTE_COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-3.5 h-3.5 rounded-full border transition cursor-pointer ${
                        selectedColor === c.value ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>

                {/* Label Selector */}
                {availableLabels.length > 0 && (
                  <select
                    value={selectedLabelId || ''}
                    onChange={(e) => setSelectedLabelId(e.target.value ? Number(e.target.value) : null)}
                    className="bg-slate-950/60 border border-white/10 rounded-lg text-[10px] text-slate-300 py-1 px-1.5 focus:outline-hidden"
                  >
                    <option value="">Sem Marcador</option>
                    {availableLabels.map((lbl) => (
                      <option key={lbl.id} value={lbl.id}>
                        🏷️ {lbl.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 1-Tap Save Button */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveNote}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Nota'}</span>
              </button>
            </div>
          </div>

          {/* DETAILED VIEW: Recent Notes List */}
          {widgetSize === 'detailed' && recentNotes.length > 0 && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Últimas Notas Criadas
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 hover:border-indigo-400/40 transition flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white line-clamp-1">
                        {note.title || 'Sem título'}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {note.content || 'Nota sem texto'}
                      </p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1">
                      {new Date(note.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widget Footer Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sincronização instantânea com o App & Servidor</span>
        </span>

        {onOpenStandaloneWidget && (
          <button
            type="button"
            onClick={onOpenStandaloneWidget}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Tela Standalone</span>
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
