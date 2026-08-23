import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';

export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp?: number;
  altitude?: number | null;
  speed?: number | null;
}

export interface ActivitySummary {
  date: string;
  totalSteps: number;
  totalCalories: number;
  totalDistanceKm: number;
  durationSeconds: number;
  route: Coordinate[];
}

export interface UseActivityTrackerOptions {
  userWeightKg?: number;
  metValue?: number; // Padrão 6.0 para corrida/caminhada rápida
  gpsIntervalMs?: number;
  gpsDistanceIntervalMeters?: number;
}

/**
 * Calcula a distância entre duas coordenadas em quilômetros usando a fórmula de Haversine
 */
export function calculateHaversineDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371; // Raio da Terra em KM
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    userWeightKg = 75,
    metValue = 6.0,
    gpsIntervalMs = 3000,
    gpsDistanceIntervalMeters = 5,
  } = options;

  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [currentCoordinate, setCurrentCoordinate] = useState<Coordinate | null>(null);
  const [stepCount, setStepCount] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Subscriptions & Timers
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pedometerSubscription = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const initialStepsRef = useRef<number>(0);

  // Verificar disponibilidade dos sensores de passos no Android
  useEffect(() => {
    let isMounted = true;
    Pedometer.isAvailableAsync()
      .then((available) => {
        if (isMounted) setIsPedometerAvailable(available);
      })
      .catch((err) => {
        console.warn('Erro ao checar sensor de passos:', err);
        if (isMounted) setIsPedometerAvailable(false);
      });

    return () => {
      isMounted = false;
      stopTracking();
    };
  }, []);

  // Cálculo de calorias baseado na fórmula MET e duração
  const calculateCalories = useCallback(
    (seconds: number): number => {
      const minutes = seconds / 60;
      const calories = ((metValue * 3.5 * userWeightKg) / 200) * minutes;
      return parseFloat(calories.toFixed(1));
    },
    [metValue, userWeightKg]
  );

  // Iniciar Rastreamento
  const startTracking = async () => {
    setErrorMessage(null);

    try {
      // 1. Solicitar permissões no Android
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        const error = 'Permissão de localização negada pelo usuário.';
        setErrorMessage(error);
        throw new Error(error);
      }

      let pedometerGranted = true;
      try {
        const { status: pedStatus } = await Pedometer.requestPermissionsAsync();
        if (pedStatus !== 'granted') pedometerGranted = false;
      } catch (e) {
        console.warn('Permissão de pedômetro não disponível no dispositivo:', e);
      }

      // Resetar métricas
      setIsTracking(true);
      setRouteCoordinates([]);
      setStepCount(0);
      setCaloriesBurned(0);
      setDistanceKm(0);
      setDurationSeconds(0);
      setCurrentSpeedKmh(0);
      initialStepsRef.current = 0;

      // 2. Iniciar Timer de Duração e Calorias
      let seconds = 0;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        seconds += 1;
        setDurationSeconds(seconds);
        setCaloriesBurned(calculateCalories(seconds));
      }, 1000);

      // 3. Iniciar Listener de Localização GPS com cálculo incremental de Haversine
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: gpsIntervalMs,
          distanceInterval: gpsDistanceIntervalMeters,
        },
        (location) => {
          const newCoord: Coordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
          };

          setCurrentCoordinate(newCoord);

          if (location.coords.speed && location.coords.speed > 0) {
            setCurrentSpeedKmh(parseFloat((location.coords.speed * 3.6).toFixed(1)));
          }

          setRouteCoordinates((prevCoords) => {
            if (prevCoords.length > 0) {
              const lastCoord = prevCoords[prevCoords.length - 1];
              const addedKm = calculateHaversineDistance(lastCoord, newCoord);

              // Evitar saltos irreais por ruído de GPS (< 2 metros)
              if (addedKm > 0.002) {
                setDistanceKm((prevDist) => parseFloat((prevDist + addedKm).toFixed(3)));
              }
            }
            return [...prevCoords, newCoord];
          });
        }
      );

      // 4. Iniciar Listener do Sensor de Passos
      if (pedometerGranted) {
        pedometerSubscription.current = Pedometer.watchStepCount((result) => {
          setStepCount(result.steps);
        });
      }
    } catch (err: any) {
      console.error('Falha ao iniciar rastreador:', err);
      setErrorMessage(err?.message || 'Falha ao iniciar atividade');
      stopTracking();
    }
  };

  // Pausar / Parar rastreamento
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (pedometerSubscription.current) {
      pedometerSubscription.current.remove();
      pedometerSubscription.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Exportação estruturada da atividade concluída
  const saveActivity = useCallback((): ActivitySummary => {
    stopTracking();

    const summary: ActivitySummary = {
      date: new Date().toISOString(),
      totalSteps: stepCount,
      totalCalories: caloriesBurned,
      totalDistanceKm: parseFloat(distanceKm.toFixed(2)),
      durationSeconds: durationSeconds,
      route: [...routeCoordinates],
    };

    return summary;
  }, [stepCount, caloriesBurned, distanceKm, durationSeconds, routeCoordinates, stopTracking]);

  // Formatador utilitário de tempo (MM:SS ou HH:MM:SS)
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins}:${secs}`;
    }
    return `${mins}:${secs}`;
  };

  return {
    isTracking,
    isPedometerAvailable,
    routeCoordinates,
    currentCoordinate,
    stepCount,
    caloriesBurned,
    distanceKm,
    durationSeconds,
    currentSpeedKmh,
    errorMessage,
    startTracking,
    stopTracking,
    saveActivity,
    formatTime,
  };
}
