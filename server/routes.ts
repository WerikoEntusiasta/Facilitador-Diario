import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { queryAll, queryOne, runQuery, saveDatabase } from './db';

const router = Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, 'doc-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, 'att-' + uniqueSuffix + ext);
  },
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/* =========================================================================
   AUTH & USER MANAGEMENT
   ========================================================================= */

function generateToken(userId: number): string {
  const payload = `${userId}.${Date.now()}`;
  const secret = process.env.JWT_SECRET || 'keepboard-secret-key-2026';
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex').substring(0, 16);
  return Buffer.from(`${payload}.${sig}`).toString('base64');
}

function getUserIdFromReq(req: any): number {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return 1;
    const token = authHeader.split(' ')[1];
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('.');
    if (parts.length >= 2) {
      const uid = parseInt(parts[0], 10);
      if (!isNaN(uid) && uid > 0) return uid;
    }
    return 1;
  } catch (e) {
    return 1;
  }
}

router.post('/auth/register', (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (nome, e-mail e senha)' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado em outra conta' });
    }
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const defaultAvatar =
      avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;

    const result = runQuery(
      'INSERT INTO users (name, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanEmail, password_hash, defaultAvatar]
    );
    const userId = result.lastInsertRowid;
    const user = queryOne('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [userId]);
    const token = generateToken(userId);

    // Create initial labels for new user
    runQuery(
      `INSERT INTO labels (user_id, name, color) VALUES (?, 'Trabalho', '#3b82f6'), (?, 'Pessoal', '#10b981'), (?, 'Urgente', '#ef4444'), (?, 'Estudos', '#8b5cf6')`,
      [userId, userId, userId, userId]
    );

    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const user = queryOne(
      'SELECT id, name, email, avatar, created_at FROM users WHERE email = ? AND password_hash = ?',
      [cleanEmail, password_hash]
    );

    if (!user) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }
    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const user = queryOne('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/auth/profile', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { name, avatar, newPassword } = req.body;

    if (newPassword && newPassword.trim()) {
      const password_hash = crypto.createHash('sha256').update(newPassword.trim()).digest('hex');
      runQuery('UPDATE users SET name = ?, avatar = ?, password_hash = ? WHERE id = ?', [
        name || '',
        avatar || '',
        password_hash,
        userId,
      ]);
    } else {
      runQuery('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name || '', avatar || '', userId]);
    }
    const user = queryOne('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [userId]);
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   LABELS API
   ========================================================================= */

router.get('/labels', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const labels = queryAll('SELECT * FROM labels WHERE user_id = ? ORDER BY name ASC', [userId]);
    res.json(labels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/labels', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da etiqueta é obrigatório' });
    }
    const result = runQuery('INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)', [
      userId,
      name.trim(),
      color || '#3b82f6',
    ]);
    const newLabel = queryOne('SELECT * FROM labels WHERE id = ?', [result.lastInsertRowid]);
    res.json(newLabel);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/labels/:id', (req, res) => {
  try {
    const id = req.params.id;
    runQuery('DELETE FROM note_labels WHERE label_id = ?', [id]);
    runQuery('DELETE FROM card_labels WHERE label_id = ?', [id]);
    runQuery('DELETE FROM labels WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   NOTES API (Keep Style)
   ========================================================================= */

router.post('/notes/attachments/upload', attachmentUpload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const { originalname, filename, size, mimetype } = req.file;
    const url = `/uploads/${filename}`;
    let type = 'other';

    if (mimetype.startsWith('image/')) {
      type = 'image';
    } else if (mimetype === 'application/pdf' || originalname.toLowerCase().endsWith('.pdf')) {
      type = 'pdf';
    } else if (mimetype.startsWith('audio/')) {
      type = 'audio';
    } else if (
      mimetype.includes('document') ||
      mimetype.includes('text') ||
      mimetype.includes('word') ||
      mimetype.includes('sheet') ||
      mimetype.includes('zip') ||
      mimetype.includes('json')
    ) {
      type = 'document';
    }

    res.json({
      id: `att-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: originalname,
      url,
      type,
      size,
      mimeType: mimetype,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notes', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const isArchived = req.query.archived === 'true' ? 1 : 0;
    const isTrashed = req.query.trashed === 'true' ? 1 : 0;
    const labelId = req.query.labelId;

    let sql = 'SELECT * FROM notes WHERE user_id = ? AND is_trashed = ? AND is_archived = ?';
    const params: any[] = [userId, isTrashed, isArchived];

    if (labelId) {
      sql += ' AND id IN (SELECT note_id FROM note_labels WHERE label_id = ?)';
      params.push(labelId);
    }

    sql += ' ORDER BY is_pinned DESC, updated_at DESC';
    const notes = queryAll(sql, params);

    // Attach labels and parse JSON fields for notes
    const notesWithDetails = notes.map((note) => {
      const labels = queryAll(
        'SELECT l.* FROM labels l JOIN note_labels nl ON l.id = nl.label_id WHERE nl.note_id = ?',
        [note.id]
      );
      let parsedChecklist = [];
      try {
        parsedChecklist = JSON.parse(note.checklist || '[]');
      } catch (e) {
        parsedChecklist = [];
      }
      let parsedAttachments = [];
      try {
        parsedAttachments = JSON.parse(note.attachments || '[]');
      } catch (e) {
        parsedAttachments = [];
      }
      return {
        ...note,
        is_pinned: Boolean(note.is_pinned),
        is_archived: Boolean(note.is_archived),
        is_trashed: Boolean(note.is_trashed),
        checklist: parsedChecklist,
        attachments: parsedAttachments,
        labels,
      };
    });

    res.json(notesWithDetails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/notes', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { title, content, checklist, attachments, color, is_pinned, reminder_date, labelIds } = req.body;
    const checklistStr = JSON.stringify(checklist || []);
    const attachmentsStr = JSON.stringify(attachments || []);

    const result = runQuery(
      `INSERT INTO notes (user_id, title, content, checklist, attachments, color, is_pinned, reminder_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, title || '', content || '', checklistStr, attachmentsStr, color || '#ffffff', is_pinned ? 1 : 0, reminder_date || null]
    );

    const noteId = result.lastInsertRowid;

    if (Array.isArray(labelIds)) {
      for (const lId of labelIds) {
        runQuery('INSERT OR IGNORE INTO note_labels (note_id, label_id) VALUES (?, ?)', [noteId, lId]);
      }
    }

    const created = queryOne('SELECT * FROM notes WHERE id = ?', [noteId]);
    const labels = queryAll('SELECT l.* FROM labels l JOIN note_labels nl ON l.id = nl.label_id WHERE nl.note_id = ?', [noteId]);

    res.json({
      ...created,
      is_pinned: Boolean(created.is_pinned),
      is_archived: Boolean(created.is_archived),
      is_trashed: Boolean(created.is_trashed),
      checklist: checklist || [],
      attachments: attachments || [],
      labels,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, checklist, attachments, color, is_pinned, is_archived, is_trashed, reminder_date, labelIds } = req.body;

    const checklistStr = JSON.stringify(checklist || []);
    const attachmentsStr = JSON.stringify(attachments || []);
    const now = new Date().toISOString();

    runQuery(
      `UPDATE notes SET 
        title = ?, content = ?, checklist = ?, attachments = ?, color = ?, 
        is_pinned = ?, is_archived = ?, is_trashed = ?, 
        reminder_date = ?, updated_at = ?
       WHERE id = ?`,
      [
        title || '',
        content || '',
        checklistStr,
        attachmentsStr,
        color || '#ffffff',
        is_pinned ? 1 : 0,
        is_archived ? 1 : 0,
        is_trashed ? 1 : 0,
        reminder_date || null,
        now,
        id,
      ]
    );

    if (Array.isArray(labelIds)) {
      runQuery('DELETE FROM note_labels WHERE note_id = ?', [id]);
      for (const lId of labelIds) {
        runQuery('INSERT OR IGNORE INTO note_labels (note_id, label_id) VALUES (?, ?)', [id, lId]);
      }
    }

    const updated = queryOne('SELECT * FROM notes WHERE id = ?', [id]);
    const labels = queryAll('SELECT l.* FROM labels l JOIN note_labels nl ON l.id = nl.label_id WHERE nl.note_id = ?', [id]);

    let parsedAttachments = [];
    try {
      parsedAttachments = JSON.parse(updated.attachments || '[]');
    } catch (e) {
      parsedAttachments = attachments || [];
    }

    res.json({
      ...updated,
      is_pinned: Boolean(updated.is_pinned),
      is_archived: Boolean(updated.is_archived),
      is_trashed: Boolean(updated.is_trashed),
      checklist: checklist || [],
      attachments: parsedAttachments,
      labels,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notes/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    const note = queryOne('SELECT is_archived FROM notes WHERE id = ?', [id]);
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });

    const nextArchived = note.is_archived ? 0 : 1;
    runQuery('UPDATE notes SET is_archived = ?, is_pinned = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextArchived, id]);
    res.json({ id, is_archived: Boolean(nextArchived) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notes/:id/trash', (req, res) => {
  try {
    const { id } = req.params;
    const note = queryOne('SELECT is_trashed FROM notes WHERE id = ?', [id]);
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });

    const nextTrashed = note.is_trashed ? 0 : 1;
    runQuery('UPDATE notes SET is_trashed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextTrashed, id]);
    res.json({ id, is_trashed: Boolean(nextTrashed) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notes/:id/pin', (req, res) => {
  try {
    const { id } = req.params;
    const note = queryOne('SELECT is_pinned FROM notes WHERE id = ?', [id]);
    if (!note) return res.status(404).json({ error: 'Nota não encontrada' });

    const nextPinned = note.is_pinned ? 0 : 1;
    runQuery('UPDATE notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [nextPinned, id]);
    res.json({ id, is_pinned: Boolean(nextPinned) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    runQuery('DELETE FROM note_labels WHERE note_id = ?', [id]);
    runQuery('DELETE FROM notes WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   KANBAN BOARDS, COLUMNS & CARDS API
   ========================================================================= */

router.get('/boards', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const boards = queryAll('SELECT * FROM kanban_boards WHERE user_id = ? ORDER BY id ASC', [userId]);
    res.json(boards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/boards', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { title, description, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Título do quadro é obrigatório' });
    }

    const result = runQuery(
      'INSERT INTO kanban_boards (user_id, title, description, color) VALUES (?, ?, ?, ?)',
      [userId, title.trim(), description || '', color || '#3b82f6']
    );

    const boardId = result.lastInsertRowid;

    // Create default columns
    runQuery('INSERT INTO kanban_columns (board_id, title, position) VALUES (?, ?, 0)', [boardId, 'A Fazer']);
    runQuery('INSERT INTO kanban_columns (board_id, title, position) VALUES (?, ?, 1)', [boardId, 'Em Progresso']);
    runQuery('INSERT INTO kanban_columns (board_id, title, position) VALUES (?, ?, 2)', [boardId, 'Concluído']);

    const newBoard = queryOne('SELECT * FROM kanban_boards WHERE id = ?', [boardId]);
    res.json(newBoard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/boards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const board = queryOne('SELECT * FROM kanban_boards WHERE id = ?', [id]);
    if (!board) return res.status(404).json({ error: 'Quadro não encontrado' });

    const columns = queryAll('SELECT * FROM kanban_columns WHERE board_id = ? ORDER BY position ASC', [id]);

    const fullColumns = columns.map((col) => {
      const cards = queryAll(
        'SELECT * FROM kanban_cards WHERE column_id = ? AND is_trashed = 0 ORDER BY position ASC, updated_at DESC',
        [col.id]
      );

      const cardsWithDetails = cards.map((card) => {
        const labels = queryAll(
          'SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?',
          [card.id]
        );
        let checklist = [];
        try {
          checklist = JSON.parse(card.checklist || '[]');
        } catch (e) {
          checklist = [];
        }
        return {
          ...card,
          checklist,
          labels,
        };
      });

      return {
        ...col,
        cards: cardsWithDetails,
      };
    });

    res.json({
      ...board,
      columns: fullColumns,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/boards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, color } = req.body;
    runQuery('UPDATE kanban_boards SET title = ?, description = ?, color = ? WHERE id = ?', [
      title || '',
      description || '',
      color || '#3b82f6',
      id,
    ]);
    const updated = queryOne('SELECT * FROM kanban_boards WHERE id = ?', [id]);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/boards/:id', (req, res) => {
  try {
    const { id } = req.params;
    runQuery('DELETE FROM card_labels WHERE card_id IN (SELECT id FROM kanban_cards WHERE board_id = ?)', [id]);
    runQuery('DELETE FROM kanban_cards WHERE board_id = ?', [id]);
    runQuery('DELETE FROM kanban_columns WHERE board_id = ?', [id]);
    runQuery('DELETE FROM kanban_boards WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// COLUMNS
router.post('/columns', (req, res) => {
  try {
    const { board_id, title } = req.body;
    if (!board_id || !title) return res.status(400).json({ error: 'Dados incompletos' });

    const maxPosRes = queryOne('SELECT MAX(position) as maxPos FROM kanban_columns WHERE board_id = ?', [board_id]);
    const nextPos = (maxPosRes?.maxPos ?? -1) + 1;

    const result = runQuery('INSERT INTO kanban_columns (board_id, title, position) VALUES (?, ?, ?)', [
      board_id,
      title.trim(),
      nextPos,
    ]);

    const newCol = queryOne('SELECT * FROM kanban_columns WHERE id = ?', [result.lastInsertRowid]);
    res.json({ ...newCol, cards: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    runQuery('UPDATE kanban_columns SET title = ? WHERE id = ?', [title, id]);
    res.json({ id, title });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    runQuery('DELETE FROM card_labels WHERE card_id IN (SELECT id FROM kanban_cards WHERE column_id = ?)', [id]);
    runQuery('DELETE FROM kanban_cards WHERE column_id = ?', [id]);
    runQuery('DELETE FROM kanban_columns WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CARDS
router.post('/cards', (req, res) => {
  try {
    const { column_id, board_id, title, description, priority, due_date, checklist, labelIds } = req.body;
    if (!column_id || !board_id || !title) return res.status(400).json({ error: 'Dados do cartão incompletos' });

    const maxPosRes = queryOne('SELECT MAX(position) as maxPos FROM kanban_cards WHERE column_id = ?', [column_id]);
    const nextPos = (maxPosRes?.maxPos ?? -1) + 1;

    const result = runQuery(
      `INSERT INTO kanban_cards (column_id, board_id, title, description, priority, due_date, position, checklist) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        column_id,
        board_id,
        title.trim(),
        description || '',
        priority || 'Média',
        due_date || null,
        nextPos,
        JSON.stringify(checklist || []),
      ]
    );

    const cardId = result.lastInsertRowid;

    if (Array.isArray(labelIds)) {
      for (const lId of labelIds) {
        runQuery('INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)', [cardId, lId]);
      }
    }

    const created = queryOne('SELECT * FROM kanban_cards WHERE id = ?', [cardId]);
    const labels = queryAll('SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?', [cardId]);

    res.json({
      ...created,
      checklist: checklist || [],
      labels,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, checklist, labelIds, column_id } = req.body;

    const now = new Date().toISOString();

    runQuery(
      `UPDATE kanban_cards SET 
        title = ?, description = ?, priority = ?, due_date = ?, 
        checklist = ?, column_id = COALESCE(?, column_id), updated_at = ? 
       WHERE id = ?`,
      [
        title || '',
        description || '',
        priority || 'Média',
        due_date || null,
        JSON.stringify(checklist || []),
        column_id || null,
        now,
        id,
      ]
    );

    if (Array.isArray(labelIds)) {
      runQuery('DELETE FROM card_labels WHERE card_id = ?', [id]);
      for (const lId of labelIds) {
        runQuery('INSERT OR IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)', [id, lId]);
      }
    }

    const updated = queryOne('SELECT * FROM kanban_cards WHERE id = ?', [id]);
    const labels = queryAll('SELECT l.* FROM labels l JOIN card_labels cl ON l.id = cl.label_id WHERE cl.card_id = ?', [id]);

    res.json({
      ...updated,
      checklist: checklist || [],
      labels,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/cards/:id/move', (req, res) => {
  try {
    const { id } = req.params;
    const { target_column_id, new_position } = req.body;

    runQuery('UPDATE kanban_cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      target_column_id,
      new_position || 0,
      id,
    ]);

    res.json({ success: true, id, target_column_id, new_position });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    runQuery('DELETE FROM card_labels WHERE card_id = ?', [id]);
    runQuery('DELETE FROM kanban_cards WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   CALENDAR & ICS SYNC API
   ========================================================================= */

router.get('/calendar', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    // Get notes with reminders
    const notesWithReminders = queryAll(
      "SELECT id, title, reminder_date as date, 'note' as type, color FROM notes WHERE user_id = ? AND is_trashed = 0 AND reminder_date IS NOT NULL AND reminder_date != ''",
      [userId]
    );

    // Get kanban cards with due dates
    const cardsWithDueDates = queryAll(
      "SELECT c.id, c.title, c.due_date as date, 'card' as type, c.priority, b.title as board_title FROM kanban_cards c JOIN kanban_boards b ON c.board_id = b.id WHERE b.user_id = ? AND c.is_trashed = 0 AND c.due_date IS NOT NULL AND c.due_date != ''",
      [userId]
    );

    res.json({
      notes: notesWithReminders,
      cards: cardsWithDueDates,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/calendar/ics', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const notes = queryAll(
      "SELECT title, content, reminder_date as date FROM notes WHERE user_id = ? AND is_trashed = 0 AND reminder_date IS NOT NULL AND reminder_date != ''",
      [userId]
    );
    const cards = queryAll(
      "SELECT c.title, c.description, c.due_date as date, b.title as board_title FROM kanban_cards c JOIN kanban_boards b ON c.board_id = b.id WHERE b.user_id = ? AND c.is_trashed = 0 AND c.due_date IS NOT NULL AND c.due_date != ''",
      [userId]
    );

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KeepBoard//Calendario e Lembretes//PT_BR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:KeepBoard Lembretes e Prazos',
    ];

    const formatIcsDate = (dStr: string) => {
      const clean = dStr.replace(/[-:]/g, '').replace('T', 'T');
      if (clean.length === 8) return clean + 'T090000Z'; // default 9am
      if (clean.length === 13) return clean.replace('T', 'T') + '00Z';
      return clean;
    };

    let eventCount = 0;

    for (const note of notes) {
      if (!note.date) continue;
      eventCount++;
      const dateFormatted = formatIcsDate(note.date);
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:note-${eventCount}-${Date.now()}@keepboard.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dateFormatted}`,
        `SUMMARY:[Nota] ${note.title || 'Lembrete'}`,
        `DESCRIPTION:${(note.content || '').replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    for (const card of cards) {
      if (!card.date) continue;
      eventCount++;
      const dateFormatted = formatIcsDate(card.date);
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:card-${eventCount}-${Date.now()}@keepboard.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${dateFormatted}`,
        `SUMMARY:[Kanban: ${card.board_title}] ${card.title}`,
        `DESCRIPTION:${(card.description || '').replace(/\n/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    }

    icsContent.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="keepboard-calendar.ics"');
    res.send(icsContent.join('\r\n'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   PDF DOCUMENT CENTER API
   ========================================================================= */

router.get('/documents', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const docs = queryAll('SELECT * FROM pdf_documents WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents/upload', upload.single('file'), (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado ou formato inválido' });
    }

    const { originalname, filename, path: filePath, size } = req.file;

    const result = runQuery(
      `INSERT INTO pdf_documents (user_id, filename, original_name, file_path, file_size, source_type) 
       VALUES (?, ?, ?, ?, ?, 'upload')`,
      [userId, filename, originalname, filePath, size]
    );

    const created = queryOne('SELECT * FROM pdf_documents WHERE id = ?', [result.lastInsertRowid]);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents/save-generated', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { title, base64Data, sourceType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Dados do PDF em base64 não fornecidos' });
    }

    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const filename = `export-${Date.now()}-${Math.round(Math.random() * 1000)}.pdf`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const result = runQuery(
      `INSERT INTO pdf_documents (user_id, filename, original_name, file_path, file_size, source_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, filename, title ? `${title}.pdf` : filename, filePath, buffer.length, sourceType || 'note_export']
    );

    const created = queryOne('SELECT * FROM pdf_documents WHERE id = ?', [result.lastInsertRowid]);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/documents/:id/file', (req, res) => {
  try {
    const doc = queryOne('SELECT * FROM pdf_documents WHERE id = ?', [req.params.id]);
    if (!doc || !fs.existsSync(doc.file_path)) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(path.resolve(doc.file_path));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const doc = queryOne('SELECT * FROM pdf_documents WHERE id = ?', [id]);
    if (doc && fs.existsSync(doc.file_path)) {
      try {
        fs.unlinkSync(doc.file_path);
      } catch (e) {
        console.error('Erro ao deletar arquivo físico:', e);
      }
    }
    runQuery('DELETE FROM pdf_documents WHERE id = ?', [id]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   TRASH & ARCHIVE MANAGEMENT API
   ========================================================================= */

router.get('/trash', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const trashedNotes = queryAll(
      'SELECT *, "note" as item_type FROM notes WHERE user_id = ? AND is_trashed = 1 ORDER BY updated_at DESC',
      [userId]
    );
    const trashedCards = queryAll(
      'SELECT c.*, "card" as item_type FROM kanban_cards c JOIN kanban_boards b ON c.board_id = b.id WHERE b.user_id = ? AND c.is_trashed = 1 ORDER BY c.updated_at DESC',
      [userId]
    );
    res.json({
      notes: trashedNotes,
      cards: trashedCards,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trash/restore', (req, res) => {
  try {
    const { type, id } = req.body;
    if (type === 'note') {
      runQuery('UPDATE notes SET is_trashed = 0 WHERE id = ?', [id]);
    } else if (type === 'card') {
      runQuery('UPDATE kanban_cards SET is_trashed = 0 WHERE id = ?', [id]);
    }
    res.json({ success: true, type, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/trash/empty', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    runQuery('DELETE FROM note_labels WHERE note_id IN (SELECT id FROM notes WHERE user_id = ? AND is_trashed = 1)', [
      userId,
    ]);
    runQuery('DELETE FROM notes WHERE user_id = ? AND is_trashed = 1', [userId]);
    runQuery(
      'DELETE FROM card_labels WHERE card_id IN (SELECT c.id FROM kanban_cards c JOIN kanban_boards b ON c.board_id = b.id WHERE b.user_id = ? AND c.is_trashed = 1)',
      [userId]
    );
    runQuery(
      'DELETE FROM kanban_cards WHERE id IN (SELECT c.id FROM kanban_cards c JOIN kanban_boards b ON c.board_id = b.id WHERE b.user_id = ? AND c.is_trashed = 1)',
      [userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   WORKOUT ROUTINES API
   ========================================================================= */

router.get('/workouts', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const rows = queryAll('SELECT * FROM workouts WHERE user_id = ? ORDER BY id DESC', [userId]);
    const workouts = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      days: JSON.parse(r.days_json || '[]'),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    res.json(workouts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/workouts/:id', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const id = Number(req.params.id);
    const r = queryOne('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [id, userId]);
    if (!r) {
      return res.status(404).json({ error: 'Treino não encontrado' });
    }
    res.json({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      days: JSON.parse(r.days_json || '[]'),
      created_at: r.created_at,
      updated_at: r.updated_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workouts', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { title, description, days } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }
    const daysJson = JSON.stringify(days || []);
    const result = runQuery(
      'INSERT INTO workouts (user_id, title, description, days_json) VALUES (?, ?, ?, ?)',
      [userId, title, description || '', daysJson]
    );
    const created = queryOne('SELECT * FROM workouts WHERE id = ?', [result.lastInsertRowid]);
    res.status(210).json({
      id: created.id,
      user_id: created.user_id,
      title: created.title,
      description: created.description,
      days: JSON.parse(created.days_json || '[]'),
      created_at: created.created_at,
      updated_at: created.updated_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/workouts/:id', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const id = Number(req.params.id);
    const { title, description, days } = req.body;

    const existing = queryOne('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Treino não encontrado' });
    }

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedDaysJson = days !== undefined ? JSON.stringify(days) : existing.days_json;

    runQuery(
      'UPDATE workouts SET title = ?, description = ?, days_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [updatedTitle, updatedDesc, updatedDaysJson, id, userId]
    );

    const updated = queryOne('SELECT * FROM workouts WHERE id = ?', [id]);
    res.json({
      id: updated.id,
      user_id: updated.user_id,
      title: updated.title,
      description: updated.description,
      days: JSON.parse(updated.days_json || '[]'),
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/workouts/:id', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const id = Number(req.params.id);
    runQuery('DELETE FROM workouts WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   PASSWORD VAULT (COFRE DE SENHAS - 16 CHARS)
   ========================================================================= */

function hashMasterPassword(password: string): string {
  return crypto.createHash('sha256').update(`vault-salt-${password}`).digest('hex');
}

function verifyVaultPassword(req: any, res: any): boolean {
  const userId = getUserIdFromReq(req);
  const masterPassword = req.headers['x-vault-password'];
  if (!masterPassword || typeof masterPassword !== 'string') {
    res.status(401).json({ error: 'Senha mestra não fornecida' });
    return false;
  }
  const setting = queryOne('SELECT master_password_hash FROM vault_settings WHERE user_id = ?', [userId]);
  if (!setting) {
    res.status(400).json({ error: 'Cofre ainda não foi configurado' });
    return false;
  }
  const hash = hashMasterPassword(masterPassword);
  if (hash !== setting.master_password_hash) {
    res.status(403).json({ error: 'Senha mestra incorreta' });
    return false;
  }
  return true;
}

router.get('/vault/status', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const setting = queryOne('SELECT user_id FROM vault_settings WHERE user_id = ?', [userId]);
    res.json({ isConfigured: Boolean(setting) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vault/setup', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { masterPassword } = req.body;
    if (!masterPassword || typeof masterPassword !== 'string') {
      return res.status(400).json({ error: 'Senha mestra é obrigatória' });
    }
    if (masterPassword.length < 16) {
      return res.status(400).json({ error: 'A senha mestra precisa ter no mínimo 16 caracteres' });
    }

    const hash = hashMasterPassword(masterPassword);
    runQuery(
      `INSERT INTO vault_settings (user_id, master_password_hash) VALUES (?, ?) 
       ON CONFLICT(user_id) DO UPDATE SET master_password_hash = excluded.master_password_hash`,
      [userId, hash]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vault/unlock', (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { masterPassword } = req.body;
    if (!masterPassword) {
      return res.status(400).json({ error: 'Informe a senha mestra de 16 caracteres' });
    }

    const setting = queryOne('SELECT master_password_hash FROM vault_settings WHERE user_id = ?', [userId]);
    if (!setting) {
      return res.status(400).json({ error: 'O Cofre de Senhas ainda não foi configurado' });
    }

    const hash = hashMasterPassword(masterPassword);
    if (hash !== setting.master_password_hash) {
      return res.status(401).json({ error: 'Senha mestra incorreta! Verifique os caracteres e tente novamente.' });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vault/items', (req, res) => {
  try {
    if (!verifyVaultPassword(req, res)) return;
    const userId = getUserIdFromReq(req);
    const items = queryAll('SELECT * FROM vault_items WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    const formattedItems = items.map((item) => {
      let docData = {};
      try {
        docData = JSON.parse(item.doc_data || '{}');
      } catch (e) {
        docData = {};
      }
      let attachments = [];
      try {
        attachments = JSON.parse(item.attachments || '[]');
      } catch (e) {
        attachments = [];
      }
      return {
        ...item,
        doc_type: item.doc_type || 'credential',
        doc_data: docData,
        attachments,
      };
    });

    res.json(formattedItems);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vault/items', (req, res) => {
  try {
    if (!verifyVaultPassword(req, res)) return;
    const userId = getUserIdFromReq(req);
    const { app_name, category, username_email, password, url, notes, doc_type, doc_data, attachments } = req.body;

    if (!app_name) {
      return res.status(400).json({ error: 'Nome do item ou documento é obrigatório' });
    }

    const docTypeStr = doc_type || 'credential';
    const docDataStr = JSON.stringify(doc_data || {});
    const attachmentsStr = JSON.stringify(attachments || []);

    const result = runQuery(
      `INSERT INTO vault_items (user_id, app_name, category, username_email, password, url, notes, doc_type, doc_data, attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        app_name.trim(),
        category || 'Geral',
        (username_email || '').trim(),
        password || '',
        url || '',
        notes || '',
        docTypeStr,
        docDataStr,
        attachmentsStr,
      ]
    );

    const created = queryOne('SELECT * FROM vault_items WHERE id = ?', [result.lastInsertRowid]);
    res.json({
      ...created,
      doc_type: created.doc_type || 'credential',
      doc_data: doc_data || {},
      attachments: attachments || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vault/items/:id', (req, res) => {
  try {
    if (!verifyVaultPassword(req, res)) return;
    const userId = getUserIdFromReq(req);
    const id = Number(req.params.id);
    const { app_name, category, username_email, password, url, notes, doc_type, doc_data, attachments } = req.body;

    const existing = queryOne('SELECT * FROM vault_items WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Item não encontrado no cofre' });
    }

    const docTypeStr = doc_type !== undefined ? doc_type : existing.doc_type || 'credential';
    const docDataStr = doc_data !== undefined ? JSON.stringify(doc_data) : existing.doc_data || '{}';
    const attachmentsStr = attachments !== undefined ? JSON.stringify(attachments) : existing.attachments || '[]';

    runQuery(
      `UPDATE vault_items SET app_name = ?, category = ?, username_email = ?, password = ?, url = ?, notes = ?, doc_type = ?, doc_data = ?, attachments = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        app_name !== undefined ? app_name : existing.app_name,
        category !== undefined ? category : existing.category,
        username_email !== undefined ? username_email : existing.username_email,
        password !== undefined ? password : existing.password,
        url !== undefined ? url : existing.url,
        notes !== undefined ? notes : existing.notes,
        docTypeStr,
        docDataStr,
        attachmentsStr,
        id,
        userId,
      ]
    );

    const updated = queryOne('SELECT * FROM vault_items WHERE id = ?', [id]);
    let parsedDocData = {};
    try {
      parsedDocData = JSON.parse(updated.doc_data || '{}');
    } catch (e) {
      parsedDocData = doc_data || {};
    }
    let parsedAttachments = [];
    try {
      parsedAttachments = JSON.parse(updated.attachments || '[]');
    } catch (e) {
      parsedAttachments = attachments || [];
    }

    res.json({
      ...updated,
      doc_type: updated.doc_type || 'credential',
      doc_data: parsedDocData,
      attachments: parsedAttachments,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vault/items/:id', (req, res) => {
  try {
    if (!verifyVaultPassword(req, res)) return;
    const userId = getUserIdFromReq(req);
    const id = Number(req.params.id);

    runQuery('DELETE FROM vault_items WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   ANDROID APK PACKAGE ROUTE
   ========================================================================= */


router.get('/android/build-info', (req, res) => {
  res.json({
    appName: 'KeepBoard Android',
    packageName: 'com.keepboard.app',
    version: '1.0.0',
    buildType: 'Capacitor / PWA WebAPK',
    dbSupport: 'SQLite (database.db)',
    syncServerUrl: req.protocol + '://' + req.get('host'),
    downloadInstructions: 'https://bubblewrap.dev / Capacitor CLI / Google Chrome Android WebAPK',
  });
});

export default router;

