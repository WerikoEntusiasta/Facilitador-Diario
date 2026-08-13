import React, { useState, useEffect } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface CurrentWeather {
  temperature_2m?: number;
  relative_humidity_2m?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  time?: string;
}

interface DailyWeather {
  time?: string[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
  precipitation_sum?: number[];
  wind_speed_10m_max?: number[];
  weather_code?: number[];
}

interface WeatherData {
  current?: CurrentWeather;
  daily?: DailyWeather;
  timezone?: string;
}

export const WeatherView: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-21.138&longitude=-48.977&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Sao_Paulo&forecast_days=7'
      );
      if (!response.ok) {
        throw new Error(`Erro na API Open-Meteo: ${response.statusText}`);
      }
      const data = await response.json();
      setWeatherData(data || {});
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Falha ao buscar dados meteorológicos:', err);
      setError('Não foi possível carregar a previsão do tempo no momento. Verifique sua conexão com a internet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherDescription = (code?: number): { text: string; icon: React.ReactNode; color: string } => {
    const c = code ?? 0;
    switch (c) {
      case 0:
        return { text: 'Céu limpo', icon: <Sun className="w-8 h-8 text-amber-500" />, color: 'bg-amber-500/10 text-amber-600 border-amber-200' };
      case 1:
      case 2:
        return { text: 'Parcialmente nublado', icon: <Cloud className="w-8 h-8 text-sky-500" />, color: 'bg-sky-500/10 text-sky-600 border-sky-200' };
      case 3:
        return { text: 'Nublado', icon: <Cloud className="w-8 h-8 text-slate-500" />, color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
      case 45:
      case 48:
        return { text: 'Nevoeiro', icon: <CloudFog className="w-8 h-8 text-indigo-400" />, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' };
      case 51:
      case 53:
      case 55:
      case 56:
      case 57:
        return { text: 'Garoa', icon: <CloudRain className="w-8 h-8 text-blue-400" />, color: 'bg-blue-500/10 text-blue-600 border-blue-200' };
      case 61:
      case 63:
      case 65:
      case 66:
      case 67:
        return { text: 'Chuva', icon: <CloudRain className="w-8 h-8 text-blue-600" />, color: 'bg-blue-600/10 text-blue-700 border-blue-300' };
      case 71:
      case 73:
      case 75:
      case 77:
        return { text: 'Neve', icon: <CloudSnow className="w-8 h-8 text-cyan-500" />, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' };
      case 80:
      case 81:
      case 82:
        return { text: 'Pancadas de chuva', icon: <CloudRain className="w-8 h-8 text-indigo-600" />, color: 'bg-indigo-600/10 text-indigo-700 border-indigo-300' };
      case 95:
      case 96:
      case 99:
        return { text: 'Tempestade', icon: <CloudLightning className="w-8 h-8 text-amber-600" />, color: 'bg-amber-600/10 text-amber-700 border-amber-300' };
      default:
        return { text: 'Condição variável', icon: <Sun className="w-8 h-8 text-slate-500" />, color: 'bg-slate-500/10 text-slate-600 border-slate-200' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-sky-100 border border-white/25">
            <MapPin className="w-3.5 h-3.5 text-sky-200" />
            Catanduva, SP • Lat: -21.138, Lon: -48.977
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Previsão do Tempo (Open-Meteo)</h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            Dados meteorológicos em tempo real e previsão de 7 dias atualizados diretamente via satélite para Catanduva e região.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 self-end md:self-center">
          {lastUpdated && (
            <span className="text-[11px] text-sky-200 hidden sm:inline">
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition border border-white/30 flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200 flex items-center gap-3 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={fetchWeather}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !weatherData?.current && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Carregando dados meteorológicos de Catanduva...</p>
        </div>
      )}

      {/* Weather Content */}
      {weatherData && weatherData.current && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Weather Card */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Agora em Catanduva</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">Ao Vivo</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                  {getWeatherDescription(weatherData?.current?.weather_code).icon}
                </div>
                <div>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {Math.round(weatherData?.current?.temperature_2m ?? 0)}°C
                  </div>
                  <div className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                    {getWeatherDescription(weatherData?.current?.weather_code).text}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Umidade</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{weatherData?.current?.relative_humidity_2m ?? 0}%</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Vento</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{weatherData?.current?.wind_speed_10m ?? 0} km/h</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2">
              <Thermometer className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Fuso horário: {weatherData?.timezone ?? 'America/Sao_Paulo'}</span>
            </div>
          </div>

          {/* 7-Day Forecast Grid */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Previsão para os Próximos 7 Dias
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Open-Meteo API</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weatherData?.daily?.time?.map((dateStr, index) => {
                const maxTemp = Math.round(weatherData?.daily?.temperature_2m_max?.[index] ?? 0);
                const minTemp = Math.round(weatherData?.daily?.temperature_2m_min?.[index] ?? 0);
                const pop = weatherData?.daily?.precipitation_probability_max?.[index] ?? 0;
                const weatherCode = weatherData?.daily?.weather_code?.[index] ?? 0;
                const desc = getWeatherDescription(weatherCode);
                const isToday = index === 0;

                return (
                  <div
                    key={dateStr || index}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isToday
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800">
                        {desc.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {formatDate(dateStr)}
                          {isToday && (
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-semibold">Hoje</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc.text}</div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-end">
                        <span className="text-indigo-600 dark:text-indigo-400">{maxTemp}°</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-slate-500 dark:text-slate-400">{minTemp}°</span>
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 justify-end">
                        💧 {pop}% ch.
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
