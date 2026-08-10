export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'pdf' | 'document' | 'audio' | 'other';
  size?: number;
  mimeType?: string;
  created_at?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  attachments?: NoteAttachment[];
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  reminder_date: string | null;
  created_at: string;
  updated_at: string;
  labels: Label[];
}

export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';

export interface KanbanCard {
  id: number;
  column_id: number;
  board_id: number;
  title: string;
  description: string;
  checklist: ChecklistItem[];
  priority: Priority;
  due_date: string | null;
  position: number;
  is_trashed?: boolean;
  created_at: string;
  updated_at: string;
  labels: Label[];
}

export interface KanbanColumn {
  id: number;
  board_id: number;
  title: string;
  position: number;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: number;
  title: string;
  description: string;
  color: string;
  created_at: string;
  columns?: KanbanColumn[];
}

export interface PdfDocument {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  source_type: 'upload' | 'note_export' | 'kanban_export';
  created_at: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: 'note' | 'card';
  color?: string;
  priority?: Priority;
  board_title?: string;
  content?: string;
}

export interface TrashedItem {
  notes: Note[];
  cards: KanbanCard[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes?: string;
  completed?: boolean;
}

export interface WorkoutDay {
  id: string;
  day_name: string; // e.g. "Segunda-feira", "Treino A"
  subtitle?: string; // e.g. "Peito e Tríceps"
  is_rest_day?: boolean;
  exercises: Exercise[];
}

export interface WorkoutRoutine {
  id: number;
  user_id?: number;
  title: string;
  description?: string;
  days: WorkoutDay[];
  created_at?: string;
  updated_at?: string;
}

export interface VaultItem {
  id: number;
  user_id?: number;
  app_name: string;
  category: string;
  username_email: string;
  password: string;
  url?: string;
  notes?: string;
  doc_type?: 'rg' | 'cpf' | 'cnh' | 'titulo_eleitor' | 'passaporte' | 'outro' | 'credential';
  doc_data?: Record<string, string>;
  attachments?: NoteAttachment[];
  created_at?: string;
  updated_at?: string;
}

export type ViewTab = 'notes' | 'kanban' | 'calendar' | 'workouts' | 'pdfs' | 'vault' | 'archive' | 'trash';

