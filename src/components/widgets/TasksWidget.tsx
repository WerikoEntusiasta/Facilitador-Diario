import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, CheckCircle2, Circle, Search } from 'lucide-react';
import { TaskItem } from '../../types';

export const TasksWidget: React.FC = () => {
  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('kb_widget_tasks_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('kb_widget_tasks_size', size);
  };

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('kb_tasks_list');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('kb_tasks_list', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask: TaskItem = {
      id: String(Date.now()),
      title: newTitle.trim(),
      completed: false,
      priority: 'Média',
      category: 'Geral',
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
    setNewTitle('');
  };

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Header & Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Widget de Tarefas</h3>
            <p className="text-[11px] text-slate-400">{pendingCount} pendentes</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px]">
          <button
            onClick={() => handleSizeChange('minimal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'minimal' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mín
          </button>
          <button
            onClick={() => handleSizeChange('normal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'normal' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Padrão
          </button>
          <button
            onClick={() => handleSizeChange('detailed')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'detailed' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Expandido
          </button>
        </div>
      </div>

      {/* MINIMAL SIZE */}
      {widgetSize === 'minimal' && (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-amber-300 uppercase font-bold">Tarefas</span>
            <div className="text-lg font-black">{pendingCount} restantes</div>
          </div>
          <span className="text-[11px] text-slate-400">{tasks.length} total</span>
        </div>
      )}

      {/* NORMAL SIZE */}
      {widgetSize === 'normal' && (
        <div className="space-y-3">
          <form onSubmit={addTask} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Adicionar tarefa rápida..."
              className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button type="submit" className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {tasks.length > 0 ? (
              tasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 p-2 rounded-xl text-xs">
                  <button onClick={() => toggleTask(t.id)} className="flex items-center gap-2 truncate">
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <span className={`truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</span>
                  </button>
                  <span className="text-[10px] text-amber-300 font-mono">{t.priority}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">Nenhuma tarefa cadastrada.</p>
            )}
          </div>
        </div>
      )}

      {/* DETAILED SIZE */}
      {widgetSize === 'detailed' && (
        <div className="space-y-3">
          <form onSubmit={addTask} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nova tarefa detalhada..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </form>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {tasks.length > 0 ? (
              tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl text-xs border border-white/5">
                  <button onClick={() => toggleTask(t.id)} className="flex items-center gap-2.5 truncate">
                    {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    <div className="text-left truncate">
                      <p className={`font-semibold truncate ${t.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{t.title}</p>
                      <span className="text-[10px] text-slate-400">{t.category} • Vencimento: {t.dueDate || 'Sem prazo'}</span>
                    </div>
                  </button>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.priority === 'Urgente' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {t.priority}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Nenhuma tarefa encontrada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
