import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Bell, Clock, Sparkles } from 'lucide-react';
import { apiGetCalendarEvents } from '../../lib/api';
import { CalendarEvent, TaskItem } from '../../types';

export const CalendarRemindersWidget: React.FC = () => {
  const [widgetSize, setWidgetSize] = useState<'minimal' | 'normal' | 'detailed'>(() => {
    return (localStorage.getItem('kb_widget_calendar_size') as any) || 'normal';
  });

  const handleSizeChange = (size: 'minimal' | 'normal' | 'detailed') => {
    setWidgetSize(size);
    localStorage.setItem('kb_widget_calendar_size', size);
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayKey = new Date().toISOString().split('T')[0];

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    apiGetCalendarEvents().then((data) => {
      const all = [...(data.notes || []), ...(data.cards || [])];
      setEvents(all);
    }).catch(() => {});

    try {
      const savedTasks = localStorage.getItem('kb_tasks_list');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (e) {}
  }, []);

  const todayEvents = events.filter(e => e.date && e.date.startsWith(todayKey));
  const pendingTasks = tasks.filter(t => !t.completed);

  const combinedItems = [
    ...todayEvents.map(e => ({ id: e.id, title: e.title, time: e.time || 'Hoje', type: e.type === 'note' ? 'Nota' : 'Kanban' })),
    ...pendingTasks.map(t => ({ id: t.id, title: t.title, time: t.dueDate || 'Pendente', type: 'Tarefa' }))
  ];

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-purple-500/20 relative overflow-hidden">
      {/* Header & Size Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">Widget Calendário & Lembretes</h3>
            <p className="text-[11px] text-slate-400 capitalize">{todayStr}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[10px]">
          <button
            onClick={() => handleSizeChange('minimal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'minimal' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Mín
          </button>
          <button
            onClick={() => handleSizeChange('normal')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'normal' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Padrão
          </button>
          <button
            onClick={() => handleSizeChange('detailed')}
            className={`px-2 py-1 rounded-lg font-semibold transition ${widgetSize === 'detailed' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            Expandido
          </button>
        </div>
      </div>

      {/* MINIMAL SIZE */}
      {widgetSize === 'minimal' && (
        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
          <div>
            <span className="text-[10px] text-purple-300 uppercase font-bold">Hoje</span>
            <div className="text-sm font-bold">{combinedItems.length} itens (Eventos/Tarefas)</div>
          </div>
          <Bell className="w-4 h-4 text-purple-400 animate-bounce" />
        </div>
      )}

      {/* NORMAL SIZE */}
      {widgetSize === 'normal' && (
        <div className="space-y-2">
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {combinedItems.length > 0 ? (
              combinedItems.slice(0, 4).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl text-xs border border-white/5">
                  <div className="flex items-center gap-2 truncate">
                    <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">{item.time}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum evento ou tarefa para hoje.</p>
            )}
          </div>
        </div>
      )}

      {/* DETAILED SIZE */}
      {widgetSize === 'detailed' && (
        <div className="space-y-3">
          <p className="text-xs text-purple-200 font-semibold">Compromissos, Notas e Tarefas Reais:</p>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {combinedItems.length > 0 ? (
              combinedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl text-xs border border-white/10">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300 flex-shrink-0">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-400">Origem: {item.type}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded-lg flex-shrink-0">
                    {item.time}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Nenhum item agendado encontrado.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
