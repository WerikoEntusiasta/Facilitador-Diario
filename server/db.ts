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
      is_admin INTEGER DEFAULT 0,
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
      attachments TEXT DEFAULT '[]',
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

    CREATE TABLE IF NOT EXISTS fart_triggers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      acknowledged INTEGER DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS vault_settings (
      user_id INTEGER PRIMARY KEY,
      master_password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vault_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      app_name TEXT NOT NULL,
      category TEXT DEFAULT 'Geral',
      username_email TEXT NOT NULL,
      password TEXT NOT NULL,
      url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      doc_type TEXT DEFAULT 'credential',
      doc_data TEXT DEFAULT '{}',
      attachments TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fasting_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER DEFAULT 1,
      target_hours INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      protocol_name TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      water_ml INTEGER DEFAULT 0,
      water_goal INTEGER DEFAULT 2000,
      water_history TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gps_activities (
      id TEXT PRIMARY KEY,
      user_id INTEGER DEFAULT 1,
      activity_type TEXT DEFAULT 'caminhada',
      title TEXT DEFAULT 'Atividade GPS',
      date TEXT NOT NULL,
      total_steps INTEGER DEFAULT 0,
      total_calories INTEGER DEFAULT 0,
      total_distance_km REAL DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      avg_speed_kmh REAL DEFAULT 0,
      max_speed_kmh REAL DEFAULT 0,
      avg_pace_min_km REAL DEFAULT 0,
      route_points_json TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure columns exist on existing databases
  safeAddColumn(db, 'users', 'is_admin INTEGER DEFAULT 0');
  safeAddColumn(db, 'labels', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'notes', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'notes', "attachments TEXT DEFAULT '[]'");
  safeAddColumn(db, 'kanban_boards', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'pdf_documents', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'workouts', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'workouts', 'share_code TEXT');
  safeAddColumn(db, 'vault_items', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'vault_items', "doc_type TEXT DEFAULT 'credential'");
  safeAddColumn(db, 'vault_items', "doc_data TEXT DEFAULT '{}'");
  safeAddColumn(db, 'vault_items', "attachments TEXT DEFAULT '[]'");
  safeAddColumn(db, 'fasting_sessions', 'user_id INTEGER DEFAULT 1');
  safeAddColumn(db, 'gps_activities', 'user_id INTEGER DEFAULT 1');

  // Clean up any old demo user if exists
  try {
    db.run("DELETE FROM users WHERE email = 'demo@keepboard.app'");
  } catch (e) {
    // Ignore if table/user not present
  }

  // Seed default Admin Account if it doesn't exist or update password/email if env changes
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@keepflow.com').trim().toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminPassHash = crypto.pbkdf2Sync(adminPass, 'keepflow-salt-2026', 10000, 64, 'sha512').toString('hex');
    const adminCheck = db.exec(`SELECT id FROM users WHERE email = '${adminEmail}'`);
    if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
      const adminAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      db.run(
        `INSERT INTO users (name, email, password_hash, avatar, is_admin) VALUES (?, ?, ?, ?, 1)`,
        ['Administrador Master', adminEmail, adminPassHash, adminAvatar]
      );
    } else {
      db.run(`UPDATE users SET is_admin = 1, password_hash = ? WHERE email = ?`, [adminPassHash, adminEmail]);
    }
  } catch (e) {
    console.error('Error seeding admin user:', e);
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
      `INSERT INTO workouts (user_id, title, description, days_json, share_code) VALUES (1, ?, ?, ?, ?)`,
      ['Rotina Semanal Hipertrofia (ABCD)', 'Programa semanal completo de musculação e condicionamento físico.', JSON.stringify(sampleWorkout), 'TRN-8A9K2']
    );
  }

  // Ensure all existing workouts have a unique share_code
  try {
    const unseededWorkouts = db.exec('SELECT id FROM workouts WHERE share_code IS NULL OR share_code = ""');
    if (unseededWorkouts.length > 0 && unseededWorkouts[0].values.length > 0) {
      for (const row of unseededWorkouts[0].values) {
        const id = row[0] as number;
        const code = generateWorkoutShareCode();
        db.run('UPDATE workouts SET share_code = ? WHERE id = ?', [code, id]);
      }
    }
  } catch (e) {
    // Ignore
  }
}

export function generateWorkoutShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TRN-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
