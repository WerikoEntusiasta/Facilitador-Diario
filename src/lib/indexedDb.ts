// IndexedDB Storage Layer for high-capacity offline caching
// Supports large payloads (notes, attachments, board states, workouts) beyond localStorage limits.

const DB_NAME = 'keepboard_idb';
const DB_VERSION = 1;
const STORE_NAME = 'cache_store';

interface IDBRecord<T = any> {
  key: string;
  timestamp: number;
  data: T;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSet<T>(key: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: IDBRecord<T> = {
        key,
        timestamp: Date.now(),
        data,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage if IDB fails
    try {
      localStorage.setItem(`idb_fb_${key}`, JSON.stringify({ timestamp: Date.now(), data }));
    } catch {
      // ignore
    }
  }
}

export async function idbGet<T>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as IDBRecord<T> | undefined;
        if (!record) {
          resolve(null);
          return;
        }
        if (Date.now() - record.timestamp > maxAgeMs) {
          // Expired
          idbDelete(key);
          resolve(null);
        } else {
          resolve(record.data);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback
    try {
      const raw = localStorage.getItem(`idb_fb_${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp > maxAgeMs) {
        localStorage.removeItem(`idb_fb_${key}`);
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch {
    localStorage.removeItem(`idb_fb_${key}`);
  }
}

export async function idbClearExpired(maxAgeMs: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();
    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        const record = cursor.value as IDBRecord;
        if (Date.now() - record.timestamp > maxAgeMs) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
  } catch {
    // ignore
  }
}
