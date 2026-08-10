import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'database.db');

export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  createSchema(dbInstance);
  saveDatabase();
  return dbInstance;
}

export function getDb(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

function safeAddColumn(db: Database, table: string, columnDef: string) {
  try {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
  } catch (err) {
    // Column likely already exists
  }
}

function createSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6b7280'
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      checklist TEXT DEFAULT '[]',
      color TEXT DEFAULT '#ffffff',
      is_pinned INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_trashed INTEGER DEFAULT 0,
      reminder_date TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS note_labels (
      note_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS kanban_boards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#3b82f6',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kanban_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS kanban_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_id INTEGER NOT NULL,
      board_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      checklist TEXT DEFAULT '[]',
      priority TEXT DEFAULT 'Média',
      due_date TEXT DEFAULT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_trashed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS card_labels (
      card_id INTEGER NOT NULL,
      label_id INTEGER NOT NULL,
      PRIMARY KEY (card_id, label_id)
    );

    CREATE TABLE IF NOT EXISTS pdf_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT DEFAULT 'application/pdf',
      source_type TEXT DEFAULT 'upload',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      days_json TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure user_id column exists on existing databases
  safeAddColumn(db, 'labels', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'notes', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'kanban_boards', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'pdf_documents', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'workouts', 'user_id INTEGER DEFAULT 1');

  // Seed default user if empty
  const userCheck = db.exec('SELECT COUNT(*) as count FROM users');
  if (userCheck.length === 0 || (userCheck[0].values[0][0] as number) === 0) {
    const defaultPasswordHash = crypto.createHash('sha256').update('123456').digest('hex');
    db.run(
      `INSERT INTO users (id, name, email, password_hash, avatar) VALUES (1, 'Usuário Demo', 'demo@keepboard.app', ?, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')`,
      [defaultPasswordHash]
    );
  }

  // Seed default data if empty
  const labelCheck = db.exec('SELECT COUNT(*) as count FROM labels');
  if (labelCheck.length === 0 || (labelCheck[0].values[0][0] as number) === 0) {
    db.run(`INSERT INTO labels (user_id, name, color) VALUES (1, 'Trabalho', '#3b82f6'), (1, 'Pessoal', '#10b981'), (1, 'Urgente', '#ef4444'), (1, 'Estudos', '#8b5cf6')`);
  }

  const boardCheck = db.exec('SELECT COUNT(*) as count FROM kanban_boards');
  if (boardCheck.length === 0 || (boardCheck[0].values[0][0] as number) === 0) {
    db.run(`INSERT INTO kanban_boards (user_id, title, description, color) VALUES (1, 'Meu Primeiro Quadro', 'Quadro de tarefas padrão', '#3b82f6')`);
    
    // Add columns for board 1
    db.run(`INSERT INTO kanban_columns (board_id, title, position) VALUES 
      (1, 'A Fazer', 0),
      (1, 'Em Progresso', 1),
      (1, 'Revisão', 2),
      (1, 'Concluído', 3)
    `);

    // Add sample cards
    db.run(`INSERT INTO kanban_cards (column_id, board_id, title, description, priority, due_date, position) VALUES
      (1, 1, 'Configurar ambiente de trabalho', 'Instalar dependências e validar configurações do projeto.', 'Alta', '${new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]}', 0),
      (2, 1, 'Desenvolver protótipo Keep & Kanban', 'Criar os componentes interativos do frontend com Tailwind CSS.', 'Urgente', '${new Date().toISOString().split('T')[0]}', 0),
      (4, 1, 'Planejamento inicial', 'Definição da arquitetura e esquema do banco SQLite.', 'Média', '${new Date(Date.now() - 86400000).toISOString().split('T')[0]}', 0)
    `);
  }

  const noteCheck = db.exec('SELECT COUNT(*) as count FROM notes');
  if (noteCheck.length === 0 || (noteCheck[0].values[0][0] as number) === 0) {
    const today = new Date().toISOString().split('T')[0];
    db.run(`INSERT INTO notes (user_id, title, content, checklist, color, is_pinned, reminder_date) VALUES 
      (1, 'Bem-vindo ao KeepBoard!', 'Sua aplicação completa de notas, quadros Kanban e documentos em PDF com SQLite local.', '[]', '#eff6ff', 1, '${today}T14:00'),
      (1, 'Lista de Compras da Semana', '', '[{"id":"1","text":"Pão integral","completed":true},{"id":"2","text":"Café especial","completed":false},{"id":"3","text":"Frutas frescas","completed":false}]', '#fef3c7', 0, NULL)
    `);
  }

  const workoutCheck = db.exec('SELECT COUNT(*) as count FROM workouts');
  if (workoutCheck.length === 0 || (workoutCheck[0].values[0][0] as number) === 0) {
    const sampleWorkout = [
      {
        id: 'day-1',
        day_name: 'Segunda-feira',
        subtitle: 'Treino A - Peito, Tríceps e Ombros (Push)',
        exercises: [
          { id: 'ex-1', name: 'Supino Reto com Barra', sets: '4', reps: '8-10', weight: '30kg cada lado', notes: 'Manter a escapula retraída', completed: true },
          { id: 'ex-2', name: 'Supino Inclinado com Halteres', sets: '3', reps: '10-12', weight: '22kg', notes: 'Foco na porção superior do peito', completed: true },
          { id: 'ex-3', name: 'Desenvolvimento de Ombros com Halteres', sets: '4', reps: '10', weight: '16kg', notes: 'Controle na descida', completed: false },
          { id: 'ex-4', name: 'Elevação Lateral na Polia', sets: '4', reps: '12-15', weight: '7.5kg', notes: 'Pausa de 1s no topo', completed: false },
          { id: 'ex-5', name: 'Tríceps Pulley na Corda', sets: '4', reps: '12', weight: '25kg', notes: 'Abrir a corda no final da extensão', completed: false }
        ]
      },
      {
        id: 'day-2',
        day_name: 'Terça-feira',
        subtitle: 'Treino B - Costas, Bíceps e Trapézio (Pull)',
        exercises: [
          { id: 'ex-6', name: 'Puxada Alta Aberta', sets: '4', reps: '10-12', weight: '50kg', notes: 'Puxar até a altura do peito', completed: false },
          { id: 'ex-7', name: 'Remada Curvada com Barra', sets: '4', reps: '8-10', weight: '25kg cada lado', notes: 'Coluna ereta e abdômen contraído', completed: false },
          { id: 'ex-8', name: 'Remada Baixa no Triângulo', sets: '3', reps: '12', weight: '45kg', notes: 'Esmagar as costas no final', completed: false },
          { id: 'ex-9', name: 'Rosca Direta com Barra W', sets: '4', reps: '10-12', weight: '10kg cada lado', notes: 'Sem roubar com a coluna', completed: false },
          { id: 'ex-10', name: 'Rosca Martelo com Halteres', sets: '3', reps: '12', weight: '14kg', notes: 'Foco no braquiorradial', completed: false }
        ]
      },
      {
        id: 'day-3',
        day_name: 'Quarta-feira',
        subtitle: 'Descanso Ativo / Cardio & Mobilidade',
        is_rest_day: true,
        exercises: [
          { id: 'ex-11', name: 'Esteira / Caminhada Moderada', sets: '1', reps: '30 a 45 min', weight: 'Inclinado 5%', notes: 'Manter bpm em torno de 120-130', completed: false },
          { id: 'ex-12', name: 'Mobilidade de Quadril e Tornozelos', sets: '3', reps: '10 repetições', weight: 'Peso do corpo', notes: 'Preparação para treino de pernas', completed: false }
        ]
      },
      {
        id: 'day-4',
        day_name: 'Quinta-feira',
        subtitle: 'Treino C - Quadríceps, Posterior e Panturrilhas (Legs)',
        exercises: [
          { id: 'ex-13', name: 'Agachamento Livre com Barra', sets: '4', reps: '8-10', weight: '35kg cada lado', notes: 'Descer além de 90 graus', completed: false },
          { id: 'ex-14', name: 'Leg Press 45°', sets: '4', reps: '10-12', weight: '160kg', notes: 'Pés na largura do quadril', completed: false },
          { id: 'ex-15', name: 'Cadeira Extensora', sets: '3', reps: '12-15', weight: '40kg', notes: 'Pausa de 2s no topo', completed: false },
          { id: 'ex-16', name: 'Mesa Flexora (Posterior)', sets: '4', reps: '10-12', weight: '35kg', notes: 'Controle na fase excêntrica', completed: false },
          { id: 'ex-17', name: 'Gêmeos em Pé (Panturrilha)', sets: '5', reps: '15-20', weight: '60kg', notes: 'Amplitude máxima', completed: false }
        ]
      },
      {
        id: 'day-5',
        day_name: 'Sexta-feira',
        subtitle: 'Treino D - Ombros, Abdômen e Cardio High-Volume',
        exercises: [
          { id: 'ex-18', name: 'Desenvolvimento Arnold com Halteres', sets: '4', reps: '10', weight: '14kg', notes: 'Rotação suave dos punhos', completed: false },
          { id: 'ex-19', name: 'Elevação Frontal na Polia', sets: '3', reps: '12', weight: '10kg', notes: 'Uso da corda na polia baixa', completed: false },
          { id: 'ex-20', name: 'Crucifixo Invertido na Máquina', sets: '4', reps: '12-15', weight: '30kg', notes: 'Foco no deltoide posterior', completed: false },
          { id: 'ex-21', name: 'Abdominal Infra na Barra Fixa', sets: '4', reps: '15', weight: 'Peso do corpo', notes: 'Elevação de joelhos ou pernas estendidas', completed: false }
        ]
      },
      {
        id: 'day-6',
        day_name: 'Sábado',
        subtitle: 'Treino E - Correção de Pontos Fracos / Braços e Core',
        exercises: [
          { id: 'ex-22', name: 'Super-série: Rosca Scott + Tríceps Testa', sets: '4', reps: '10-12', weight: 'Moderação', notes: 'Executar sem descanso entre os exercícios', completed: false },
          { id: 'ex-23', name: 'Prancha Abdominal Isometrica', sets: '3', reps: '60 segundos', weight: 'Peso do corpo', notes: 'Manter glúteos e core bem firmes', completed: false }
        ]
      },
      {
        id: 'day-7',
        day_name: 'Domingo',
        subtitle: 'Descanso Total e Recuperação',
        is_rest_day: true,
        exercises: []
      }
    ];

    db.run(
      `INSERT INTO workouts (user_id, title, description, days_json) VALUES (1, ?, ?, ?)`,
      ['Rotina Semanal Hipertrofia (ABCD)', 'Programa semanal completo de musculação e condicionamento físico.', JSON.stringify(sampleWorkout)]
    );
  }
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const items = queryAll<T>(sql, params);
  return items.length > 0 ? items[0] : null;
}

export function runQuery(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const db = getDb();
  db.run(sql, params);
  const lastIdRes = db.exec('SELECT last_insert_rowid() as id');
  const lastId = lastIdRes.length > 0 && lastIdRes[0].values.length > 0 ? (lastIdRes[0].values[0][0] as number) : 0;
  saveDatabase();
  return { lastInsertRowid: lastId, changes: 1 };
}
