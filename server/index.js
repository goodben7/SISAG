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
const allowedOrigins = rawOrigins.split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean);

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

// Ensure maturity_assessments table exists even if schema.sql is not updated
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS maturity_assessments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      budget_available INTEGER NOT NULL DEFAULT 0,
      disbursement_planned INTEGER NOT NULL DEFAULT 0,
      funding_source_confirmed INTEGER NOT NULL DEFAULT 0,
      contracts_signed INTEGER NOT NULL DEFAULT 0,
      feasibility_study INTEGER NOT NULL DEFAULT 0,
      technical_plans_validated INTEGER NOT NULL DEFAULT 0,
      documentation_complete INTEGER NOT NULL DEFAULT 0,
      governance_defined INTEGER NOT NULL DEFAULT 0,
      steering_committee_formed INTEGER NOT NULL DEFAULT 0,
      tenders_launched_awarded INTEGER NOT NULL DEFAULT 0,
      project_team_available INTEGER NOT NULL DEFAULT 0,
      logistics_ready INTEGER NOT NULL DEFAULT 0,
      risks_identified INTEGER NOT NULL DEFAULT 0,
      pag_alignment_percent REAL NOT NULL DEFAULT 0,
      attachments TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TRIGGER IF NOT EXISTS maturity_assessments_updated_at
    AFTER UPDATE ON maturity_assessments
    FOR EACH ROW BEGIN
      UPDATE maturity_assessments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);
} catch (e) {
  console.error('[DB] Ensure maturity_assessments failed:', e);
}

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

