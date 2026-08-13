import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Dumbbell,
  Sun,
  CheckSquare,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  RefreshCw,
  Pin,
  PinOff,
  Plus,
  Play,
  Square,
  Droplets,
  Calendar,
  CloudRain,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  Newspaper,
  ExternalLink,
} from 'lucide-react';
import { Note, FastingSession, TaskItem } from '../types';

interface UserDashboardViewProps {
  notes: Note[];
  activeFastingSession: FastingSession | null;
  setCurrentTab: (tab: any) => void;
  onOpenNewNote?: () => void;
  onEditNote?: (note: Note) => void;
  onTogglePin?: (id: number) => void;
  onStartFasting?: (targetHours: number, protocolName?: string) => void;
  onEndFasting?: () => void;
  onCancelFasting?: () => void;
  onAddWater?: (ml: number) => void;
}

interface WeatherDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
}

interface WeatherSummary {
  temperature?: number;
  weather_code?: number;
  relative_humidity_2m?: number;
  wind_speed_10m?: number;
  daily?: WeatherDaily;
}

interface FitnessNewsItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
  source?: string;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  notes,
  activeFastingSession,
  setCurrentTab,
  onOpenNewNote,
  onEditNote,
  onTogglePin,
  onStartFasting,
  onEndFasting,
  onCancelFasting,
  onAddWater,
}) => {
  const [latestPdf, setLatestPdf] = useState<{ id: string; name: string; date?: string } | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [selectedProtocolHours, setSelectedProtocolHours] = useState(16);

  // Fitness News State
  const [fitnessNews, setFitnessNews] = useState<FitnessNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // Calendar state & Holidays API
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Array<{ date: string; name: string; type: string }>>([
    { date: '2026-01-01', name: 'Confraternização Universal', type: 'national' },
    { date: '2026-02-17', name: 'Carnaval', type: 'national' },
    { date: '2026-04-03', name: 'Paixão de Cristo', type: 'national' },
    { date: '2026-04-21', name: 'Tiradentes', type: 'national' },
    { date: '2026-05-01', name: 'Dia do Trabalho', type: 'national' },
    { date: '2026-06-04', name: 'Corpus Christi', type: 'national' },
    { date: '2026-09-07', name: 'Independência do Brasil', type: 'national' },
    { date: '2026-10-12', name: 'Nossa Sra. Aparecida', type: 'national' },
    { date: '2026-11-02', name: 'Finados', type: 'national' },
    { date: '2026-11-15', name: 'Proclamação da República', type: 'national' },
    { date: '2026-11-20', name: 'Consciência Negra', type: 'national' },
    { date: '2026-12-25', name: 'Natal', type: 'national' },
  ]);

  useEffect(() => {
    const yr = calendarDate.getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${yr}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHolidays(data);
        }
      })
      .catch(() => {});
  }, [calendarDate]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const holidaysMap: Record<string, string> = {};
  holidays.forEach(h => {
    holidaysMap[h.date] = h.name;
  });

  // Get pinned notes (max 3)
  const pinnedNotes = notes ? notes.filter((n) => n.is_pinned).slice(0, 3) : [];
  
  // Get latest created note
  const latestNote = notes && notes.length > 0 
    ? [...notes].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]
    : null;

  // Fetch latest PDF from API/localStorage if available
  useEffect(() => {
    try {
      const serverUrl = (window as any).__KB_SERVER_URL__ || localStorage.getItem('kb_server_url');
      const token = localStorage.getItem('kb_auth_token');
      if (serverUrl && token) {
        fetch(`${serverUrl}/api/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data) && data.length > 0) {
              const sorted = [...data].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
              setLatestPdf(sorted[0]);
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Fetch weather for today + 7 days (auto-updating every 5 minutes)
  useEffect(() => {
    const fetchWeather = () => {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=-21.138&longitude=-48.977&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Sao_Paulo')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setWeather({
              temperature: data.current?.temperature_2m,
              weather_code: data.current?.weather_code,
              relative_humidity_2m: data.current?.relative_humidity_2m,
              wind_speed_10m: data.current?.wind_speed_10m,
              daily: data.daily,
            });
          }
        })
        .catch(() => {})
        .finally(() => setWeatherLoading(false));
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Fetch fitness news via Google News RSS -> rss2json
  useEffect(() => {
    const rssUrl = 'https://news.google.com/rss/search?q=fitness+musculação&hl=pt-BR&gl=BR&ceid=BR:pt-419';
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'ok' && Array.isArray(data.items)) {
          setFitnessNews(data.items.slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, []);

  const getWeatherText = (code?: number) => {
    const c = code ?? 0;
    if (c === 0) return 'Céu limpo ☀️';
    if (c <= 2) return 'Parcialmente nublado 🌤️';
    if (c === 3) return 'Nublado ☁️';
    if (c >= 51 && c <= 67) return 'Chuva 🌧️';
    if (c >= 95) return 'Tempestade ⚡';
    return 'Bom tempo 🌤️';
  };

  // Default tasks for today if none in storage
  const todayTasks: TaskItem[] = [
    { id: '1', title: 'Completar rotina de jejum intermitente', completed: false, priority: 'Alta', createdAt: new Date().toISOString() },
    { id: '2', title: 'Treinar membros superiores na academia', completed: true, priority: 'Média', createdAt: new Date().toISOString() },
    { id: '3', title: 'Revisar notas e relatórios semanais', completed: false, priority: 'Baixa', createdAt: new Date().toISOString() },
  ];

  // Fasting elapsed time calculation
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!activeFastingSession) return;
    const calculateElapsed = () => {
      const start = new Date(activeFastingSession.start_time).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diff);
    };
    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeFastingSession]);

  const formatElapsedTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const targetSecs = (activeFastingSession?.target_hours || 16) * 3600;
  const fastingProgress = Math.min(100, Math.round((elapsedSeconds / targetSecs) * 100));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in pb-16">
      
      {/* Top Executive Header / Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Notas</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{notes?.length || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tarefas Pendentes</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">2 Pendentes</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Jejum</div>
            <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5">
              {activeFastingSession ? 'Ativo ⚡' : 'Inativo'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clima Catanduva</div>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
              {weather ? `${Math.round(weather.temperature_2m ?? 0)}°C` : '26°C'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600">
            <Sun className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-indigo-400/30">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Sistema Operacional KeepBoard • Status: Sincronizado
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Painel de Controle Executivo</h1>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
            Bem-vindo ao seu ambiente integrado. Monitore notas fixadas, clima de 7 dias com precisão Open-Meteo, treinos, tarefas e jejum em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => setCurrentTab('weather')}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-xs transition border border-white/20 flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span>Central Meteorológica</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Notas & Fixadas (Card Amplo) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notas Fixadas ({pinnedNotes.length}/3)</span>
            </div>
            <button
              onClick={() => onOpenNewNote && onOpenNewNote()}
              className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 transition flex items-center gap-1 text-xs font-bold px-3 cursor-pointer"
              title="Nova Nota"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Nota
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 ? (
              <div className="space-y-2">
                {pinnedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onEditNote && onEditNote(note)}
                    className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-600 shrink-0" />
                        {note.title || 'Sem título'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {note.content || 'Sem conteúdo'}
                      </div>
                    </div>
                    {onTogglePin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePin(note.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-200/50 text-amber-600 transition"
                        title="Desafixar nota"
                      >
                        <PinOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-400 space-y-1">
                <p>Nenhuma nota fixada no momento.</p>
                <p className="text-[11px]">Fixe até 3 notas importantes para acesso rápido no dashboard.</p>
              </div>
            )}

            {/* Latest Created Note Summary */}
            {latestNote && !pinnedNotes.some(n => n.id === latestNote.id) && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Última Nota Criada</div>
                <div
                  onClick={() => onEditNote && onEditNote(latestNote)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 transition cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{latestNote.title || 'Sem título'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{latestNote.content || 'Sem conteúdo'}</div>
                  </div>
                  {onTogglePin && pinnedNotes.length < 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(latestNote.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-amber-600 transition"
                      title="Fixar nota"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div 
            onClick={() => setCurrentTab('notes')}
            className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between cursor-pointer hover:underline"
          >
            <span>Central de Notas Keep</span>
            <span>Ver Todas ({notes?.length || 0}) →</span>
          </div>
        </div>

        {/* 2. Previsão do Tempo 7 Dias Completa no Dashboard */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-500/20">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Previsão do Tempo • 7 Dias (Catanduva, SP)</span>
                <div className="text-[11px] text-slate-400">Dados meteorológicos em tempo real (Open-Meteo)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Catanduva
              </span>
            </div>
          </div>

          {/* 7 Days Horizontal / Grid Forecast */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {weather?.daily ? (
              weather.daily.time.slice(0, 7).map((dateStr, idx) => {
                const d = new Date(dateStr);
                const formattedDate = idx === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
                const maxT = Math.round(weather.daily!.temperature_2m_max[idx]);
                const minT = Math.round(weather.daily!.temperature_2m_min[idx]);
                const code = weather.daily!.weather_code[idx];
                const rainProb = weather.daily!.precipitation_probability_max?.[idx] ?? 0;
                return (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-between space-y-2 text-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{formattedDate}</span>
                    <span className="text-xl my-0.5">{getWeatherText(code).split(' ')[1] || '🌤️'}</span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {maxT}° <span className="text-[10px] text-slate-400 font-normal">/ {minT}°</span>
                    </div>
                    <div className="text-[10px] text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                      <CloudRain className="w-3 h-3" /> {rainProb}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-xs text-slate-400">Carregando previsão de 7 dias...</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400 font-semibold cursor-pointer hover:underline" onClick={() => setCurrentTab('weather')}>
            <span>Abrir Painel Meteorológico Detalhado</span>
            <span>Ver Mais →</span>
          </div>
        </div>

        {/* 3. Treino do Dia */}
        <div 
          onClick={() => setCurrentTab('workouts')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Treino do Dia</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </div>

          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hipertrofia - Membros Superiores (Peito & Tríceps)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Supino Reto, Supino Inclinado com Halteres, Crucifixo e Tríceps testa. 4 séries x 12 repetições.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
            <span>Rotina Ativa</span>
            <span>Iniciar Treino →</span>
          </div>
        </div>

        {/* 4. Tarefas do Dia */}
        <div 
          onClick={() => setCurrentTab('tasks')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tarefas Prioritárias</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
          </div>

          <div className="space-y-2 flex-1">
            {todayTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <input type="checkbox" checked={t.completed} readOnly className="rounded border-slate-300 text-indigo-600 w-3.5 h-3.5" />
                <span className={t.completed ? 'line-through text-slate-400 font-normal' : 'font-semibold'}>{t.title}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-between">
            <span>Menu Tarefas</span>
            <span>Gerenciar Tarefas →</span>
          </div>
        </div>

        {/* 5. Gestão Mínima de Jejum Intermitente */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jejum Intermitente</span>
            </div>
            <button
              onClick={() => setCurrentTab('fasting')}
              className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              Painel Completo →
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {activeFastingSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Jejum Ativo ({activeFastingSession.target_hours}h)
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono bg-orange-500/10 px-2 py-0.5 rounded-lg text-orange-600">
                    {formatElapsedTime(elapsedSeconds)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Progresso</span>
                    <span>{fastingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500" style={{ width: `${fastingProgress}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {onAddWater && (
                    <button
                      onClick={() => onAddWater(250)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 hover:bg-sky-100 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer border border-sky-200 dark:border-sky-900/40"
                    >
                      <Droplets className="w-3.5 h-3.5" /> +250ml Água
                    </button>
                  )}
                  {onEndFasting && (
                    <button
                      onClick={onEndFasting}
                      className="py-1.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer border border-emerald-200 dark:border-emerald-900/40"
                    >
                      Concluir
                    </button>
                  )}
                  {onCancelFasting && (
                    <button
                      onClick={onCancelFasting}
                      className="py-1.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-xs transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                      title="Cancelar"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Inicie seu protocolo de jejum com 1 clique:
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: '16:8', hours: 16 },
                    { label: '18:6', hours: 18 },
                    { label: '20:4', hours: 20 },
                    { label: '24h', hours: 24 },
                  ].map((p) => (
                    <button
                      key={p.hours}
                      onClick={() => setSelectedProtocolHours(p.hours)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        selectedProtocolHours === p.hours
                          ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {onStartFasting && (
                  <button
                    onClick={() => onStartFasting(selectedProtocolHours, `${selectedProtocolHours}:${24 - selectedProtocolHours}`)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Iniciar Jejum de {selectedProtocolHours}h
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-orange-600 dark:text-orange-400 font-semibold flex items-center justify-between">
            <span>KeepFlow Fasting Engine</span>
            <span className="cursor-pointer hover:underline" onClick={() => setCurrentTab('fasting')}>Ver Histórico →</span>
          </div>
        </div>

        {/* 6. Notícias Fitness & Saúde */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <Newspaper className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notícias Fitness & Saúde</span>
                <div className="text-[11px] text-slate-400">Atualizações de Saúde & Musculação</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Ao Vivo
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {newsLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : fitnessNews.length > 0 ? (
              <div className="space-y-2.5">
                {fitnessNews.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 hover:border-emerald-500/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition group"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.pubDate && (
                        <span className="text-[10px] font-medium text-slate-400 block">
                          {new Date(item.pubDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">
                Nenhuma notícia disponível no momento.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
            <span>Feed Fitness</span>
            <span>Ver Mais Atualizações →</span>
          </div>
        </div>

        {/* 6. Calendário & Feriados Nacionais (BrasilAPI) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Calendário & Feriados Nacionais (Brasil)</span>
                <div className="text-[11px] text-slate-400">Sincronizado com a API Oficial do Brasil</div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button onClick={prevMonth} className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition" title="Mês Anterior">
                ‹
              </button>
              <span className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200">
                {monthNames[month]} {year}
              </span>
              <button onClick={nextMonth} className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition" title="Próximo Mês">
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((d) => (
              <div key={d} className="text-[10px] font-bold uppercase text-slate-400 py-1">{d}</div>
            ))}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mStr = String(month + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const dateKey = `${year}-${mStr}-${dStr}`;
              const holidayName = holidaysMap[dateKey];
              const isToday = new Date().toDateString() === new Date(year, month, dayNum).toDateString();

              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded-2xl flex flex-col items-center justify-center relative min-h-[44px] transition ${
                    isToday ? 'bg-indigo-600 text-white font-black shadow-sm' :
                    holidayName ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                    'bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title={holidayName || `Dia ${dayNum}`}
                >
                  <span className="text-xs font-bold">{dayNum}</span>
                  {holidayName && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1" title={holidayName} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Feriados e Datas deste Mês:</div>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {holidays.filter(h => {
                const parts = h.date.split('-');
                return Number(parts[0]) === year && Number(parts[1]) === month + 1;
              }).length > 0 ? (
                holidays.filter(h => {
                  const parts = h.date.split('-');
                  return Number(parts[0]) === year && Number(parts[1]) === month + 1;
                }).map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200">
                    <span className="font-semibold">{h.name}</span>
                    <span className="text-[10px] font-bold opacity-75">{h.date.split('-').reverse().join('/')}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic py-1">Nenhum feriado nacional registrado neste mês.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

