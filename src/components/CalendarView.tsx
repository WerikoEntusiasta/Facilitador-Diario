import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  Kanban,
  Download,
  Clock,
  X,
  FileText,
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { apiGetCalendarEvents } from '../lib/api';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<{ notes: CalendarEvent[]; cards: CalendarEvent[] }>({
    notes: [],
    cards: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiGetCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Group events by date YYYY-MM-DD
  const eventsByDate: Record<string, CalendarEvent[]> = {};

  [...events.notes, ...events.cards].forEach((evt) => {
    if (!evt.date) return;
    const dateKey = evt.date.split('T')[0];
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(evt);
  });

  const handleDayClick = (dayNum: number) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const dayEvts = eventsByDate[dateKey] || [];
    setSelectedDayEvents(dayEvts);
    setSelectedDateStr(`${dayStr}/${monthStr}/${year}`);
  };

  const handleDownloadIcs = () => {
    window.open('/api/calendar/ics', '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {monthNames[month]} de {year}
            </h2>
            <p className="text-xs text-slate-500">
              Lembretes de notas e prazos dos cartões Kanban
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              title="Mês Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition"
            >
              Hoje
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition"
              title="Próximo Mês"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleDownloadIcs}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center gap-2"
            title="Exportar para Google Agenda / Outlook (.ics)"
          >
            <Download size={16} />
            <span className="hidden md:inline">Sincronizar (.ics)</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Days of week */}
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="text-xs font-bold uppercase tracking-wider text-slate-400 py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-24 md:h-28 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-transparent"
            />
          ))}

          {/* Days of the month */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;

            const dayEvts = eventsByDate[dateKey] || [];
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`h-24 md:h-28 rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isToday
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 ring-2 ring-indigo-500/40'
                    : dayEvts.length > 0
                    ? 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 hover:border-indigo-400'
                    : 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-indigo-600 text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {dayEvts.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      {dayEvts.length}
                    </span>
                  )}
                </div>

                {/* Event previews inside calendar box */}
                <div className="space-y-1 overflow-hidden">
                  {dayEvts.slice(0, 2).map((evt, idx) => (
                    <div
                      key={idx}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 ${
                        evt.type === 'note'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200'
                          : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200'
                      }`}
                    >
                      {evt.type === 'note' ? <Bell size={10} /> : <Kanban size={10} />}
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] font-semibold text-slate-400 pl-1">
                      + {dayEvts.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Events Modal */}
      {selectedDayEvents !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Compromissos para {selectedDateStr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum lembrete ou prazo agendado para este dia.
                </div>
              ) : (
                selectedDayEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.type === 'note'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {evt.type === 'note' ? <Bell size={12} /> : <Kanban size={12} />}
                        {evt.type === 'note' ? 'Lembrete de Nota' : `Kanban: ${evt.board_title || 'Quadro'}`}
                      </span>

                      {evt.priority && (
                        <span className="text-[10px] font-bold text-slate-500">
                          Prioridade: {evt.priority}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {evt.title}
                    </h4>

                    {evt.content && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                        {evt.content}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
