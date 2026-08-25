import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  Square,
  RotateCcw,
  Compass,
  Footprints,
  Flame,
  Clock,
  Navigation,
  MapPin,
  Sparkles,
  Award,
  Calendar,
  Trash2,
  ChevronRight,
  TrendingUp,
  Zap,
  Radio,
  Eye,
  X,
  AlertTriangle,
  RefreshCw,
  Layers,
  Smartphone,
} from 'lucide-react';
import { GpsActivityRecord, GpsCoordinate } from '../types';
import {
  apiGetGpsActivities,
  apiSaveGpsActivity,
  apiDeleteGpsActivity,
} from '../lib/api';

// Calculation of Distance between two Lat/Lng coordinates (Haversine formula in KM)
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ACTIVITY_MET_FACTORS: Record<string, { label: string; icon: string; kcalPerKm: number; baseSpeedKmh: number }> = {
  caminhada: { label: 'Caminhada', icon: '🚶', kcalPerKm: 55, baseSpeedKmh: 4.8 },
  corrida: { label: 'Corrida', icon: '🏃', kcalPerKm: 75, baseSpeedKmh: 9.5 },
  ciclismo: { label: 'Ciclismo', icon: '🚴', kcalPerKm: 35, baseSpeedKmh: 18.0 },
  treino_livre: { label: 'Treino Livre', icon: '⚡', kcalPerKm: 60, baseSpeedKmh: 6.0 },
};

