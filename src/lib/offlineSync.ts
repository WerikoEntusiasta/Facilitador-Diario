// Offline Cache and Automatic Synchronization Manager
// Keeps user data cached for up to 3 days when server is unreachable (e.g. container down).
// Automatically queues changes offline and syncs missing data once reconnected.

import {
  apiCreateNote,
  apiUpdateNote,
  apiTogglePinNote,
  apiToggleArchiveNote,
  apiToggleTrashNote,
  apiDeleteNotePermanently,
  apiCreateLabel,
  apiDeleteLabel,
  apiCreateBoard,
  apiUpdateBoard,
  apiDeleteBoard,
  apiCreateColumn,
  apiUpdateColumn,
  apiDeleteColumn,
  apiCreateCard,
  apiUpdateCard,
  apiMoveCard,
  apiDeleteCard,
  apiCreateWorkout,
  apiUpdateWorkout,
  apiDeleteWorkout,
  testServerConnection,
} from './api';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export type ActionType =
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'TOGGLE_PIN_NOTE'
  | 'TOGGLE_ARCHIVE_NOTE'
  | 'TOGGLE_TRASH_NOTE'
  | 'DELETE_NOTE_PERMANENT'
  | 'CREATE_LABEL'
  | 'DELETE_LABEL'
  | 'CREATE_BOARD'
  | 'UPDATE_BOARD'
  | 'DELETE_BOARD'
  | 'CREATE_COLUMN'
  | 'UPDATE_COLUMN'
  | 'DELETE_COLUMN'
  | 'CREATE_CARD'
  | 'UPDATE_CARD'
  | 'MOVE_CARD'
  | 'DELETE_CARD'
  | 'CREATE_WORKOUT'
  | 'UPDATE_WORKOUT'
  | 'DELETE_WORKOUT';

export interface SyncQueueAction {
  id: string;
  timestamp: number;
  type: ActionType;
  payload: any;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
}

type SyncListener = (state: SyncState) => void;

let currentState: SyncState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: Date.now(),
};

const listeners: Set<SyncListener> = new Set();

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(currentState);
  return () => listeners.delete(listener);
}

function updateState(partial: Partial<SyncState>): void {
  currentState = { ...currentState, ...partial, pendingCount: getSyncQueue().length };
  listeners.forEach((fn) => fn(currentState));
}

// ---------------- CACHE MANAGEMENT (3 DAYS TTL) ----------------

