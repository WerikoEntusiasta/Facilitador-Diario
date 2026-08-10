import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Flame,
  TrendingUp,
  Calendar,
  RotateCcw,
  Sparkles,
  Clock,
  ChevronRight,
  Save,
  X,
  Play,
  Award,
  Share2,
  Info,
} from 'lucide-react';
import { WorkoutRoutine, WorkoutDay, Exercise } from '../types';
import { apiGetWorkouts, apiCreateWorkout, apiUpdateWorkout, apiDeleteWorkout } from '../lib/api';

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const PRESET_ROUTINES: Array<{ title: string; description: string; days: WorkoutDay[] }> = [
  {
    title: 'ABC - Hipertrofia Tradicional',
    description: 'Divisão clássica de 3 dias para ganho de massa muscular (Push, Pull, Legs)',
    days: [
      {
        id: 'p1',
        day_name: 'Segunda-feira',
        subtitle: 'Treino A - Peito, Tríceps e Ombros',
        exercises: [
          { id: 'pe1', name: 'Supino Reto com Barra', sets: '4', reps: '8-10', weight: '30kg cada lado', notes: 'Manter escápulas retraídas' },
          { id: 'pe2', name: 'Supino Inclinado com Halteres', sets: '3', reps: '10-12', weight: '20kg', notes: 'Foco no peitoral superior' },
          { id: 'pe3', name: 'Crossover na Polia Média', sets: '3', reps: '12-15', weight: '15kg', notes: 'Esmagar no centro' },
          { id: 'pe4', name: 'Desenvolvimento c/ Halteres', sets: '4', reps: '10', weight: '16kg', notes: 'Deltoide anterior' },
          { id: 'pe5', name: 'Elevação Lateral na Polia', sets: '4', reps: '12-15', weight: '7kg', notes: 'Controle na descida' },
          { id: 'pe6', name: 'Tríceps Corda', sets: '4', reps: '12', weight: '25kg', notes: 'Abrir a corda na extensão' },
        ],
      },
      {
        id: 'p2',
        day_name: 'Terça-feira',
        subtitle: 'Treino B - Costas, Bíceps e Trapézio',
        exercises: [
          { id: 'pe7', name: 'Puxada Alta Aberta', sets: '4', reps: '10-12', weight: '50kg', notes: 'Puxar até o peito' },
          { id: 'pe8', name: 'Remada Curvada com Barra', sets: '4', reps: '8-10', weight: '22kg cada lado', notes: 'Coluna ereta' },
          { id: 'pe9', name: 'Remada Baixa Triângulo', sets: '3', reps: '12', weight: '45kg', notes: 'Contrair dorsais' },
          { id: 'pe10', name: 'Crucifixo Invertido Máquina', sets: '3', reps: '15', weight: '30kg', notes: 'Deltoide posterior' },
          { id: 'pe11', name: 'Rosca Direta Barra W', sets: '4', reps: '10-12', weight: '10kg cada lado', notes: 'Sem balançar o corpo' },
          { id: 'pe12', name: 'Rosca Martelo c/ Halteres', sets: '3', reps: '12', weight: '14kg', notes: 'Foco no braquial' },
        ],
      },
      {
        id: 'p3',
        day_name: 'Quarta-feira',
        subtitle: 'Descanso Ativo & Mobilidade',
        is_rest_day: true,
        exercises: [
          { id: 'pe13', name: 'Caminhada Moderada na Esteira', sets: '1', reps: '30 min', weight: 'Inclinado', notes: 'Cardio zona 2' },
        ],
      },
      {
        id: 'p4',
        day_name: 'Quinta-feira',
        subtitle: 'Treino C - Pernas Completo e Panturrilhas',
        exercises: [
          { id: 'pe14', name: 'Agachamento Livre com Barra', sets: '4', reps: '8-10', weight: '35kg cada lado', notes: 'Abaixo de 90 graus' },
          { id: 'pe15', name: 'Leg Press 45°', sets: '4', reps: '10-12', weight: '160kg', notes: 'Sem travar os joelhos' },
          { id: 'pe16', name: 'Cadeira Extensora', sets: '3', reps: '12-15', weight: '40kg', notes: 'Pausa de 1s no topo' },
          { id: 'pe17', name: 'Mesa Flexora', sets: '4', reps: '10-12', weight: '35kg', notes: 'Posterior de coxa' },
          { id: 'pe18', name: 'Gêmeos em Pé', sets: '5', reps: '15-20', weight: '60kg', notes: 'Alongar bem na descida' },
        ],
      },
      {
        id: 'p5',
        day_name: 'Sexta-feira',
        subtitle: 'Repetição Treino A (Peito / Ombros / Tríceps)',
        exercises: [
          { id: 'pe19', name: 'Supino Reto c/ Halteres', sets: '4', reps: '10', weight: '24kg', notes: 'Aumentar a amplitude' },
          { id: 'pe20', name: 'Desenvolvimento Arnold', sets: '4', reps: '10', weight: '14kg', notes: 'Ombros e tríceps' },
        ],
      },
      {
        id: 'p6',
        day_name: 'Sábado',
        subtitle: 'Repetição Treino B (Costas / Bíceps / Core)',
        exercises: [
          { id: 'pe21', name: 'Barra Fixa ou Puxada Alta', sets: '4', reps: 'FALHA', weight: 'Peso do corpo', notes: 'Execução limpa' },
          { id: 'pe22', name: 'Abdominal Infra na Barra', sets: '4', reps: '15', weight: 'Peso do corpo', notes: 'Fortalecimento do core' },
        ],
      },
      {
        id: 'p7',
        day_name: 'Domingo',
        subtitle: 'Descanso Total',
        is_rest_day: true,
        exercises: [],
      },
    ],
  },
  {
    title: 'Foco Glúteos & Pernas (Feminino)',
    description: 'Treino estruturado com alta frequência em membros inferiores e glúteos',
    days: [
      {
        id: 'f1',
        day_name: 'Segunda-feira',
        subtitle: 'Treino A - Glúteos & Posterior de Coxa',
        exercises: [
          { id: 'fe1', name: 'Elevação Pélvica com Barra', sets: '4', reps: '10-12', weight: '50kg', notes: 'Segurar 2s no topo' },
          { id: 'fe2', name: 'Agachamento Sumô c/ Halter', sets: '4', reps: '12', weight: '20kg', notes: 'Pés apontados para fora' },
          { id: 'fe3', name: 'Stiff c/ Barra ou Halteres', sets: '4', reps: '10-12', weight: '16kg cada lado', notes: 'Sentir o posterior alongar' },
          { id: 'fe4', name: 'Cadeira Abdutora', sets: '4', reps: '15', weight: '45kg', notes: 'Glúteo médio' },
        ],
      },
      {
        id: 'f2',
        day_name: 'Terça-feira',
        subtitle: 'Treino B - Membros Superiores Completo & Core',
        exercises: [
          { id: 'fe5', name: 'Puxada Frontal Aberta', sets: '3', reps: '12', weight: '35kg', notes: 'Postura firme' },
          { id: 'fe6', name: 'Desenvolvimento c/ Halteres', sets: '3', reps: '12', weight: '8kg', notes: 'Ombros' },
          { id: 'fe7', name: 'Tríceps Pulley + Rosca Biceps', sets: '3', reps: '12', weight: '15kg', notes: 'Bi-série' },
        ],
      },
      {
        id: 'f3',
        day_name: 'Quarta-feira',
        subtitle: 'Descanso Ativo ou HIIT',
        is_rest_day: true,
        exercises: [],
      },
      {
        id: 'f4',
        day_name: 'Quinta-feira',
        subtitle: 'Treino C - Quadríceps & Panturrilhas',
        exercises: [
          { id: 'fe8', name: 'Agachamento Livre', sets: '4', reps: '10', weight: '20kg cada lado', notes: 'Profundo' },
          { id: 'fe9', name: 'Afundo com Halteres ou Passada', sets: '3', reps: '12 cada perna', weight: '10kg', notes: 'Foco no quadríceps' },
          { id: 'fe10', name: 'Cadeira Extensora', sets: '4', reps: '12-15', weight: '30kg', notes: 'Isometria de 1s' },
        ],
      },
      {
        id: 'f5',
        day_name: 'Sexta-feira',
        subtitle: 'Treino D - Foco Isolado Glúteos',
        exercises: [
          { id: 'fe11', name: 'Glúteo na Polia (Coice)', sets: '4', reps: '12-15', weight: '12.5kg', notes: 'Sem hiperextender a lombar' },
          { id: 'fe12', name: 'Búlgaro com Halteres', sets: '3', reps: '10 cada perna', weight: '8kg', notes: 'Tronco levemente inclinado' },
        ],
      },
      {
        id: 'f6',
        day_name: 'Sábado',
        subtitle: 'Cardio & Abdômen',
        exercises: [
          { id: 'fe13', name: 'Transport / Elíptico', sets: '1', reps: '35 min', weight: 'Moderado', notes: 'Queima calórica' },
        ],
      },
      {
        id: 'f7',
        day_name: 'Domingo',
        subtitle: 'Descanso Total',
        is_rest_day: true,
        exercises: [],
      },
    ],
  },
];