// Update project fields and log action
app.patch('/projects/:id', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const p = req.body || {};
  const allowed = ['status','budget','spent','end_date','actual_end_date','title','description','sector','province','city','latitude','longitude','ministry','responsible_person'];
  const updates = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(p, k)) {
      updates[k] = (k === 'budget' || k === 'spent') ? Number(p[k]) : p[k];
    }
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(updates).map(k => updates[k]);
  db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`).run(...values, id);

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  row.images = JSON.parse(row.images || '[]');

  let action_type = 'field_update';
  if ('status' in updates) action_type = 'status_update';
  else if ('budget' in updates || 'spent' in updates) action_type = 'budget_update';

  const details = JSON.stringify({ changed: updates, before: existing });
  try {
    db.prepare('INSERT INTO project_actions (project_id, user_id, action_type, details) VALUES (?, ?, ?, ?)')
      .run(id, req.userId, action_type, details);
  } catch (e) {
    console.error('Failed to log project action:', e);
  }

  res.json(row);
});

// Get project actions history
app.get('/projects/:id/actions', requireAuth, requireRole(['government','partner']), (req, res) => {
  const rows = db.prepare('SELECT * FROM project_actions WHERE project_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(req.params.id)
    .map(a => ({ ...a, details: JSON.parse(a.details || '{}') }));
  res.json(rows);
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

// Update project fields and log action
app.patch('/projects/:id', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  const p = req.body || {};
  const allowed = ['status','budget','spent','end_date','actual_end_date','title','description','sector','province','city','latitude','longitude','ministry','responsible_person'];
  const updates = {};
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(p, k)) {
      updates[k] = (k === 'budget' || k === 'spent') ? Number(p[k]) : p[k];
    }
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.keys(updates).map(k => updates[k]);
  db.prepare(`UPDATE projects SET ${setClause} WHERE id = ?`).run(...values, id);

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  row.images = JSON.parse(row.images || '[]');

  let action_type = 'field_update';
  if ('status' in updates) action_type = 'status_update';
  else if ('budget' in updates || 'spent' in updates) action_type = 'budget_update';

  const details = JSON.stringify({ changed: updates, before: existing });
  try {
    db.prepare('INSERT INTO project_actions (project_id, user_id, action_type, details) VALUES (?, ?, ?, ?)')
      .run(id, req.userId, action_type, details);
  } catch (e) {
    console.error('Failed to log project action:', e);
  }

  res.json(row);
});

// Get project actions history
app.get('/projects/:id/actions', requireAuth, requireRole(['government','partner']), (req, res) => {
  const rows = db.prepare('SELECT * FROM project_actions WHERE project_id = ? ORDER BY created_at DESC LIMIT 100')
    .all(req.params.id)
    .map(a => ({ ...a, details: JSON.parse(a.details || '{}') }));
  res.json(rows);
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

// Objectives
app.get('/objectives', (req, res) => {
  const rows = db.prepare('SELECT * FROM objectives ORDER BY code ASC').all();
  res.json(rows);
});

app.post('/objectives', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { code, title, level = 'national', sector } = req.body || {};
  if (!code || !title || !level || !sector) return res.status(400).json({ error: 'Missing required fields' });
  const id = crypto.randomUUID();
  try {
    db.prepare('INSERT INTO objectives (id, code, title, level, sector) VALUES (?, ?, ?, ?, ?)')
      .run(id, code, title, level, sector);
    const row = db.prepare('SELECT * FROM objectives WHERE id = ?').get(id);
    res.json(row);
  } catch (e) {
    res.status(400).json({ error: 'Objective creation failed' });
  }
});

// Project phases
app.get('/projects/:id/phases', (req, res) => {
  const rows = db.prepare('SELECT * FROM phases WHERE project_id = ? ORDER BY created_at ASC').all(req.params.id)
    .map(p => ({ ...p, deliverables: JSON.parse(p.deliverables || '[]') }));
  res.json(rows);
});

app.post('/projects/:id/phases', requireAuth, requireRole(['government','partner']), (req, res) => {
  const ph = req.body || {};
  if (!ph.name || !ph.status) return res.status(400).json({ error: 'Missing required fields' });
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO phases (id, project_id, name, planned_start, planned_end, actual_start, actual_end, status, deliverables)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, req.params.id, ph.name, ph.planned_start ?? null, ph.planned_end ?? null, ph.actual_start ?? null, ph.actual_end ?? null, ph.status, JSON.stringify(ph.deliverables || []));
  const row = db.prepare('SELECT * FROM phases WHERE id = ?').get(id);
  row.deliverables = JSON.parse(row.deliverables || '[]');
  res.json(row);
});

app.put('/projects/:projectId/phases/:phaseId', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { projectId, phaseId } = req.params;
  const existing = db.prepare('SELECT * FROM phases WHERE id = ? AND project_id = ?').get(phaseId, projectId);
  if (!existing) return res.status(404).json({ error: 'Phase not found' });
  const ph = req.body || {};
  const updated = {
    name: ph.name ?? existing.name,
    planned_start: ph.planned_start ?? existing.planned_start,
    planned_end: ph.planned_end ?? existing.planned_end,
    actual_start: ph.actual_start ?? existing.actual_start,
    actual_end: ph.actual_end ?? existing.actual_end,
    status: ph.status ?? existing.status,
    deliverables: JSON.stringify(ph.deliverables ?? JSON.parse(existing.deliverables || '[]'))
  };
  db.prepare(`UPDATE phases SET name = ?, planned_start = ?, planned_end = ?, actual_start = ?, actual_end = ?, status = ?, deliverables = ? WHERE id = ? AND project_id = ?`)
    .run(updated.name, updated.planned_start, updated.planned_end, updated.actual_start, updated.actual_end, updated.status, updated.deliverables, phaseId, projectId);
  const row = db.prepare('SELECT * FROM phases WHERE id = ?').get(phaseId);
  row.deliverables = JSON.parse(row.deliverables || '[]');
  res.json(row);
});

app.delete('/projects/:projectId/phases/:phaseId', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { projectId, phaseId } = req.params;
  const info = db.prepare('DELETE FROM phases WHERE id = ? AND project_id = ?').run(phaseId, projectId);
  if ((info.changes || 0) === 0) return res.status(404).json({ error: 'Phase not found' });
  res.json({ success: true });
});

// Project objectives linking
app.get('/projects/:id/objectives', (req, res) => {
  const rows = db.prepare(`SELECT o.id, o.code, o.title, o.level, o.sector, po.weight
    FROM project_objectives po
    JOIN objectives o ON o.id = po.objective_id
    WHERE po.project_id = ?
    ORDER BY o.code ASC`).all(req.params.id);
  res.json(rows);
});

app.post('/projects/:id/objectives', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { objective_id, weight = 1 } = req.body || {};
  if (!objective_id) return res.status(400).json({ error: 'Missing objective_id' });
  const w = Math.max(1, Math.min(5, Number(weight || 1)));
  db.prepare(`INSERT INTO project_objectives (project_id, objective_id, weight)
    VALUES (?, ?, ?)
    ON CONFLICT(project_id, objective_id) DO UPDATE SET weight = excluded.weight`).run(req.params.id, objective_id, w);
  const row = db.prepare('SELECT project_id, objective_id, weight FROM project_objectives WHERE project_id = ? AND objective_id = ?')
    .get(req.params.id, objective_id);
  res.json(row);
});

app.delete('/projects/:projectId/objectives/:objectiveId', requireAuth, requireRole(['government','partner']), (req, res) => {
  const { projectId, objectiveId } = req.params;
  const info = db.prepare('DELETE FROM project_objectives WHERE project_id = ? AND objective_id = ?').run(projectId, objectiveId);
  if ((info.changes || 0) === 0) return res.status(404).json({ error: 'Link not found' });
  res.json({ success: true });
});

// Alignment computation
app.get('/projects/:id/alignment', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const links = db.prepare(`SELECT o.id, o.code, o.title, o.level, o.sector, po.weight
    FROM project_objectives po
    JOIN objectives o ON o.id = po.objective_id
    WHERE po.project_id = ?`).all(req.params.id);

  const totalPossible = (links.length || 1) * 5;
  const totalWeight = links.reduce((sum, l) => sum + Number(l.weight || 0), 0);
  const score = Math.round((totalWeight / totalPossible) * 100);

  // Simple redundancy detection: count similar sector projects in same province
  const similarCount = db.prepare('SELECT COUNT(1) AS c FROM projects WHERE province = ? AND sector = ? AND id != ?')
    .get(project.province, project.sector, project.id)?.c || 0;

  // Suggestions: objectives by sector not yet linked
  const suggestions = db.prepare(`SELECT o.id, o.code, o.title, o.level, o.sector
    FROM objectives o
    WHERE o.sector = ? AND o.id NOT IN (SELECT objective_id FROM project_objectives WHERE project_id = ?)
    ORDER BY o.code ASC LIMIT 5`).all(project.sector, project.id);

  res.json({ score, objectives: links, redundancy: { similarProjects: similarCount }, suggestions });
});

// Planning alerts
app.get('/alerts/planning', (req, res) => {
  const rows = db.prepare('SELECT * FROM alerts_planning ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

app.post('/alerts/planning', requireAuth, requireRole(['government','partner']), (req, res) => {
  const a = req.body || {};
  if (!a.project_id || !a.type || !a.severity || !a.message) return res.status(400).json({ error: 'Missing required fields' });
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO alerts_planning (id, project_id, phase_id, type, severity, message)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, a.project_id, a.phase_id ?? null, a.type, a.severity, a.message);
  const row = db.prepare('SELECT * FROM alerts_planning WHERE id = ?').get(id);
  res.json(row);
});

// Maturity assessment: compute helper
function computeMaturityScore(a) {
  const yes = (v) => Number(v ? 1 : 0);
  const financialRaw = yes(a.budget_available)*10 + yes(a.disbursement_planned)*10 + yes(a.funding_source_confirmed)*5 + yes(a.contracts_signed)*5; // 30
  const technicalRaw = yes(a.feasibility_study)*10 + yes(a.technical_plans_validated)*10 + yes(a.documentation_complete)*5; // 25
  const legalRaw = yes(a.governance_defined)*5 + yes(a.steering_committee_formed)*5 + yes(a.tenders_launched_awarded)*10; // 20
  const operationalRaw = yes(a.project_team_available)*5 + yes(a.logistics_ready)*5 + yes(a.risks_identified)*5; // 15
  const strategicPercent = Math.max(0, Math.min(100, Number(a.pag_alignment_percent || 0))); // 0-100

  const financial = Math.round((financialRaw / 30) * 100);
  const technical = Math.round((technicalRaw / 25) * 100);
  const legal = Math.round((legalRaw / 20) * 100);
  const operational = Math.round((operationalRaw / 15) * 100);
  const strategic = Math.round(strategicPercent);

  const score = Math.round(financial * 0.30 + technical * 0.25 + legal * 0.20 + operational * 0.15 + strategic * 0.10);

  let recommendation = { status: 'not_ready', message: '❌ Projet non prêt. Actions urgentes requises.' };
  if (score >= 71) recommendation = { status: 'ready', message: '✅ Projet prêt pour exécution. Passer à la phase suivante.' };
  else if (score >= 41) recommendation = { status: 'preparing', message: '⚠️ Projet en cours de préparation. Voir les blocages ci-dessous.' };

  return { score, dimensions: { financial, technical, legal, operational, strategic }, recommendation };
}

// GET maturity by project
app.get('/projects/:id/maturity', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const row = db.prepare('SELECT * FROM maturity_assessments WHERE project_id = ?').get(req.params.id);
  const defaultAssessment = {
    project_id: req.params.id,
    budget_available: 0,
    disbursement_planned: 0,
    funding_source_confirmed: 0,
    contracts_signed: 0,
    feasibility_study: 0,
    technical_plans_validated: 0,
    documentation_complete: 0,
    governance_defined: 0,
    steering_committee_formed: 0,
    tenders_launched_awarded: 0,
    project_team_available: 0,
    logistics_ready: 0,
    risks_identified: 0,
    pag_alignment_percent: 0,
    attachments: []
  };
  const a = row ? { ...row, attachments: JSON.parse(row.attachments || '[]') } : defaultAssessment;
  const result = computeMaturityScore(a);
  res.json({ assessment: a, ...result });
});

// POST/UPSERT maturity by project
app.post('/projects/:id/maturity', requireAuth, requireRole(['government','partner']), (req, res) => {
  const p = req.body || {};
  const clean = (v) => v ? 1 : 0;
  const payload = {
    project_id: req.params.id,
    budget_available: clean(p.budget_available),
    disbursement_planned: clean(p.disbursement_planned),
    funding_source_confirmed: clean(p.funding_source_confirmed),
    contracts_signed: clean(p.contracts_signed),
    feasibility_study: clean(p.feasibility_study),
    technical_plans_validated: clean(p.technical_plans_validated),
    documentation_complete: clean(p.documentation_complete),
    governance_defined: clean(p.governance_defined),
    steering_committee_formed: clean(p.steering_committee_formed),
    tenders_launched_awarded: clean(p.tenders_launched_awarded),
    project_team_available: clean(p.project_team_available),
    logistics_ready: clean(p.logistics_ready),
    risks_identified: clean(p.risks_identified),
    pag_alignment_percent: Math.max(0, Math.min(100, Number(p.pag_alignment_percent || 0))),
    attachments: JSON.stringify(p.attachments || [])
  };

  const existing = db.prepare('SELECT id FROM maturity_assessments WHERE project_id = ?').get(req.params.id);
  if (existing) {
    db.prepare(`UPDATE maturity_assessments SET
      budget_available = ?, disbursement_planned = ?, funding_source_confirmed = ?, contracts_signed = ?,
      feasibility_study = ?, technical_plans_validated = ?, documentation_complete = ?,
      governance_defined = ?, steering_committee_formed = ?, tenders_launched_awarded = ?,
      project_team_available = ?, logistics_ready = ?, risks_identified = ?,
      pag_alignment_percent = ?, attachments = ?
      WHERE project_id = ?
    `).run(
      payload.budget_available, payload.disbursement_planned, payload.funding_source_confirmed, payload.contracts_signed,
      payload.feasibility_study, payload.technical_plans_validated, payload.documentation_complete,
      payload.governance_defined, payload.steering_committee_formed, payload.tenders_launched_awarded,
      payload.project_team_available, payload.logistics_ready, payload.risks_identified,
      payload.pag_alignment_percent, payload.attachments,
      payload.project_id
    );
  } else {
    db.prepare(`INSERT INTO maturity_assessments (
      project_id, budget_available, disbursement_planned, funding_source_confirmed, contracts_signed,
      feasibility_study, technical_plans_validated, documentation_complete,
      governance_defined, steering_committee_formed, tenders_launched_awarded,
      project_team_available, logistics_ready, risks_identified,
      pag_alignment_percent, attachments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      payload.project_id, payload.budget_available, payload.disbursement_planned, payload.funding_source_confirmed, payload.contracts_signed,
      payload.feasibility_study, payload.technical_plans_validated, payload.documentation_complete,
      payload.governance_defined, payload.steering_committee_formed, payload.tenders_launched_awarded,
      payload.project_team_available, payload.logistics_ready, payload.risks_identified,
      payload.pag_alignment_percent, payload.attachments
    );
  }
  const row = db.prepare('SELECT * FROM maturity_assessments WHERE project_id = ?').get(req.params.id);
  const a = { ...row, attachments: JSON.parse(row.attachments || '[]') };
  const result = computeMaturityScore(a);
  res.json({ assessment: a, ...result });
});

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`SISAG REST server listening on http://localhost:${PORT}`);
});