export function saveCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`kb_cache_${key}`, JSON.stringify(entry));
  } catch (err) {
    console.warn('Erro ao salvar cache:', err);
  }
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`kb_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    // Valid for 3 days
    if (age <= THREE_DAYS_MS) {
      return entry.data;
    } else {
      localStorage.removeItem(`kb_cache_${key}`);
      return null;
    }
  } catch (err) {
    return null;
  }
}

export function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith('kb_cache_')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const entry: CacheEntry<any> = JSON.parse(raw);
            if (Date.now() - entry.timestamp > THREE_DAYS_MS) {
              localStorage.removeItem(k);
            }
          } catch {
            localStorage.removeItem(k);
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

// ---------------- QUEUE MANAGEMENT ----------------

export function getSyncQueue(): SyncQueueAction[] {
  try {
    const raw = localStorage.getItem('kb_sync_queue');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setSyncQueue(queue: SyncQueueAction[]): void {
  try {
    localStorage.setItem('kb_sync_queue', JSON.stringify(queue));
    updateState({ pendingCount: queue.length });
  } catch (err) {
    console.warn('Erro ao atualizar fila de sincronização:', err);
  }
}

export function enqueueSyncAction(type: ActionType, payload: any): void {
  const queue = getSyncQueue();
  const action: SyncQueueAction = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
    type,
    payload,
  };
  queue.push(action);
  setSyncQueue(queue);
}

// ---------------- PROCESS SYNC QUEUE ----------------

let isProcessing = false;

export async function processSyncQueue(onRefreshRequired?: () => void): Promise<boolean> {
  if (isProcessing) return false;
  const queue = getSyncQueue();
  if (queue.length === 0) return true;

  isProcessing = true;
  updateState({ isSyncing: true });

  const remainingQueue: SyncQueueAction[] = [];

  for (const action of queue) {
    try {
      switch (action.type) {
        case 'CREATE_NOTE':
          await apiCreateNote(action.payload);
          break;
        case 'UPDATE_NOTE':
          await apiUpdateNote(action.payload.id, action.payload.data);
          break;
        case 'TOGGLE_PIN_NOTE':
          await apiTogglePinNote(action.payload.id);
          break;
        case 'TOGGLE_ARCHIVE_NOTE':
          await apiToggleArchiveNote(action.payload.id);
          break;
        case 'TOGGLE_TRASH_NOTE':
          await apiToggleTrashNote(action.payload.id);
          break;
        case 'DELETE_NOTE_PERMANENT':
          await apiDeleteNotePermanently(action.payload.id);
          break;
        case 'CREATE_LABEL':
          await apiCreateLabel(action.payload.name, action.payload.color);
          break;
        case 'DELETE_LABEL':
          await apiDeleteLabel(action.payload.id);
          break;
        case 'CREATE_BOARD':
          await apiCreateBoard(action.payload);
          break;
        case 'UPDATE_BOARD':
          await apiUpdateBoard(action.payload.id, action.payload.data);
          break;
        case 'DELETE_BOARD':
          await apiDeleteBoard(action.payload.id);
          break;
        case 'CREATE_COLUMN':
          await apiCreateColumn(action.payload.board_id, action.payload.title);
          break;
        case 'UPDATE_COLUMN':
          await apiUpdateColumn(action.payload.id, action.payload.title);
          break;
        case 'DELETE_COLUMN':
          await apiDeleteColumn(action.payload.id);
          break;
        case 'CREATE_CARD':
          await apiCreateCard(action.payload);
          break;
        case 'UPDATE_CARD':
          await apiUpdateCard(action.payload.id, action.payload.data);
          break;
        case 'MOVE_CARD':
          await apiMoveCard(action.payload.id, action.payload.target_column_id, action.payload.new_position);
          break;
        case 'DELETE_CARD':
          await apiDeleteCard(action.payload.id);
          break;
        case 'CREATE_WORKOUT':
          await apiCreateWorkout(action.payload);
          break;
        case 'UPDATE_WORKOUT':
          await apiUpdateWorkout(action.payload.id, action.payload.data);
          break;
        case 'DELETE_WORKOUT':
          await apiDeleteWorkout(action.payload.id);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn(`Erro ao sincronizar ação ${action.type}:`, err);
      // If error is network error / server down, keep action in queue and stop processing
      remainingQueue.push(action);
      // Keep rest of queue as well
      const idx = queue.indexOf(action);
      if (idx !== -1) {
        remainingQueue.push(...queue.slice(idx + 1));
      }
      break;
    }
  }

  setSyncQueue(remainingQueue);
  isProcessing = false;

  const success = remainingQueue.length === 0;
  if (success) {
    updateState({ isSyncing: false, isOnline: true, lastSyncedAt: Date.now() });
    if (onRefreshRequired) {
      onRefreshRequired();
    }
  } else {
    updateState({ isSyncing: false, isOnline: false });
  }

  return success;
}

// ---------------- AUTOMATIC RECONNECTION MONITOR ----------------

export function startSyncMonitor(onRefreshData: () => void): () => void {
  clearExpiredCache();

  let checkTimer: any = null;

  const checkConnectionAndSync = async () => {
    const token = localStorage.getItem('kb_auth_token');
    if (!token) return;

    try {
      const conn = await testServerConnection();
      if (conn.success) {
        if (!currentState.isOnline) {
          updateState({ isOnline: true });
        }
        const queue = getSyncQueue();
        if (queue.length > 0) {
          await processSyncQueue(onRefreshData);
        }
      } else {
        if (currentState.isOnline) {
          updateState({ isOnline: false });
        }
      }
    } catch {
      if (currentState.isOnline) {
        updateState({ isOnline: false });
      }
    }
  };

  const handleOnline = () => {
    checkConnectionAndSync();
  };

  const handleOffline = () => {
    updateState({ isOnline: false });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check server health every 8 seconds
  checkTimer = setInterval(checkConnectionAndSync, 8000);

  // Initial check
  checkConnectionAndSync();

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (checkTimer) clearInterval(checkTimer);
  };
}
