// Declarações de tipos para suportar o desenvolvimento React Native no ambiente Web/Vite

declare module 'react-native' {
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const Text: any;
  export const View: any;
  export const TouchableOpacity: any;
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };
  export const ActivityIndicator: any;
  export const Alert: {
    alert: (title: string, message?: string, buttons?: Array<{ text?: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => void;
  };
  export const SafeAreaView: any;
  export const StatusBar: any;
}

declare module 'react-native-maps' {
  export const PROVIDER_GOOGLE: string;
  export const PROVIDER_DEFAULT: string;
  export const Marker: any;
  export const Polyline: any;
  export const Circle: any;
  const MapView: any;
  export default MapView;
}

declare module 'expo-location' {
  export enum Accuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  export interface LocationObjectCoords {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  }

  export interface LocationObject {
    coords: LocationObjectCoords;
    timestamp: number;
  }

  export interface LocationSubscription {
    remove: () => void;
  }

  export interface LocationOptions {
    accuracy?: Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
    mayShowUserSettingsDialog?: boolean;
  }

  export interface PermissionResponse {
    status: 'granted' | 'undetermined' | 'denied';
    expires: 'never' | number;
    granted: boolean;
    canAskAgain: boolean;
  }

  export function requestForegroundPermissionsAsync(): Promise<PermissionResponse>;
  export function requestBackgroundPermissionsAsync(): Promise<PermissionResponse>;
  export function watchPositionAsync(
    options: LocationOptions,
    callback: (location: LocationObject) => void
  ): Promise<LocationSubscription>;
  export function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
}

declare module 'expo-sensors' {
  export interface PedometerResult {
    steps: number;
  }

  export interface PedometerListener {
    remove: () => void;
  }

  export interface PermissionResponse {
    status: 'granted' | 'undetermined' | 'denied';
    expires: 'never' | number;
    granted: boolean;
    canAskAgain: boolean;
  }

  export namespace Pedometer {
    export function isAvailableAsync(): Promise<boolean>;
    export function requestPermissionsAsync(): Promise<PermissionResponse>;
    export function watchStepCount(callback: (result: PedometerResult) => void): PedometerListener;
    export function getStepCountAsync(start: Date, end: Date): Promise<PedometerResult>;
  }
}
