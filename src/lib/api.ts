import {
  Note,
  NoteAttachment,
  Label,
  KanbanBoard,
  KanbanColumn,
  KanbanCard,
  PdfDocument,
  CalendarEvent,
  TrashedItem,
  User,
  AuthResponse,
  WorkoutRoutine,
  VaultItem,
} from '../types';
import { saveCache, getCache, enqueueSyncAction } from './offlineSync';

// DYNAMIC SERVER CONNECTION CONFIGURATION
export function isLocalhostUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('localhost') ||
    clean.includes('127.0.0.1') ||
    clean.includes('::1') ||
    clean.includes('0.0.0.0') ||
    clean.startsWith('file:') ||
    clean.startsWith('capacitor:')
  );
}

export function isCurrentOriginLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  return isLocalhostUrl(window.location.href) || isLocalhostUrl(window.location.hostname);
}

export const DEFAULT_SERVER_URL = 'https://keepflow.werikspace.xyz';
export const DEFAULT_PRODUCTION_API = 'https://keepflow.werikspace.xyz/api';

export function getServerUrl(): string {
  const saved = (localStorage.getItem('kb_server_url') || '').trim().replace(/\/+$/, '');
  if (saved && isLocalhostUrl(saved)) {
    localStorage.removeItem('kb_server_url');
    return DEFAULT_SERVER_URL;
  }
  return saved || DEFAULT_SERVER_URL;
}

export function setServerUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, '');
  if (clean) {
    if (isLocalhostUrl(clean)) {
      throw new Error('Atenção: Conexão via Localhost (127.0.0.1) é proibida. Informe o IP público ou domínio do seu servidor remoto.');
    }
    localStorage.setItem('kb_server_url', clean);
  } else {
    localStorage.removeItem('kb_server_url');
  }
}

export function getServerKey(): string {
  return (localStorage.getItem('kb_server_key') || '').trim();
}

export function setServerKey(key: string): void {
  const clean = key.trim();
  if (clean) {
    localStorage.setItem('kb_server_key', clean);
  } else {
    localStorage.removeItem('kb_server_key');
  }
}

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const protocol = window.location.protocol;
  return protocol === 'capacitor:' || protocol === 'file:' || (window as any).Capacitor !== undefined;
}

export function getApiBaseUrl(): string {
  const customUrl = getServerUrl();
  if (customUrl) {
    if (isLocalhostUrl(customUrl)) {
      throw new Error('Localhost é proibido. Por favor, configure um Servidor Remoto válido.');
    }
    return `${customUrl}/api`;
  }
  return DEFAULT_PRODUCTION_API;
}

export function resolveUploadUrl(pathUrl: string): string {
  if (!pathUrl) return '';
  if (pathUrl.startsWith('http://') || pathUrl.startsWith('https://') || pathUrl.startsWith('data:')) {
    return pathUrl;
  }
  const customUrl = getServerUrl();
  const cleanPath = pathUrl.startsWith('/') ? pathUrl : `/${pathUrl}`;
  return customUrl ? `${customUrl}${cleanPath}` : cleanPath;
}

