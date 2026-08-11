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

export function getServerUrl(): string {
  const saved = (localStorage.getItem('kb_server_url') || '').trim().replace(/\/+$/, '');
  if (saved && isLocalhostUrl(saved)) {
    localStorage.removeItem('kb_server_url');
    return '';
  }
  return saved;
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

export const DEFAULT_PRODUCTION_API = 'https://ais-dev-l4g4u7bqaz6ibo5byvyh7i-215070016480.us-east5.run.app/api';

export function getApiBaseUrl(): string {
  const customUrl = getServerUrl();
  if (customUrl) {
    if (isLocalhostUrl(customUrl)) {
      throw new Error('Localhost é proibido. Por favor, configure um Servidor Remoto válido.');
    }
    return `${customUrl}/api`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    if (protocol === 'capacitor:' || protocol === 'file:') {
      return DEFAULT_PRODUCTION_API;
    }
  }
  if (!isCurrentOriginLocalhost()) {
    return '/api';
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

export const apiGetMe = () => request<User>('/auth/me');

export const apiUpdateProfile = (data: { name?: string; avatar?: string; newPassword?: string }) =>
  request<User>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// LABELS API
export const apiGetLabels = () => request<Label[]>('/labels');
export const apiCreateLabel = (name: string, color: string) =>
  request<Label>('/labels', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
export const apiDeleteLabel = (id: number) =>
  request<{ success: boolean }>(`/labels/${id}`, { method: 'DELETE' });

// NOTES API
export const apiGetNotes = (archived = false, trashed = false, labelId?: number) => {
  let url = `/notes?archived=${archived}&trashed=${trashed}`;
  if (labelId) url += `&labelId=${labelId}`;
  return request<Note[]>(url);
};

export const apiCreateNote = (note: Partial<Note> & { labelIds?: number[] }) =>
  request<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });

export const apiUpdateNote = (id: number, note: Partial<Note> & { labelIds?: number[] }) =>
  request<Note>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(note),
  });

export const apiToggleArchiveNote = (id: number) =>
  request<{ id: number; is_archived: boolean }>(`/notes/${id}/archive`, { method: 'PATCH' });

export const apiToggleTrashNote = (id: number) =>
  request<{ id: number; is_trashed: boolean }>(`/notes/${id}/trash`, { method: 'PATCH' });

export const apiTogglePinNote = (id: number) =>
  request<{ id: number; is_pinned: boolean }>(`/notes/${id}/pin`, { method: 'PATCH' });

export const apiDeleteNotePermanently = (id: number) =>
  request<{ success: boolean; id: number }>(`/notes/${id}`, { method: 'DELETE' });

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
export const apiGetBoards = () => request<KanbanBoard[]>('/boards');
export const apiGetBoardDetails = (id: number) => request<KanbanBoard>(`/boards/${id}`);
export const apiCreateBoard = (board: { title: string; description?: string; color?: string }) =>
  request<KanbanBoard>('/boards', {
    method: 'POST',
    body: JSON.stringify(board),
  });
export const apiUpdateBoard = (id: number, board: { title: string; description?: string; color?: string }) =>
  request<KanbanBoard>(`/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(board),
  });
export const apiDeleteBoard = (id: number) =>
  request<{ success: boolean; id: number }>(`/boards/${id}`, { method: 'DELETE' });

export const apiCreateColumn = (board_id: number, title: string) =>
  request<KanbanColumn>('/columns', {
    method: 'POST',
    body: JSON.stringify({ board_id, title }),
  });
export const apiUpdateColumn = (id: number, title: string) =>
  request<{ id: number; title: string }>(`/columns/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
export const apiDeleteColumn = (id: number) =>
  request<{ success: boolean; id: number }>(`/columns/${id}`, { method: 'DELETE' });

export const apiCreateCard = (card: Partial<KanbanCard> & { labelIds?: number[] }) =>
  request<KanbanCard>('/cards', {
    method: 'POST',
    body: JSON.stringify(card),
  });
export const apiSaveCard = apiCreateCard;
export const apiUpdateCard = (id: number, card: Partial<KanbanCard> & { labelIds?: number[] }) =>
  request<KanbanCard>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(card),
  });
export const apiMoveCard = (id: number, target_column_id: number, new_position: number) =>
  request<{ success: boolean }>(`/cards/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ target_column_id, new_position }),
  });
export const apiDeleteCard = (id: number) =>
  request<{ success: boolean; id: number }>(`/cards/${id}`, { method: 'DELETE' });

// CALENDAR API
export const apiGetCalendarEvents = () => request<{ notes: CalendarEvent[]; cards: CalendarEvent[] }>('/calendar');

// DOCUMENTS API
export const apiGetDocuments = () => request<PdfDocument[]>('/documents');

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
export const apiGetTrashItems = () => request<TrashedItem>('/trash');
export const apiRestoreTrashItem = (type: 'note' | 'card', id: number) =>
  request<{ success: boolean }>('/trash/restore', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  });
export const apiEmptyTrash = () => request<{ success: boolean }>('/trash/empty', { method: 'DELETE' });

// WORKOUT API
export const apiGetWorkouts = () => request<WorkoutRoutine[]>('/workouts');
export const apiGetSharedWorkout = (id: number) => request<WorkoutRoutine & { author_name?: string }>(`/workouts/shared/${id}`);
export const apiCreateWorkout = (data: Partial<WorkoutRoutine>) =>
  request<WorkoutRoutine>('/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const apiUpdateWorkout = (id: number, data: Partial<WorkoutRoutine>) =>
  request<WorkoutRoutine>(`/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const apiDeleteWorkout = (id: number) =>
  request<{ success: boolean }>(`/workouts/${id}`, { method: 'DELETE' });

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

