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
  Smartphone,
  CheckCircle2,
  Trash2,
  ArrowLeft,
  Share2,
  Layers,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Note, Label, User } from '../types';
import { apiCreateNote, apiGetLabels } from '../lib/api';

const NOTE_COLORS = [
  { name: 'Padrão', value: '#ffffff', bg: 'bg-white dark:bg-slate-900', border: 'border-slate-300 dark:border-slate-700' },
  { name: 'Amarelo', value: '#fef08a', bg: 'bg-yellow-100 dark:bg-amber-950/70', border: 'border-yellow-400' },
  { name: 'Verde', value: '#bbf7d0', bg: 'bg-emerald-100 dark:bg-emerald-950/70', border: 'border-emerald-400' },
  { name: 'Ciano', value: '#bae6fd', bg: 'bg-sky-100 dark:bg-sky-950/70', border: 'border-sky-400' },
  { name: 'Roxo', value: '#e9d5ff', bg: 'bg-purple-100 dark:bg-purple-950/70', border: 'border-purple-400' },
  { name: 'Rosa', value: '#fbcfe8', bg: 'bg-pink-100 dark:bg-pink-950/70', border: 'border-pink-400' },
  { name: 'Escuro', value: '#334155', bg: 'bg-slate-800 dark:bg-slate-950', border: 'border-slate-600' },
];

export const QuickNoteWidgetStandalone: React.FC<{
  currentUser: User | null;
  onOpenFullApp: () => void;
  onOpenAuthModal?: () => void;
}> = ({ currentUser, onOpenFullApp, onOpenAuthModal }) => {
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
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Voice Dictation
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Focus title input on load
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }

    apiGetLabels()
      .then((lbs) => {
        if (Array.isArray(lbs)) setAvailableLabels(lbs);
      })
      .catch(() => {});
  }, []);

  // Web Speech API
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

      recog.onerror = () => setIsListening(false);
      recog.onend = () => setIsListening(false);

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
        console.warn('Erro microfone:', err);
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

  const handleSave = async () => {
    const cleanTitle = title.trim();
    let finalContent = content.trim();

    if (isChecklistMode) {
      const validItems = checklistItems.filter((it) => it.text.trim());
      if (validItems.length === 0 && !cleanTitle) {
        alert('Digite o título ou item da nota.');
        return;
      }
      finalContent = validItems.map((it) => `[${it.completed ? 'x' : ' '}] ${it.text.trim()}`).join('\n');
    } else {
      if (!cleanTitle && !finalContent) {
        alert('Digite o título ou o conteúdo da nota.');
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

      await apiCreateNote(notePayload);

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 80, 50]);
      }

      setSavedCount((prev) => prev + 1);
      setSavedSuccess(true);

      // Reset fields for new note
      setTitle('');
      setContent('');
      setIsChecklistMode(false);
      setChecklistItems([{ id: '1', text: '', completed: false }]);
      setSelectedColor('#ffffff');
      setSelectedLabelId(null);
      setIsPinned(false);

      window.dispatchEvent(new Event('kb_note_saved'));
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 font-sans">
      {/* Top Bar */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-1.5">
              <span>Nota Rápida</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                Widget Android
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              {currentUser ? `Conectado como ${currentUser.name}` : 'Modo Offline / Sincronizado'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFullApp}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          <span>Abrir App</span>
          <ExternalLink size={12} />
        </button>
      </header>

      {/* Main Widget Card */}
      <main className="max-w-md w-full mx-auto my-auto py-4 space-y-4">
        {savedSuccess && (
          <div className="p-4 bg-emerald-500/20 border border-emerald-400/50 rounded-2xl flex items-center justify-between text-xs text-emerald-300 animate-fadeIn shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Nota salva com sucesso!</span>
                <span className="text-[10px] text-emerald-200">
                  Total salvo nesta sessão: {savedCount} nota(s)
                </span>
              </div>
            </div>
            <button
              onClick={() => setSavedSuccess(false)}
              className="text-[10px] font-bold text-emerald-300 underline cursor-pointer"
            >
              Criar outra
            </button>
          </div>
        )}

        <div
          className="rounded-3xl p-5 border shadow-2xl transition space-y-3 relative"
          style={{
            backgroundColor: selectedColor !== '#ffffff' ? `${selectedColor}18` : 'rgba(15, 23, 42, 0.85)',
            borderColor: selectedColor !== '#ffffff' ? selectedColor : 'rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Note Title & Pin */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota..."
              className="w-full bg-transparent border-none text-base font-black text-white placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isPinned ? 'bg-amber-500/30 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
              title={isPinned ? 'Nota fixada' : 'Fixar nota'}
            >
              <Pin size={16} className={isPinned ? 'fill-amber-300' : ''} />
            </button>
          </div>

          {/* Content Box or Checklist */}
          {!isChecklistMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Digite o conteúdo da sua nota ou use o microfone para ditar por voz..."
              className="w-full bg-transparent border-none text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden resize-none leading-relaxed"
            />
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {checklistItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setChecklistItems(
                        checklistItems.map((it) => (it.id === item.id ? { ...it, completed: !it.completed } : it))
                      )
                    }
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {item.completed && <Check size={12} />}
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
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar outro item</span>
              </button>
            </div>
          )}

          {/* Color bar */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                    selectedColor === c.value ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Labels */}
            {availableLabels.length > 0 && (
              <select
                value={selectedLabelId || ''}
                onChange={(e) => setSelectedLabelId(e.target.value ? Number(e.target.value) : null)}
                className="bg-slate-900 border border-white/10 rounded-xl text-xs text-slate-300 py-1 px-2 focus:outline-hidden"
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

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex-1 py-3 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-white/10 hover:bg-white/15 text-slate-200'
                }`}
                title="Ditar por voz"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isListening ? 'Ouvindo...' : 'Gravar Áudio'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChecklistMode(!isChecklistMode)}
                className={`py-3 px-3 rounded-2xl font-bold text-xs transition cursor-pointer ${
                  isChecklistMode ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/15 text-slate-200'
                }`}
                title="Lista de tarefas"
              >
                <ListTodo size={16} />
              </button>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={18} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Nota'}</span>
            </button>
          </div>
        </div>

        {/* Shortcut notice */}
        <div className="text-center text-[11px] text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Smartphone size={13} className="text-emerald-400" />
            <span>Dica: Adicione este atalho na Tela Inicial do seu celular para acesso instantâneo.</span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto py-2 text-center text-[10px] text-slate-500">
        KeepFlow Android Widget • Sincronização em Tempo Real
      </footer>
    </div>
  );
};