export async function testServerConnection(targetUrl?: string, targetKey?: string): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const urlToTest = targetUrl !== undefined ? targetUrl.trim().replace(/\/+$/, '') : getServerUrl();
    
    if (urlToTest && isLocalhostUrl(urlToTest)) {
      return {
        success: false,
        message: 'Atenção: Uso de Localhost (127.0.0.1) é proibido. Digite o IP público ou domínio do seu servidor remoto (ex: http://45.167.187.80:8948).'
      };
    }

    if (!urlToTest && isCurrentOriginLocalhost()) {
      return {
        success: false,
        message: 'Atenção: Você está acessando via Localhost. É obrigatório informar o IP ou domínio do seu servidor remoto para conectar.'
      };
    }

    const apiUrl = urlToTest ? `${urlToTest}/api/health` : '/api/health';
    const key = targetKey !== undefined ? targetKey.trim() : getServerKey();
    
    const headers: Record<string, string> = {};
    if (key) {
      headers['X-Server-Key'] = key;
    }

    const res = await fetch(apiUrl, { headers, method: 'GET' });
    if (!res.ok) {
      return { success: false, message: `Servidor respondeu com erro HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, message: 'Conexão com o servidor remoto estabelecida com sucesso!', data };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao conectar no servidor. Verifique a URL do Servidor Remoto.' };
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('kb_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const key = getServerKey();
  if (key) {
    headers['X-Server-Key'] = key;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options?.headers,
  };

  const apiBase = getApiBaseUrl();

  const res = await fetch(`${apiBase}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro de comunicação com o servidor' }));
    throw new Error(errorData.error || `Erro HTTP ${res.status}`);
  }

  return res.json();
}

// AUTH API
export const apiLogin = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const apiRegister = (data: { name: string; email: string; password: string; avatar?: string }) =>
  request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const apiGetMe = async (): Promise<User> => {
  try {
    const user = await request<User>('/auth/me');
    saveCache('user_me', user);
    return user;
  } catch (err) {
    const cached = getCache<User>('user_me');
    if (cached) return cached;
    throw err;
  }
};

export const apiUpdateProfile = (data: { name?: string; avatar?: string; newPassword?: string }) =>
  request<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// LABELS API
export const apiGetLabels = async (): Promise<Label[]> => {
  try {
    const data = await request<Label[]>('/labels');
    saveCache('labels', data);
    return data;
  } catch (err) {
    const cached = getCache<Label[]>('labels');
    if (cached) return cached;
    return [];
  }
};