export const TelemetryGpsView: React.FC<{
  onOpenAndroidApp?: () => void;
}> = ({ onOpenAndroidApp }) => {
  // Activity Session State
  const [activityType, setActivityType] = useState<'caminhada' | 'corrida' | 'ciclismo' | 'treino_livre'>('caminhada');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live Telemetry Metrics
  const [currentCoords, setCurrentCoords] = useState<GpsCoordinate | null>(null);
  const [routePoints, setRoutePoints] = useState<GpsCoordinate[]>([]);
  const [totalDistanceKm, setTotalDistanceKm] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState(0);
  const [estimatedSteps, setEstimatedSteps] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Simulation Mode for Desktop Testing
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef<any>(null);

  // Stored Past Activities
  const [savedActivities, setSavedActivities] = useState<GpsActivityRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<GpsActivityRecord | null>(null);

  // Leaflet Map References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const startMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Load Saved Activities from Server
  const loadActivities = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiGetGpsActivities();
      if (Array.isArray(data)) {
        setSavedActivities(data);
        // Also update local storage for dashboard card sync
        const summary = data.map((a) => ({
          id: a.id,
          date: a.date,
          totalSteps: a.total_steps,
          totalCalories: a.total_calories,
          totalDistanceKm: a.total_distance_km,
          durationSeconds: a.duration_seconds,
          label: a.title,
        }));
        localStorage.setItem('kb_saved_activities_list', JSON.stringify(summary));
        window.dispatchEvent(new Event('kb_activity_saved'));
      }
    } catch (err) {
      console.error('Erro ao carregar atividades GPS:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Calories & Pace Calculation
  const burnedCalories = useMemo(() => {
    const factor = ACTIVITY_MET_FACTORS[activityType]?.kcalPerKm || 60;
    return Math.round(totalDistanceKm * factor);
  }, [totalDistanceKm, activityType]);

  const avgSpeedKmh = useMemo(() => {
    if (elapsedSeconds <= 0) return 0;
    const hours = elapsedSeconds / 3600;
    return Number((totalDistanceKm / hours).toFixed(1));
  }, [totalDistanceKm, elapsedSeconds]);

  const avgPaceMinKm = useMemo(() => {
    if (totalDistanceKm <= 0.05 || elapsedSeconds <= 0) return '0:00';
    const totalMinutes = elapsedSeconds / 60;
    const paceMinutes = totalMinutes / totalDistanceKm;
    const mins = Math.floor(paceMinutes);
    const secs = Math.round((paceMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [totalDistanceKm, elapsedSeconds]);

  // Leaflet Map Initialization
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      try {
        const L = await import('leaflet');
        // Inject Leaflet CSS if not already present
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!isMounted || !mapContainerRef.current) return;

        // Default initial center (or current GPS if available)
        const initialLat = currentCoords?.latitude || -23.55052;
        const initialLng = currentCoords?.longitude || -46.633308;

        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        mapInstanceRef.current = map;

        // Create Route Polyline
        polylineRef.current = L.polyline([], {
          color: '#10b981',
          weight: 6,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);
      } catch (err) {
        console.error('Erro ao inicializar mapa Leaflet:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Polyline & Markers on New Coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !currentCoords) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const latLng: [number, number] = [currentCoords.latitude, currentCoords.longitude];

      // Update or create start marker
      if (routePoints.length === 1 && !startMarkerRef.current) {
        const startIcon = L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="background-color:#10b981; color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">🏁</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        startMarkerRef.current = L.marker(latLng, { icon: startIcon }).addTo(map);
      }

      // Update or create current position marker
      if (!currentMarkerRef.current) {
        const currentIcon = L.divIcon({
          className: 'custom-current-marker',
          html: `<div style="background-color:#06b6d4; border:3px solid white; border-radius:50%; width:20px; height:20px; box-shadow:0 0 12px #06b6d4;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        currentMarkerRef.current = L.marker(latLng, { icon: currentIcon }).addTo(map);
      } else {
        currentMarkerRef.current.setLatLng(latLng);
      }

      // Update polyline points
      if (polylineRef.current) {
        const latLngs = routePoints.map((p) => [p.latitude, p.longitude] as [number, number]);
        polylineRef.current.setLatLngs(latLngs);
      }

      // Pan to current position smoothly
      map.panTo(latLng);
    });
  }, [currentCoords, routePoints]);

  // Handle incoming GPS Point
  const handleNewGpsPoint = (newCoord: GpsCoordinate) => {
    setCurrentCoords(newCoord);
    setGpsAccuracy(newCoord.accuracy || 10);
    setGpsError(null);

    if (newCoord.speed && newCoord.speed > 0) {
      const speedKmh = Number((newCoord.speed * 3.6).toFixed(1));
      setCurrentSpeedKmh(speedKmh);
      setMaxSpeedKmh((prev) => Math.max(prev, speedKmh));
    }

    setRoutePoints((prev) => {
      if (prev.length === 0) {
        return [newCoord];
      }

      const lastPoint = prev[prev.length - 1];
      const deltaKm = calculateHaversineDistance(
        lastPoint.latitude,
        lastPoint.longitude,
        newCoord.latitude,
        newCoord.longitude
      );

      // Only count point if moved at least 2 meters
      if (deltaKm >= 0.002) {
        setTotalDistanceKm((d) => Number((d + deltaKm).toFixed(3)));
        // Estimate steps ~1300 steps per km for walking/running
        const addedSteps = Math.round(deltaKm * 1320);
        setEstimatedSteps((s) => s + addedSteps);
        return [...prev, newCoord];
      }

      return prev;
    });
  };

  // Start Real GPS Recording
  const startGpsWatch = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada neste navegador/aparelho.');
      return;
    }

    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: GpsCoordinate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp,
        };
        handleNewGpsPoint(coord);
      },
      (err) => {
        console.warn('Erro GPS:', err.message);
        setGpsError(`Aviso de GPS: ${err.message}. Você pode usar o "Modo Simulação" para testar.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  };

  const stopGpsWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Start Simulation (for Testing inside or on PC)
  const startSimulation = () => {
    setIsSimulating(true);
    let simLat = currentCoords?.latitude || -23.55052;
    let simLng = currentCoords?.longitude || -46.633308;
    let heading = Math.random() * Math.PI * 2;

    simulationIntervalRef.current = setInterval(() => {
      // Simulate walking ~5 km/h -> ~1.4 meters per second
      heading += (Math.random() - 0.5) * 0.4; // slight turns
      const stepDistanceMeters = 3.5 + Math.random() * 2.0;
      const dLat = (stepDistanceMeters / 111139) * Math.cos(heading);
      const dLng = (stepDistanceMeters / (111139 * Math.cos((simLat * Math.PI) / 180))) * Math.sin(heading);

      simLat += dLat;
      simLng += dLng;

      const simSpeed = (stepDistanceMeters / 1) * 3.6; // km/h

      handleNewGpsPoint({
        latitude: simLat,
        longitude: simLng,
        speed: simSpeed / 3.6,
        accuracy: 4,
        timestamp: Date.now(),
      });
    }, 1000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  // Recording Controls
  const handleStartActivity = (simulate = false) => {
    setIsRecording(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setTotalDistanceKm(0);
    setCurrentSpeedKmh(0);
    setMaxSpeedKmh(0);
    setEstimatedSteps(0);
    setRoutePoints([]);

    if (simulate) {
      startSimulation();
    } else {
      startGpsWatch();
    }
  };

  const handlePauseActivity = () => {
    setIsPaused(true);
    stopGpsWatch();
    stopSimulation();
  };

  const handleResumeActivity = () => {
    setIsPaused(false);
    if (isSimulating) {
      startSimulation();
    } else {
      startGpsWatch();
    }
  };

  const handleFinishAndSave = async () => {
    stopGpsWatch();
    stopSimulation();
    setIsRecording(false);
    setIsPaused(false);

    if (totalDistanceKm <= 0.01 && elapsedSeconds < 5) {
      alert('Atividade muito curta para ser salva.');
      return;
    }

    const activityTitle = `${ACTIVITY_MET_FACTORS[activityType]?.label || 'Atividade'} (${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`;

    const newActivity: Partial<GpsActivityRecord> = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      activity_type: activityType,
      title: activityTitle,
      date: new Date().toISOString(),
      total_steps: estimatedSteps,
      total_calories: burnedCalories,
      total_distance_km: totalDistanceKm,
      duration_seconds: elapsedSeconds,
      avg_speed_kmh: avgSpeedKmh,
      max_speed_kmh: maxSpeedKmh,
      avg_pace_min_km: Number(avgPaceMinKm.replace(':', '.')) || 0,
      route_points: routePoints,
      notes: isSimulating ? 'Percurso realizado em Modo Simulação / Teste' : 'Gravado via GPS nativo',
    };

    try {
      await apiSaveGpsActivity(newActivity);
      await loadActivities();
      alert('🎉 Atividade GPS salva com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar atividade: ${err.message}`);
    }
  };

  const handleDiscardActivity = () => {
    if (window.confirm('Deseja realmente descartar este percurso atual?')) {
      stopGpsWatch();
      stopSimulation();
      setIsRecording(false);
      setIsPaused(false);
      setElapsedSeconds(0);
      setTotalDistanceKm(0);
      setRoutePoints([]);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (window.confirm('Excluir esta atividade gravada?')) {
      try {
        await apiDeleteGpsActivity(id);
        await loadActivities();
      } catch (err: any) {
        alert(`Erro ao excluir: ${err.message}`);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fadeIn">
      {/* TEST / BETA NOTICE BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-slate-950 shadow-lg border border-amber-300 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-black/80 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                🧪 Módulo em Fase de Testes
              </span>
              <span className="text-xs font-bold text-amber-950">
                Versão Web & Módulo APK Android
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950">
              Telemetria & Rastreamento GPS ao Vivo
            </h2>
            <p className="text-xs md:text-sm text-amber-950/90 max-w-2xl leading-relaxed">
              Você pode iniciar atividades, visualizar a rota desenhada em tempo real pelo mapa, acompanhar métricas de velocidade, ritmo (pace), passos e calorias. Fique à vontade para testar livremente!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isRecording && (
              <button
                type="button"
                onClick={() => handleStartActivity(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-extrabold shadow-md transition flex items-center gap-1.5 cursor-pointer"
                title="Simula uma caminhada ou corrida com rota no mapa para testes imediatos sem sair de casa"
              >
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                <span>Simular Percurso (Teste no PC)</span>
              </button>
            )}
            {onOpenAndroidApp && (
              <button
                type="button"
                onClick={onOpenAndroidApp}
                className="px-3.5 py-2 rounded-xl bg-white/40 hover:bg-white/60 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone size={14} />
                <span>Instalar APK Android</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR / WARNING ALERT IF ANY */}
      {gpsError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button
            onClick={() => setGpsError(null)}
            className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN TRACKER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map & Route View (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
          {/* Map Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Mapa do Percurso
              </span>
              {isRecording && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Gravando Rota
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Radio className={`w-3.5 h-3.5 ${gpsAccuracy && gpsAccuracy < 15 ? 'text-emerald-500' : 'text-amber-500'}`} />
                {gpsAccuracy ? `Precisão: ~${gpsAccuracy}m` : 'GPS Aguardando'}
              </span>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-[340px] sm:h-[400px] bg-slate-100 dark:bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Map Overlay Badge */}
            {isRecording && (
              <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border border-white/20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{routePoints.length} coordenadas capturadas</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Telemetry HUD & Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
          {/* Top Activity Selector */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Tipo de Atividade
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['caminhada', 'corrida', 'ciclismo', 'treino_livre'] as const).map((type) => {
                const info = ACTIVITY_MET_FACTORS[type];
                const active = activityType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isRecording}
                    onClick={() => setActivityType(type)}
                    className={`py-2 px-1 rounded-xl text-center transition flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50 ${
                      active
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base">{info.icon}</span>
                    <span className="text-[10px] leading-tight">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry Metrics Display */}
          <div className="space-y-4">
            {/* Big Timer */}
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Tempo Decorrido
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>

            {/* Metrics 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Distance */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Distância
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {totalDistanceKm.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">km</span>
                </div>
              </div>

              {/* Speed */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Velocidade
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
                    {currentSpeedKmh.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">km/h</span>
                </div>
              </div>

              {/* Pace */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ritmo (Pace)
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {avgPaceMinKm}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">min/km</span>
                </div>
              </div>

              {/* Calories */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Calorias
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-amber-500 font-mono">
                    {burnedCalories}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">kcal</span>
                </div>
              </div>
            </div>

            {/* Steps & Avg Speed bar */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Passos Estimados:
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {estimatedSteps.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            {!isRecording ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStartActivity(false)}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg hover:shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Iniciar Atividade GPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartActivity(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Testar Modo Simulação (Sem GPS externo)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {!isPaused ? (
                    <button
                      type="button"
                      onClick={handlePauseActivity}
                      className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResumeActivity}
                      className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Retomar</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleFinishAndSave}
                    className="py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                    <span>Concluir & Salvar</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDiscardActivity}
                  className="w-full py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition cursor-pointer"
                >
                  Descartar Percurso
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECORDED ACTIVITIES HISTORY */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Histórico de Atividades Gravadas
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
              {savedActivities.length}
            </span>
          </div>

          <button
            type="button"
            onClick={loadActivities}
            className="p-2 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={loadingHistory ? 'animate-spin' : ''} />
          </button>
        </div>

        {savedActivities.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Activity className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
            <p className="text-xs">Nenhuma atividade registrada ainda.</p>
            <p className="text-[11px] text-slate-500">
              Clique em "Iniciar Atividade GPS" ou "Simular Percurso" acima para gravar o primeiro percurso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedActivities.map((act) => {
              const icon = ACTIVITY_MET_FACTORS[act.activity_type]?.icon || '🏃';
              return (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl">{icon}</div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {act.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(act.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Excluir atividade"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Distância</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {act.total_distance_km.toFixed(2)} km
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tempo</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {formatDuration(act.duration_seconds)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Calorias</span>
                      <span className="font-bold text-amber-500 font-mono">
                        {act.total_calories} kcal
                      </span>
                    </div>
                  </div>

                  {act.notes && (
                    <div className="text-[10px] text-slate-500 italic bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800">
                      {act.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
