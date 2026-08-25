import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Filter,
  Search,
  AlertCircle,
  Clock,
  Sparkles,
  Pencil,
  AlignLeft,
  Tag,
  X,
  Check,
} from 'lucide-react';
import { TaskItem, Priority } from '../types';

const STORAGE_KEY = 'kb_tasks_list';

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: '1',
    title: 'Completar rotina de jejum intermitente',
    description: 'Manter a hidratação constante com água, chá sem açúcar e eletrólitos.',
    completed: false,
    priority: 'Alta',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Saúde',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Treinar membros superiores (Peito/Tríceps)',
    description: 'Aquecer bem os manguitos e manter descanso de 90s entre séries pesadas.',
    completed: true,
    priority: 'Média',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Academia',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Organizar notas e relatórios semanais',
    description: 'Revisar anotações rápidas e categorizar os projetos no Kanban.',
    completed: false,
    priority: 'Baixa',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'Trabalho',
    createdAt: new Date().toISOString(),
  },
];

const CATEGORY_SUGGESTIONS = ['Geral', 'Trabalho', 'Saúde', 'Academia', 'Estudos', 'Pessoal', 'Finanças'];

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_TASKS;
    } catch (e) {
      return DEFAULT_TASKS;
    }
  });

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('Média');
  const [taskCategory, setTaskCategory] = useState('Geral');
  const [taskDueDate, setTaskDueDate] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new CustomEvent('kb_tasks_updated', { detail: tasks }));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    const handleSync = (e: any) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setTasks(parsed);
        }
      } catch (err) {}
    };
    window.addEventListener('storage', handleSync);
    return () => window.removeEventListener('storage', handleSync);
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('Média');
    setTaskCategory('Geral');
    setTaskDueDate('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskCategory(task.category || 'Geral');
    setTaskDueDate(task.dueDate || '');
    setIsModalOpen(true);
  };

  const handleToggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    if (editingTaskId === id) {
      setIsModalOpen(false);
    }
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTaskId) {
      // Update existing task
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTaskId
            ? {
                ...t,
                title: taskTitle.trim(),
                description: taskDescription.trim() || undefined,
                priority: taskPriority,
                category: taskCategory.trim() || 'Geral',
                dueDate: taskDueDate || undefined,
              }
            : t
        )
      );
    } else {
      // Create new task
      const newTask: TaskItem = {
        id: String(Date.now()),
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        completed: false,
        priority: taskPriority,
        category: taskCategory.trim() || 'Geral',
        dueDate: taskDueDate || undefined,
        createdAt: new Date().toISOString(),
      };
      setTasks([newTask, ...tasks]);
    }

    setIsModalOpen(false);
  };

  const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek' | 'clear') => {
    if (type === 'clear') {
      setTaskDueDate('');
      return;
    }
    const d = new Date();
    if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    } else if (type === 'nextWeek') {
      d.setDate(d.getDate() + 7);
    }
    setTaskDueDate(d.toISOString().split('T')[0]);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.completed) return false;
    if (filter === 'completed' && !t.completed) return false;
    if (filter === 'urgent' && t.priority !== 'Urgente' && t.priority !== 'Alta') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchCategory = t.category && t.category.toLowerCase().includes(q);
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      return matchTitle || matchCategory || matchDesc;
    }
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>Gerenciador de Tarefas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Suas Tarefas & Metas</h1>
          <p className="text-xs text-slate-300 mt-1">Organize seu dia, acompanhe pendências e mantenha o foco.</p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 w-full md:w-auto justify-between">
          <div>
            <span className="text-[11px] text-slate-300 uppercase font-semibold block">Progresso do Dia</span>
            <span className="text-xl font-black font-mono">
              {completedCount} de {tasks.length} concluídas
            </span>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-slate-800" fill="transparent" />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
                className="text-emerald-400"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-emerald-200">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, descrição ou categoria..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendentes' },
            { id: 'completed', label: 'Concluídas' },
            { id: 'urgent', label: 'Urgentes / Alta' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filter === f.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const priorityColor =
              task.priority === 'Urgente'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : task.priority === 'Alta'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : task.priority === 'Média'
                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                : 'bg-slate-500/10 text-slate-500 border-slate-500/20';

            return (
              <div
                key={task.id}
                className={`group bg-white dark:bg-slate-900 p-4 rounded-2xl border transition flex items-start justify-between gap-3 shadow-xs hover:shadow-md ${
                  task.completed
                    ? 'opacity-60 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                {/* Left checkbox & details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTask(task.id);
                    }}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex-shrink-0 mt-0.5"
                    title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div
                    onClick={() => handleOpenEditModal(task)}
                    className="min-w-0 flex-1 space-y-1 cursor-pointer"
                    title="Clique para editar esta tarefa"
                  >
                    <p
                      className={`text-xs sm:text-sm font-semibold break-words hover:text-indigo-600 dark:hover:text-indigo-400 transition ${
                        task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Task Description */}
                    {task.description && (
                      <p
                        className={`text-xs whitespace-pre-line break-words leading-relaxed ${
                          task.completed ? 'line-through text-slate-400/80 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Tags & Metadata */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-medium">
                        {task.category || 'Geral'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${priorityColor}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" /> {task.dueDate}
                        </span>
                      )}
                      <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                        <Pencil className="w-2.5 h-2.5" /> Editar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition flex items-center gap-1 text-xs font-semibold"
                    title="Editar tarefa"
                  >
                    <Pencil className="w-4 h-4 text-indigo-500" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma tarefa encontrada</h3>
            <p className="text-xs text-slate-400 mt-1">Crie uma nova tarefa para começar a organizar seu dia.</p>
          </div>
        )}
      </div>

      {/* Task Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {editingTaskId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold">
                  {editingTaskId ? 'Editar Tarefa' : 'Criar Nova Tarefa'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Tarefa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Reunião de planejamento com equipe..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                  Descrição detalhada (opcional)
                </label>
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Adicione detalhes, notas de apoio, links ou checklist desta tarefa..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              {/* Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    Prioridade
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Baixa">🟢 Baixa</option>
                    <option value="Média">🔵 Média</option>
                    <option value="Alta">🟡 Alta</option>
                    <option value="Urgente">🔴 Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    placeholder="Ex: Trabalho, Saúde, Estudos..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Category Quick Suggestions */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTaskCategory(cat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                          taskCategory === cat
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-semibold'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due Date & Quick Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    Data de Vencimento
                  </label>
                  {taskDueDate && (
                    <button
                      type="button"
                      onClick={() => setQuickDate('clear')}
                      className="text-[10px] text-red-500 hover:underline"
                    >
                      Limpar data
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate('today')}
                    className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('tomorrow')}
                    className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('nextWeek')}
                    className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Em 7 dias
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {editingTaskId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTaskId)}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {editingTaskId ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