export const apiCreateLabel = async (name: string, color: string): Promise<Label> => {
  try {
    const created = await request<Label>('/labels', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    return created;
  } catch (err) {
    enqueueSyncAction('CREATE_LABEL', { name, color });
    const mockLabel: Label = { id: Date.now(), name, color };
    return mockLabel;
  }
};

export const apiDeleteLabel = async (id: number): Promise<{ success: boolean }> => {
  try {
    return await request<{ success: boolean }>(`/labels/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_LABEL', { id });
    return { success: true };
  }
};

// NOTES API
export const apiGetNotes = async (archived = false, trashed = false, labelId?: number): Promise<Note[]> => {
  let url = `/notes?archived=${archived}&trashed=${trashed}`;
  if (labelId) url += `&labelId=${labelId}`;
  const cacheKey = `notes_${archived}_${trashed}_${labelId || 'all'}`;
  try {
    const notes = await request<Note[]>(url);
    saveCache(cacheKey, notes);
    return notes;
  } catch (err) {
    const cached = getCache<Note[]>(cacheKey);
    if (cached) return cached;
    return [];
  }
};

export const apiCreateNote = async (note: Partial<Note> & { labelIds?: number[] }): Promise<Note> => {
  try {
    return await request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  } catch (err) {
    enqueueSyncAction('CREATE_NOTE', note);
    const mockNote: Note = {
      id: Date.now(),
      title: note.title || '',
      content: note.content || '',
      checklist: note.checklist || [],
      attachments: note.attachments || [],
      color: note.color || '#ffffff',
      is_pinned: Boolean(note.is_pinned),
      is_archived: false,
      is_trashed: false,
      reminder_date: note.reminder_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    return mockNote;
  }
};

export const apiUpdateNote = async (id: number, note: Partial<Note> & { labelIds?: number[] }): Promise<Note> => {
  try {
    return await request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(note),
    });
  } catch (err) {
    enqueueSyncAction('UPDATE_NOTE', { id, data: note });
    const mockNote: Note = {
      id,
      title: note.title || '',
      content: note.content || '',
      checklist: note.checklist || [],
      attachments: note.attachments || [],
      color: note.color || '#ffffff',
      is_pinned: Boolean(note.is_pinned),
      is_archived: Boolean(note.is_archived),
      is_trashed: Boolean(note.is_trashed),
      reminder_date: note.reminder_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    return mockNote;
  }
};

export const apiToggleArchiveNote = async (id: number) => {
  try {
    return await request<{ id: number; is_archived: boolean }>(`/notes/${id}/archive`, { method: 'PATCH' });
  } catch (err) {
    enqueueSyncAction('TOGGLE_ARCHIVE_NOTE', { id });
    return { id, is_archived: true };
  }
};

export const apiToggleTrashNote = async (id: number) => {
  try {
    return await request<{ id: number; is_trashed: boolean }>(`/notes/${id}/trash`, { method: 'PATCH' });
  } catch (err) {
    enqueueSyncAction('TOGGLE_TRASH_NOTE', { id });
    return { id, is_trashed: true };
  }
};

export const apiTogglePinNote = async (id: number) => {
  try {
    return await request<{ id: number; is_pinned: boolean }>(`/notes/${id}/pin`, { method: 'PATCH' });
  } catch (err) {
    enqueueSyncAction('TOGGLE_PIN_NOTE', { id });
    return { id, is_pinned: true };
  }
};

export const apiDeleteNotePermanently = async (id: number) => {
  try {
    return await request<{ success: boolean; id: number }>(`/notes/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_NOTE_PERMANENT', { id });
    return { success: true, id };
  }
};

export const apiUploadNoteAttachment = async (file: File): Promise<NoteAttachment> => {
  const formData = new FormData();
  formData.append('file', file);
  const headers = getAuthHeaders();
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/notes/attachments/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Erro ao enviar anexo' }));
    throw new Error(errData.error || `Erro HTTP ${res.status}`);
  }
  return res.json();
};

// KANBAN API
export const apiGetBoards = async (): Promise<KanbanBoard[]> => {
  try {
    const boards = await request<KanbanBoard[]>('/boards');
    saveCache('boards', boards);
    return boards;
  } catch (err) {
    const cached = getCache<KanbanBoard[]>('boards');
    if (cached) return cached;
    return [];
  }
};

export const apiGetBoardDetails = async (id: number): Promise<KanbanBoard> => {
  try {
    const details = await request<KanbanBoard>(`/boards/${id}`);
    saveCache(`board_${id}`, details);
    return details;
  } catch (err) {
    const cached = getCache<KanbanBoard>(`board_${id}`);
    if (cached) return cached;
    throw err;
  }
};

export const apiCreateBoard = async (board: { title: string; description?: string; color?: string }): Promise<KanbanBoard> => {
  try {
    return await request<KanbanBoard>('/boards', {
      method: 'POST',
      body: JSON.stringify(board),
    });
  } catch (err) {
    enqueueSyncAction('CREATE_BOARD', board);
    const mockBoard: KanbanBoard = {
      id: Date.now(),
      title: board.title,
      description: board.description || '',
      color: board.color || '#3b82f6',
      created_at: new Date().toISOString(),
      columns: [],
    };
    return mockBoard;
  }
};

export const apiUpdateBoard = async (id: number, board: { title: string; description?: string; color?: string }) => {
  try {
    return await request<KanbanBoard>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(board),
    });
  } catch (err) {
    enqueueSyncAction('UPDATE_BOARD', { id, data: board });
    const mockBoard: KanbanBoard = {
      id,
      title: board.title,
      description: board.description || '',
      color: board.color || '#3b82f6',
      created_at: new Date().toISOString(),
      columns: [],
    };
    return mockBoard;
  }
};