export const WorkoutView: React.FC = () => {
  const [workouts, setWorkouts] = useState<WorkoutRoutine[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRoutine | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected Day Index (0: Sun, 1: Mon, ..., 6: Sat)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const todayNum = new Date().getDay(); // 0 is Sun, 1 is Mon
    return todayNum === 0 ? 6 : todayNum - 1; // Map 1..6 to 0..5 (Mon-Sat), 0 to 6 (Sun)
  });

  // Modal / Form States
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: '4',
    reps: '10-12',
    weight: '',
    notes: '',
  });

  // Edit Day Title Modal
  const [isDayEditOpen, setIsDayEditOpen] = useState(false);
  const [dayTitleForm, setDayTitleForm] = useState({ subtitle: '', is_rest_day: false });

  // Create Workout Routine Modal
  const [isNewWorkoutOpen, setIsNewWorkoutOpen] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const data = await apiGetWorkouts();
      setWorkouts(data);
      if (data.length > 0) {
        setActiveWorkout(data[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar treinos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = async (exerciseId: string) => {
    if (!activeWorkout) return;

    const currentDay = activeWorkout.days[selectedDayIndex];
    if (!currentDay) return;

    const updatedDays = activeWorkout.days.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) =>
          ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
        ),
      };
    });

    const updatedWorkout: WorkoutRoutine = {
      ...activeWorkout,
      days: updatedDays,
    };

    setActiveWorkout(updatedWorkout);

    try {
      await apiUpdateWorkout(activeWorkout.id, { days: updatedDays });
    } catch (err) {
      console.error('Erro ao salvar progresso do exercício:', err);
    }
  };

  const handleResetDayProgress = async () => {
    if (!activeWorkout) return;

    const updatedDays = activeWorkout.days.map((day, idx) => {
      if (idx !== selectedDayIndex) return day;
      return {
        ...day,
        exercises: day.exercises.map((ex) => ({ ...ex, completed: false })),
      };
    });

    const updatedWorkout = { ...activeWorkout, days: updatedDays };
    setActiveWorkout(updatedWorkout);
    await apiUpdateWorkout(activeWorkout.id, { days: updatedDays });
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkout || !exerciseForm.name.trim()) return;

    const currentDay = activeWorkout.days[selectedDayIndex];
    if (!currentDay) return;

    let newExercises: Exercise[];

    if (editingExercise) {
      newExercises = currentDay.exercises.map((ex) =>
        ex.id === editingExercise.id
          ? {
              ...ex,
              name: exerciseForm.name,
              sets: exerciseForm.sets,
              reps: exerciseForm.reps,
              weight: exerciseForm.weight,
              notes: exerciseForm.notes,
            }
          : ex
      );
    } else {
      const newEx: Exercise = {
        id: `ex-${Date.now()}`,
        name: exerciseForm.name,
        sets: exerciseForm.sets || '4',
        reps: exerciseForm.reps || '10-12',
        weight: exerciseForm.weight || '',
        notes: exerciseForm.notes || '',
        completed: false,
      };
      newExercises = [...currentDay.exercises, newEx];
    }

    const updatedDays = activeWorkout.days.map((day, idx) =>
      idx === selectedDayIndex ? { ...day, exercises: newExercises } : day
    );

    const updatedWorkout = { ...activeWorkout, days: updatedDays };
    setActiveWorkout(updatedWorkout);
    setIsExerciseModalOpen(false);
    setEditingExercise(null);
    setExerciseForm({ name: '', sets: '4', reps: '10-12', weight: '', notes: '' });

    await apiUpdateWorkout(activeWorkout.id, { days: updatedDays });
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!activeWorkout) return;

    const currentDay = activeWorkout.days[selectedDayIndex];
    if (!currentDay) return;

    const updatedExercises = currentDay.exercises.filter((ex) => ex.id !== exerciseId);
    const updatedDays = activeWorkout.days.map((day, idx) =>
      idx === selectedDayIndex ? { ...day, exercises: updatedExercises } : day
    );

    const updatedWorkout = { ...activeWorkout, days: updatedDays };
    setActiveWorkout(updatedWorkout);
    await apiUpdateWorkout(activeWorkout.id, { days: updatedDays });
  };

  const handleSaveDayTitle = async () => {
    if (!activeWorkout) return;

    const updatedDays = activeWorkout.days.map((day, idx) =>
      idx === selectedDayIndex
        ? {
            ...day,
            subtitle: dayTitleForm.subtitle,
            is_rest_day: dayTitleForm.is_rest_day,
          }
        : day
    );

    const updatedWorkout = { ...activeWorkout, days: updatedDays };
    setActiveWorkout(updatedWorkout);
    setIsDayEditOpen(false);
    await apiUpdateWorkout(activeWorkout.id, { days: updatedDays });
  };

  const handleLoadPreset = async (preset: (typeof PRESET_ROUTINES)[0]) => {
    try {
      const newW = await apiCreateWorkout({
        title: preset.title,
        description: preset.description,
        days: preset.days,
      });
      setWorkouts([newW, ...workouts]);
      setActiveWorkout(newW);
    } catch (err) {
      console.error('Erro ao carregar treino predefinido:', err);
    }
  };

  const handleDeleteWorkout = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta ficha de treino?')) return;
    try {
      await apiDeleteWorkout(id);
      const remaining = workouts.filter((w) => w.id !== id);
      setWorkouts(remaining);
      setActiveWorkout(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error('Erro ao excluir treino:', err);
    }
  };

  const currentDayData = activeWorkout?.days[selectedDayIndex];
  const completedCount = currentDayData?.exercises.filter((e) => e.completed).length || 0;
  const totalCount = currentDayData?.exercises.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Dumbbell size={220} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-100 border border-white/20">
              <Flame size={14} className="text-amber-300 animate-pulse" /> Ficha de Treino Semanal
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              {activeWorkout ? activeWorkout.title : 'Minha Rotina de Treino'}
            </h1>
            <p className="text-sm text-emerald-100 max-w-xl">
              {activeWorkout?.description ||
                'Organize seus exercícios por dia da semana, séries, repetições e cargas.'}
            </p>
          </div>

          {/* Routine Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {workouts.length > 1 && (
              <select
                value={activeWorkout?.id || ''}
                onChange={(e) => {
                  const selected = workouts.find((w) => w.id === Number(e.target.value));
                  if (selected) setActiveWorkout(selected);
                }}
                className="bg-slate-900/60 backdrop-blur-md text-white border border-white/20 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
              >
                {workouts.map((w) => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                    {w.title}
                  </option>
                ))}
              </select>
            )}

            {activeWorkout && (
              <button
                onClick={() => handleDeleteWorkout(activeWorkout.id)}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/40 border border-red-300/30 text-white rounded-xl transition text-xs flex items-center gap-1.5"
                title="Excluir este treino"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Workout Templates Selector (If no workout or wants to add) */}
      {(!activeWorkout || workouts.length === 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg">
            <Sparkles size={20} className="text-emerald-500" /> Escolha uma Ficha de Treino Pronta
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecione uma rotina semanal pré-configurada para começar imediatamente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {PRESET_ROUTINES.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => handleLoadPreset(preset)}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white text-base">
                    <span>{preset.title}</span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {preset.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {preset.days.slice(0, 4).map((d, dIdx) => (
                    <span
                      key={dIdx}
                      className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium"
                    >
                      {d.subtitle || d.day_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Weekly Days Navigator */}
      {activeWorkout && (
        <div className="space-y-6">
          {/* Days Tabs (Segunda a Domingo) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {activeWorkout.days.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              const dayExCount = day.exercises.length;
              const dayCompletedCount = day.exercises.filter((e) => e.completed).length;
              const isAllDone = dayExCount > 0 && dayCompletedCount === dayExCount;

              return (
                <button
                  key={day.id || idx}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-1 min-w-[120px] p-3 rounded-2xl transition-all border text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {day.day_name}
                    </span>

                    {isAllDone && (
                      <CheckCircle2
                        size={14}
                        className={isSelected ? 'text-emerald-200' : 'text-emerald-500'}
                      />
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-medium truncate mt-1 ${
                      isSelected
                        ? 'text-emerald-100'
                        : day.is_rest_day
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {day.is_rest_day
                      ? 'Descanso'
                      : day.subtitle
                      ? day.subtitle.replace(/Treino [A-Z] - /, '')
                      : `${dayExCount} exercícios`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Day Detail Panel */}
          {currentDayData && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Day Header & Progress Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {currentDayData.day_name}
                    </h2>

                    {currentDayData.is_rest_day && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                        Dia de Descanso / Cardio
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setDayTitleForm({
                          subtitle: currentDayData.subtitle || '',
                          is_rest_day: !!currentDayData.is_rest_day,
                        });
                        setIsDayEditOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Editar título do treino do dia"
                    >
                      <Edit3 size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    {currentDayData.subtitle || 'Personalize os exercícios deste dia'}
                  </p>
                </div>

                {/* Progress Ring & Actions */}
                <div className="flex items-center gap-4">
                  {totalCount > 0 && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <div className="text-right">
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">
                          {completedCount} de {totalCount} concluídos
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          Progresso de Hoje
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {progressPercent}%
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleResetDayProgress}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    title="Reiniciar checks de hoje"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <button
                    onClick={() => {
                      setEditingExercise(null);
                      setExerciseForm({
                        name: '',
                        sets: '4',
                        reps: '10-12',
                        weight: '',
                        notes: '',
                      });
                      setIsExerciseModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={16} /> Adicionar Exercício
                  </button>
                </div>
              </div>

              {/* Exercises List */}
              {currentDayData.exercises.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Dumbbell size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Nenhum exercício cadastrado para {currentDayData.day_name}.
                  </p>
                  <button
                    onClick={() => {
                      setEditingExercise(null);
                      setExerciseForm({
                        name: '',
                        sets: '4',
                        reps: '10-12',
                        weight: '',
                        notes: '',
                      });
                      setIsExerciseModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    <Plus size={14} /> Adicionar o primeiro exercício
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {currentDayData.exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id || exIdx}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        ex.completed
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 opacity-80'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {/* Left: Checkbox & Name */}
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          onClick={() => handleToggleExercise(ex.id)}
                          className="mt-0.5 sm:mt-0 text-emerald-600 dark:text-emerald-400 transition"
                        >
                          {ex.completed ? (
                            <CheckCircle2 size={22} className="fill-emerald-500 text-white" />
                          ) : (
                            <Circle size={22} className="text-slate-300 dark:text-slate-600 hover:text-emerald-500" />
                          )}
                        </button>

                        <div>
                          <h4
                            className={`text-base font-bold ${
                              ex.completed
                                ? 'line-through text-slate-500 dark:text-slate-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {ex.name}
                          </h4>

                          {ex.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Info size={12} className="text-emerald-500" /> {ex.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Sets, Reps, Weight & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                            {ex.sets} séries
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                            {ex.reps} reps
                          </span>
                          {ex.weight && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                              {ex.weight}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingExercise(ex);
                              setExerciseForm({
                                name: ex.name,
                                sets: ex.sets,
                                reps: ex.reps,
                                weight: ex.weight || '',
                                notes: ex.notes || '',
                              });
                              setIsExerciseModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Editar exercício"
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Excluir exercício"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EXERCISE MODAL (CREATE / EDIT) */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Dumbbell size={18} className="text-emerald-500" />
                {editingExercise ? 'Editar Exercício' : 'Novo Exercício'}
              </h3>

              <button
                onClick={() => setIsExerciseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Exercício *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Supino Reto com Barra, Leg Press 45°"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Séries
                  </label>
                  <input
                    type="text"
                    placeholder="4"
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Repetições
                  </label>
                  <input
                    type="text"
                    placeholder="10-12"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Carga (kg)
                  </label>
                  <input
                    type="text"
                    placeholder="25kg"
                    value={exerciseForm.weight}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Dicas de Execução
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manter cotovelos fechados, isometria de 1s"
                  value={exerciseForm.notes}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
                >
                  {editingExercise ? 'Salvar Alterações' : 'Adicionar Exercício'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DAY TITLE MODAL */}
      {isDayEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Editar Treino de {currentDayData?.day_name}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subtítulo do Treino (Grupo Muscular)
              </label>
              <input
                type="text"
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={dayTitleForm.subtitle}
                onChange={(e) => setDayTitleForm({ ...dayTitleForm, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={dayTitleForm.is_rest_day}
                onChange={(e) => setDayTitleForm({ ...dayTitleForm, is_rest_day: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Marcar como Dia de Descanso / Off
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsDayEditOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDayTitle}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
