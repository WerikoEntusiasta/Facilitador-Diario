import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  Search,
  X,
  Plus,
  Sparkles,
  Info,
  Check,
  Flame,
  Filter,
  RefreshCw,
  Layers,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import {
  ExerciseDbItem,
  fetchExerciseDb,
  BODY_PART_TRANSLATIONS,
  EQUIPMENT_TRANSLATIONS,
  TARGET_TRANSLATIONS,
} from '../lib/exerciseDb';
import { Exercise } from '../types';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Omit<Exercise, 'id'>) => void;
  targetDayName?: string;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  onAddExercise,
  targetDayName,
}) => {
  const [exercises, setExercises] = useState<ExerciseDbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDbItem | null>(null);

  // Quick addition customization modal / drawer
  const [customizingItem, setCustomizingItem] = useState<ExerciseDbItem | null>(null);
  const [customSets, setCustomSets] = useState('4');
  const [customReps, setCustomReps] = useState('10-12');
  const [customWeight, setCustomWeight] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchExerciseDb();
      setExercises(data);
    } catch (err) {
      console.error('Erro ao carregar banco de exercícios:', err);
    } finally {
      setLoading(false);
    }
  };

  // Distinct lists of body parts and equipments from actual loaded dataset
  const bodyParts = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => {
      if (e.bodyPart) set.add(e.bodyPart.toLowerCase());
    });
    return Array.from(set);
  }, [exercises]);

  const equipments = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => {
      if (e.equipment) set.add(e.equipment.toLowerCase());
    });
    return Array.from(set);
  }, [exercises]);

  // Filtering logic
  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return exercises.filter((ex) => {
      const matchesSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.target?.toLowerCase().includes(q) ||
        (TARGET_TRANSLATIONS[ex.target] && TARGET_TRANSLATIONS[ex.target].toLowerCase().includes(q)) ||
        (BODY_PART_TRANSLATIONS[ex.bodyPart] && BODY_PART_TRANSLATIONS[ex.bodyPart].toLowerCase().includes(q));

      const matchesBodyPart =
        selectedBodyPart === 'all' || ex.bodyPart?.toLowerCase() === selectedBodyPart.toLowerCase();

      const matchesEquipment =
        selectedEquipment === 'all' || ex.equipment?.toLowerCase() === selectedEquipment.toLowerCase();

      return matchesSearch && matchesBodyPart && matchesEquipment;
    });
  }, [exercises, searchQuery, selectedBodyPart, selectedEquipment]);

  // Handle click on Add
  const handleStartAdd = (item: ExerciseDbItem) => {
    setCustomizingItem(item);
    setCustomSets('4');
    setCustomReps('10-12');
    setCustomWeight('');
    setCustomNotes(
      item.instructions && item.instructions.length > 0
        ? item.instructions[0].slice(0, 80)
        : `Foco: ${TARGET_TRANSLATIONS[item.target] || item.target}`
    );
  };

  const handleConfirmAdd = () => {
    if (!customizingItem) return;

    onAddExercise({
      name: customizingItem.name,
      sets: customSets || '4',
      reps: customReps || '10-12',
      weight: customWeight || '',
      notes: customNotes || '',
      completed: false,
      gif_url: customizingItem.gifUrl,
      body_part: customizingItem.bodyPart,
      equipment: customizingItem.equipment,
      target: customizingItem.target,
    });

    setAddedToast(`"${customizingItem.name}" adicionado ao treino!`);
    setCustomizingItem(null);
    setTimeout(() => {
      setAddedToast(null);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[94vh] max-h-[900px]">
        {/* Header with Title & Stats */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 sm:p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/15 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              Catálogo Completo Gratuito (+1.300 Exercícios)
            </span>
            {targetDayName && (
              <span className="px-3 py-1 bg-emerald-500/30 backdrop-blur-md rounded-full text-[11px] font-bold border border-white/20">
                Inserindo em: {targetDayName}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Biblioteca de Treinos & Animações com GIFs
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
            Explore exercícios indexados por grupo muscular e equipamento com demonstrações em GIF animado, instruções de execução e inclusão direta na sua ficha.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome (ex: Supino, Agachamento, Rosca, Leg Press, Puxada, Deltoide, Squat...)"
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Muscle & Equipment Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Body Part Filter */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Grupos Musculares</option>
                {bodyParts.map((bp) => (
                  <option key={bp} value={bp}>
                    {BODY_PART_TRANSLATIONS[bp] || bp.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Filter */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
              <Dumbbell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todos os Equipamentos</option>
                {equipments.map((eq) => (
                  <option key={eq} value={eq}>
                    {EQUIPMENT_TRANSLATIONS[eq] || eq}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter */}
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              {filteredExercises.length} exercícios encontrados
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {addedToast && (
          <div className="mx-4 mt-3 p-3 bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center justify-between animate-fadeIn shrink-0">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> {addedToast}
            </span>
            <button onClick={() => setAddedToast(null)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Exercises Grid Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">
                Carregando catálogo completo de exercícios e animações...
              </p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Dumbbell className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Nenhum exercício encontrado com esses filtros.
              </p>
              <p className="text-xs text-slate-400">
                Tente buscar por termos mais genéricos ou limpe os filtros acima.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBodyPart('all');
                  setSelectedEquipment('all');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredExercises.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between space-y-3 group"
                >
                  {/* Top: Icon badge & details */}
                  <div className="flex gap-3 items-start">
                    {/* Muscle category icon */}
                    <div
                      onClick={() => setSelectedExercise(item)}
                      className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shrink-0 flex items-center justify-center font-bold text-xs cursor-pointer group-hover:scale-105 transition"
                      title="Clique para ver instruções"
                    >
                      <Dumbbell className="w-6 h-6" />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => setSelectedExercise(item)}
                        className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 cursor-pointer group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                          {BODY_PART_TRANSLATIONS[item.bodyPart] || item.bodyPart}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 text-[10px] font-medium">
                          {EQUIPMENT_TRANSLATIONS[item.equipment] || item.equipment}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        Alvo: <strong className="text-slate-700 dark:text-slate-300">{TARGET_TRANSLATIONS[item.target] || item.target}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setSelectedExercise(item)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      Instruções
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartAdd(item)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      title="Adicionar à ficha de treino"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Biblioteca de Exercícios Completa</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>

      {/* DETAIL MODAL (INSTRUCTIONS) */}
      {selectedExercise && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                    Ficha Técnica do Exercício
                  </span>
                  <h3 className="text-base font-black text-white leading-tight">
                    {selectedExercise.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedExercise.name}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    Músculo: {BODY_PART_TRANSLATIONS[selectedExercise.bodyPart] || selectedExercise.bodyPart}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    Equipamento: {EQUIPMENT_TRANSLATIONS[selectedExercise.equipment] || selectedExercise.equipment}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    Alvo: {TARGET_TRANSLATIONS[selectedExercise.target] || selectedExercise.target}
                  </span>
                </div>
              </div>

              {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Músculos Secundários / Estabilizadores:
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedExercise.secondaryMuscles.map((sm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px]"
                      >
                        {TARGET_TRANSLATIONS[sm] || sm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Instruções Passo a Passo:
                  </h5>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {selectedExercise.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Voltar ao Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedExercise;
                    setSelectedExercise(null);
                    handleStartAdd(item);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Adicionar à Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CUSTOMIZATION MODAL */}
      {customizingItem && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Adicionar ao Treino
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[280px]">
                  {customizingItem.name}
                </p>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {BODY_PART_TRANSLATIONS[customizingItem.bodyPart] || customizingItem.bodyPart} • {EQUIPMENT_TRANSLATIONS[customizingItem.equipment] || customizingItem.equipment}
                </span>
                <span className="text-slate-400 text-[11px]">
                  {targetDayName ? `Destino: ${targetDayName}` : 'Dia selecionado na ficha'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Séries
                </label>
                <input
                  type="text"
                  value={customSets}
                  onChange={(e) => setCustomSets(e.target.value)}
                  placeholder="4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Repetições
                </label>
                <input
                  type="text"
                  value={customReps}
                  onChange={(e) => setCustomReps(e.target.value)}
                  placeholder="10-12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Carga (kg)
                </label>
                <input
                  type="text"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="Ex: 20kg"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dicas / Notas de Execução
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ex: Pausa de 1s, cotovelos fechados"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" /> Confirmar Inclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
