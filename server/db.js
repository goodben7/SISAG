import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawDbPathEnv = process.env.DB_PATH;
const defaultRelativeDb = path.join('server', 'sisag.db');
const rawDbPath = rawDbPathEnv && rawDbPathEnv.trim() !== '' ? rawDbPathEnv : defaultRelativeDb;
let dbPath = path.isAbsolute(rawDbPath) ? rawDbPath : path.resolve(process.cwd(), rawDbPath);
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Ensure parent directory exists or gracefully fallback if not permitted
function resolveWritableDbPath(targetPath) {
  const dir = path.dirname(targetPath);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return targetPath;
  } catch (err) {
    const fallbackPath = path.resolve(process.cwd(), defaultRelativeDb);
    const fallbackDir = path.dirname(fallbackPath);
    try {
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
      fs.accessSync(fallbackDir, fs.constants.W_OK);
    } catch (e) {
      // If fallback also fails, rethrow original error to avoid silent failures
      throw err;
    }
    console.warn(`[DB] Cannot use directory "${dir}" (${err.code}). Falling back to "${fallbackDir}".`);
    return fallbackPath;
  }
}

dbPath = resolveWritableDbPath(dbPath);

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Seed default PAG objectives using prepared statements
try {
  const insertObjective = db.prepare('INSERT OR IGNORE INTO objectives (code, title, level, sector) VALUES (?, ?, ?, ?)');
  const objectives = [
    ['EDU-1','Construction et réhabilitation des écoles','national','Éducation'],
    ['SANTE-1','Renforcement des services de santé primaire','national','Santé'],
    ['INF-1','Développement des infrastructures routières','national','Infrastructure'],
    ['EAU-1','Accès à l\'eau potable et assainissement','national','Eau et assainissement'],
    ['ENER-1','Amélioration de l\'accès à l\'énergie','national','Énergie']
  ];
  const transaction = db.transaction(() => {
    for (const row of objectives) {
      insertObjective.run(...row);
    }
  });
  transaction();
} catch (err) {
  console.error('[DB] Seed objectives failed:', err);
}

export default db;