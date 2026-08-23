import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useActivityTracker, ActivitySummary } from './useActivityTracker';

interface TrackerScreenProps {
  userWeightKg?: number;
  onActivitySaved?: (activity: ActivitySummary) => void;
  onClose?: () => void;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({
  userWeightKg = 75,
  onActivitySaved,
  onClose,
}) => {
  const mapRef = useRef<any>(null);

  const {
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
  } = useActivityTracker({
    userWeightKg,
    gpsIntervalMs: 3000,
    gpsDistanceIntervalMeters: 5,
  });

  const handleToggleTracking = async () => {
    if (isTracking) {
      Alert.alert(
        'Finalizar Atividade',
        'Deseja salvar e concluir seu treino?',
        [
          { text: 'Continuar Treinando', style: 'cancel' },
          {
            text: 'Salvar Treino',
            style: 'default',
            onPress: () => {
              const summary = saveActivity();
              if (onActivitySaved) {
                onActivitySaved(summary);
              }
              Alert.alert(
                '🎉 Atividade Salva!',
                `Distância: ${summary.totalDistanceKm} km\nPassos: ${summary.totalSteps}\nCalorias: ${summary.totalCalories} kcal\nTempo: ${formatTime(summary.durationSeconds)}`
              );
            },
          },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => stopTracking(),
          },
        ]
      );
    } else {
      await startTracking();
    }
  };

  const initialRegion = currentCoordinate
    ? {
        latitude: currentCoordinate.latitude,
        longitude: currentCoordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }
    : {
        latitude: -21.138,
        longitude: -48.977,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>KeepFlow GPS Tracker</Text>
          <Text style={styles.headerSubtitle}>
            {isTracking ? '🟢 Gravando percurso em tempo real' : '⚪ Pronto para iniciar'}
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message Warning */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Google Map with Realtime Route */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          followsUserLocation={isTracking}
          showsMyLocationButton={true}
          showsCompass={true}
          loadingEnabled={true}
        >
          {routeCoordinates.length > 1 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeWidth={5}
              strokeColor="#10b981"
              lineCap="round"
              lineJoin="round"
            />
          )}

          {routeCoordinates.length > 0 && (
            <Marker
              coordinate={routeCoordinates[0]}
              title="Ponto de Partida"
              description="Início da atividade"
              pinColor="#10b981"
            />
          )}

          {currentCoordinate && routeCoordinates.length > 1 && (
            <Marker
              coordinate={currentCoordinate}
              title="Posição Atual"
              description={`${currentSpeedKmh} km/h`}
              pinColor="#3b82f6"
            />
          )}
        </MapView>
      </View>

      {/* Bottom Telemetry Dashboard */}
      <View style={styles.dashboard}>
        {/* Main 4 Telemetry Metrics */}
        <View style={styles.metricsGrid}>
          {/* Distance */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>DISTÂNCIA</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricPrimaryValue}>{distanceKm.toFixed(2)}</Text>
              <Text style={styles.metricUnit}>km</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>TEMPO</Text>
            <Text style={styles.metricPrimaryValue}>{formatTime(durationSeconds)}</Text>
          </View>

          {/* Steps */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PASSOS</Text>
            <Text style={styles.metricSecondaryValue}>{stepCount.toLocaleString()}</Text>
            {isPedometerAvailable === false && (
              <Text style={styles.sensorUnavailable}>Sensor off</Text>
            )}
          </View>

          {/* Calories */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>CALORIAS</Text>
            <View style={styles.valueRow}>
              <Text style={styles.metricSecondaryValue}>{caloriesBurned}</Text>
              <Text style={styles.metricUnit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* Speed Bar (when moving) */}
        {isTracking && (
          <View style={styles.speedContainer}>
            <Text style={styles.speedText}>
              Velocidade Atual: <Text style={styles.speedBold}>{currentSpeedKmh} km/h</Text>
            </Text>
          </View>
        )}

        {/* Main Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.actionButton, isTracking ? styles.buttonStop : styles.buttonStart]}
          onPress={handleToggleTracking}
        >
          <Text style={styles.actionButtonText}>
            {isTracking ? '⏹ Parar e Salvar Atividade' : '▶ Iniciar Atividade Física'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TrackerScreen;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: '100%',
  },
  dashboard: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricPrimaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#38bdf8',
    fontVariant: ['tabular-nums'],
  },
  metricSecondaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 4,
  },
  sensorUnavailable: {
    fontSize: 9,
    color: '#f59e0b',
    marginTop: 2,
  },
  speedContainer: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  speedText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  speedBold: {
    fontWeight: 'bold',
    color: '#10b981',
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonStart: {
    backgroundColor: '#10b981',
  },
  buttonStop: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});