export const apiDeleteBoard = async (id: number) => {
  try {
    return await request<{ success: boolean; id: number }>(`/boards/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_BOARD', { id });
    return { success: true, id };
  }
};

export const apiCreateColumn = async (board_id: number, title: string): Promise<KanbanColumn> => {
  try {
    return await request<KanbanColumn>('/columns', {
      method: 'POST',
      body: JSON.stringify({ board_id, title }),
    });
  } catch (err) {
    enqueueSyncAction('CREATE_COLUMN', { board_id, title });
    const mockColumn: KanbanColumn = {
      id: Date.now(),
      board_id,
      title,
      position: 0,
      cards: [],
    };
    return mockColumn;
  }
};

export const apiUpdateColumn = async (id: number, title: string) => {
  try {
    return await request<{ id: number; title: string }>(`/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  } catch (err) {
    enqueueSyncAction('UPDATE_COLUMN', { id, title });
    return { id, title };
  }
};

export const apiDeleteColumn = async (id: number) => {
  try {
    return await request<{ success: boolean; id: number }>(`/columns/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_COLUMN', { id });
    return { success: true, id };
  }
};

export const apiCreateCard = async (card: Partial<KanbanCard> & { labelIds?: number[] }): Promise<KanbanCard> => {
  try {
    return await request<KanbanCard>('/cards', {
      method: 'POST',
      body: JSON.stringify(card),
    });
  } catch (err) {
    enqueueSyncAction('CREATE_CARD', card);
    const mockCard: KanbanCard = {
      id: Date.now(),
      column_id: card.column_id || 0,
      board_id: card.board_id || 0,
      title: card.title || '',
      description: card.description || '',
      checklist: card.checklist || [],
      priority: card.priority || 'Média',
      position: card.position || 0,
      due_date: card.due_date || null,
      is_trashed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    return mockCard;
  }
};

export const apiSaveCard = apiCreateCard;

export const apiUpdateCard = async (id: number, card: Partial<KanbanCard> & { labelIds?: number[] }): Promise<KanbanCard> => {
  try {
    return await request<KanbanCard>(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(card),
    });
  } catch (err) {
    enqueueSyncAction('UPDATE_CARD', { id, data: card });
    const mockCard: KanbanCard = {
      id,
      column_id: card.column_id || 0,
      board_id: card.board_id || 0,
      title: card.title || '',
      description: card.description || '',
      checklist: card.checklist || [],
      priority: card.priority || 'Média',
      position: card.position || 0,
      due_date: card.due_date || null,
      is_trashed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
    };
    return mockCard;
  }
};

export const apiMoveCard = async (id: number, target_column_id: number, new_position: number) => {
  try {
    return await request<{ success: boolean }>(`/cards/${id}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ target_column_id, new_position }),
    });
  } catch (err) {
    enqueueSyncAction('MOVE_CARD', { id, target_column_id, new_position });
    return { success: true };
  }
};

export const apiDeleteCard = async (id: number) => {
  try {
    return await request<{ success: boolean; id: number }>(`/cards/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_CARD', { id });
    return { success: true, id };
  }
};

// CALENDAR API
export const apiGetCalendarEvents = () => request<{ notes: CalendarEvent[]; cards: CalendarEvent[] }>('/calendar');

// DOCUMENTS API
export const apiGetDocuments = async (): Promise<PdfDocument[]> => {
  try {
    const docs = await request<PdfDocument[]>('/documents');
    saveCache('documents', docs);
    return docs;
  } catch (err) {
    const cached = getCache<PdfDocument[]>('documents');
    if (cached) return cached;
    return [];
  }
};

export const apiUploadDocument = async (file: File): Promise<PdfDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  const apiBase = getApiBaseUrl();
  const res = await fetch(`${apiBase}/documents/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Erro ao enviar arquivo' }));
    throw new Error(errorData.error);
  }
  return res.json();
};

export const apiSaveGeneratedPdf = (title: string, base64Data: string, sourceType: 'note_export' | 'kanban_export') =>
  request<PdfDocument>('/documents/save-generated', {
    method: 'POST',
    body: JSON.stringify({ title, base64Data, sourceType }),
  });

export const apiDeleteDocument = (id: number) =>
  request<{ success: boolean; id: number }>(`/documents/${id}`, { method: 'DELETE' });

// TRASH API
export const apiGetTrashItems = async (): Promise<TrashedItem> => {
  try {
    const data = await request<TrashedItem>('/trash');
    saveCache('trash', data);
    return data;
  } catch (err) {
    const cached = getCache<TrashedItem>('trash');
    if (cached) return cached;
    return { notes: [], cards: [] };
  }
};

export const apiRestoreTrashItem = (type: 'note' | 'card', id: number) =>
  request<{ success: boolean }>('/trash/restore', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  });

