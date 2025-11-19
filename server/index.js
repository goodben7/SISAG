import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './db.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();

// CORS configuration: support multiple origins, proper preflight headers, and 200 for OPTIONS
const rawOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '*';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);

const corsOptions = {
  origin: (allowedOrigins.length === 1 && allowedOrigins[0] === '*') ? '*' : allowedOrigins,
  methods: ['GET','HEAD','PUT','PATCH','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Global OPTIONS preflight handler for Express 5 (no wildcard route support)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    const allowOrigin = (allowedOrigins.length === 1 && allowedOrigins[0] === '*') ? '*' : (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*');
    res.header('Access-Control-Allow-Origin', allowOrigin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.status(corsOptions.optionsSuccessStatus).end();
  } else {
    next();
  }
});
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });

const getProfileById = (id) => db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);

const requireAuth = (req, res, next) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    const profile = getProfileById(req.userId);
    req.userRole = profile?.role || 'citizen';
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.userRole)) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Auth
app.post('/auth/signup', (req, res) => {
  const { email, password, full_name, role = 'citizen', organization = null, province = null, phone = null } = req.body || {};
  if (!email || !password || !full_name) return res.status(400).json({ error: 'Missing required fields' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(400).json({ error: 'Email already in use' });

  const id = crypto.randomUUID();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, password_hash);
  db.prepare('INSERT INTO profiles (id, full_name, role, organization, province, phone) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, full_name, role, organization, province, phone);
  const token = signToken(id);
  const profile = getProfileById(id);
  res.json({ token, user: { id, email }, profile });
});

app.post('/auth/signin', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = signToken(user.id);
  const profile = getProfileById(user.id);
  res.json({ token, user: { id: user.id, email: user.email }, profile });
});

app.get('/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.userId);
  const profile = getProfileById(req.userId);
  res.json({ user, profile });
});

// Projects
app.get('/projects', (req, res) => {
  const { province, sector, status } = req.query;
  let sql = 'SELECT * FROM projects';
  const clauses = [];
  const params = [];
  if (province) { clauses.push('province = ?'); params.push(province); }
  if (sector) { clauses.push('sector = ?'); params.push(sector); }
  if (status) { clauses.push('status = ?'); params.push(status); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params).map(r => ({ ...r, images: JSON.parse(r.images || '[]') }));
  res.json(rows);
});

app.post('/projects', requireAuth, requireRole(['government','partner']), (req, res) => {
  const p = req.body || {};
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO projects (
    id, title, description, sector, status, budget, spent, province, city,
    latitude, longitude, start_date, end_date, actual_end_date, ministry,
    responsible_person, images, created_by
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      id, p.title, p.description, p.sector, p.status || 'planned', Number(p.budget || 0), Number(p.spent || 0), p.province, p.city,
      p.latitude ?? null, p.longitude ?? null, p.start_date, p.end_date, p.actual_end_date ?? null, p.ministry,
      p.responsible_person, JSON.stringify(p.images || []), req.userId
    );
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  row.images = JSON.parse(row.images || '[]');
  res.json(row);
});

// Alerts
app.get('/alerts', (req, res) => {
  const rows = db.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

app.post('/alerts', requireAuth, requireRole(['government','partner']), (req, res) => {
  const a = req.body || {};
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO alerts (id, project_id, type, severity, message, is_read, user_id)
    VALUES (?, ?, ?, ?, ?, 0, ?)`)
    .run(id, a.project_id, a.type, a.severity, a.message, req.userId);
  const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  res.json(row);
});

// Reports
app.get('/reports', requireAuth, (req, res) => {
  const { mine } = req.query;
  let sql = 'SELECT * FROM reports';
  let params = [];
  if (mine === 'true') { sql += ' WHERE reporter_id = ?'; params = [req.userId]; }
  sql += ' ORDER BY created_at DESC LIMIT 100';
  const rows = db.prepare(sql).all(...params).map(r => ({ ...r, images: JSON.parse(r.images || '[]') }));
  res.json(rows);
});

app.post('/reports', requireAuth, (req, res) => {
  const r = req.body || {};
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO reports (
    id, project_id, title, description, category, status, latitude, longitude, images, reporter_id, assigned_to, resolution_notes
  ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`)
    .run(
      id, r.project_id ?? null, r.title, r.description, r.category,
      r.latitude ?? null, r.longitude ?? null, JSON.stringify(r.images || []), req.userId, r.assigned_to ?? null, r.resolution_notes ?? null
    );
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  row.images = JSON.parse(row.images || '[]');
  res.json(row);
});

// Collaborative: profiles, events, messages
app.get('/profiles', requireAuth, requireRole(['government','partner']), (req, res) => {
  const rows = db.prepare('SELECT * FROM profiles').all();
  res.json(rows);
});

app.get('/events', requireAuth, requireRole(['government','partner']), (req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY start_time ASC').all().map(e => ({ ...e, participants: JSON.parse(e.participants || '[]') }));
  res.json(rows);
});

app.post('/events', requireAuth, requireRole(['government','partner']), (req, res) => {
  const e = req.body || {};
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO events (id, title, description, project_id, start_time, end_time, location, organizer_id, participants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, e.title, e.description, e.project_id ?? null, e.start_time, e.end_time, e.location, req.userId, JSON.stringify(e.participants || []));
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  row.participants = JSON.parse(row.participants || '[]');
  res.json(row);
});

app.get('/messages', requireAuth, requireRole(['government','partner']), (req, res) => {
  const rows = db.prepare('SELECT * FROM messages ORDER BY created_at ASC LIMIT 50').all().map(m => ({ ...m, attachments: JSON.parse(m.attachments || '[]') }));
  res.json(rows);
});

app.post('/messages', requireAuth, requireRole(['government','partner']), (req, res) => {
  const m = req.body || {};
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO messages (id, sender_id, recipient_id, project_id, content, attachments, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)')
    .run(id, req.userId, m.recipient_id ?? null, m.project_id ?? null, m.content, JSON.stringify(m.attachments || []));
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  row.attachments = JSON.parse(row.attachments || '[]');
  res.json(row);
});

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SISAG REST server listening on http://localhost:${PORT}`);
});