export const apiEmptyTrash = () => request<{ success: boolean }>('/trash/empty', { method: 'DELETE' });

// WORKOUT API
export const apiGetWorkouts = async (): Promise<WorkoutRoutine[]> => {
  try {
    const workouts = await request<WorkoutRoutine[]>('/workouts');
    saveCache('workouts', workouts);
    return workouts;
  } catch (err) {
    const cached = getCache<WorkoutRoutine[]>('workouts');
    if (cached) return cached;
    return [];
  }
};

export const apiGetSharedWorkout = (id: number) => request<WorkoutRoutine & { author_name?: string }>(`/workouts/shared/${id}`);

export const apiCreateWorkout = async (data: Partial<WorkoutRoutine>): Promise<WorkoutRoutine> => {
  try {
    return await request<WorkoutRoutine>('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (err) {
    enqueueSyncAction('CREATE_WORKOUT', data);
    const mockWorkout: WorkoutRoutine = {
      id: Date.now(),
      user_id: 0,
      title: data.title || '',
      description: data.description,
      days: data.days || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return mockWorkout;
  }
};

export const apiUpdateWorkout = async (id: number, data: Partial<WorkoutRoutine>): Promise<WorkoutRoutine> => {
  try {
    return await request<WorkoutRoutine>(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (err) {
    enqueueSyncAction('UPDATE_WORKOUT', { id, data });
    const mockWorkout: WorkoutRoutine = {
      id,
      user_id: 0,
      title: data.title || '',
      description: data.description,
      days: data.days || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return mockWorkout;
  }
};

export const apiDeleteWorkout = async (id: number): Promise<{ success: boolean }> => {
  try {
    return await request<{ success: boolean }>(`/workouts/${id}`, { method: 'DELETE' });
  } catch (err) {
    enqueueSyncAction('DELETE_WORKOUT', { id });
    return { success: true };
  }
};

// VAULT API
export const apiGetVaultStatus = () => request<{ isConfigured: boolean }>('/vault/status');

export const apiSetupVaultMasterPassword = (masterPassword: string) =>
  request<{ success: boolean }>('/vault/setup', {
    method: 'POST',
    body: JSON.stringify({ masterPassword }),
  });

export const apiUnlockVault = (masterPassword: string) =>
  request<{ success: boolean }>('/vault/unlock', {
    method: 'POST',
    body: JSON.stringify({ masterPassword }),
  });

export const apiGetVaultItems = (masterPassword: string) =>
  request<VaultItem[]>('/vault/items', {
    headers: { 'X-Vault-Password': masterPassword },
  });

export const apiCreateVaultItem = (masterPassword: string, item: Partial<VaultItem>) =>
  request<VaultItem>('/vault/items', {
    method: 'POST',
    headers: { 'X-Vault-Password': masterPassword },
    body: JSON.stringify(item),
  });

export const apiUpdateVaultItem = (masterPassword: string, id: number, item: Partial<VaultItem>) =>
  request<VaultItem>(`/vault/items/${id}`, {
    method: 'PUT',
    headers: { 'X-Vault-Password': masterPassword },
    body: JSON.stringify(item),
  });

export const apiDeleteVaultItem = (masterPassword: string, id: number) =>
  request<{ success: boolean; id: number }>(`/vault/items/${id}`, {
    method: 'DELETE',
    headers: { 'X-Vault-Password': masterPassword },
  });

