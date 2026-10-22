/* ============================================================
   APEX server: serves the app and keeps the log in SQLite.
   Node 22+, zero dependencies (node:sqlite, node:http).

   Binds to 127.0.0.1 only. Tailscale `serve` puts HTTPS in front,
   so only devices on Pearce's tailnet can reach it.

   API
     POST /api/sync    { records:[{kind, rec}] } -> upsert (newest
                       updated_at wins), returns the full state
     GET  /api/state   the full state
     GET  /api/export  the full state as a download, for Ronin
     GET  /api/health

   Env: APEX_DB (default ./apex.db), PORT (8787), APEX_ROOT (app dir)
   ============================================================ */
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.APEX_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8787);
const DB_PATH = process.env.APEX_DB || join(ROOT, 'apex.db');

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sets (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, session TEXT, cycle INTEGER, deload INTEGER,
    ex TEXT NOT NULL, set_no INTEGER, stage INTEGER, wi INTEGER, target REAL, sets_prescribed INTEGER,
    weight REAL, reps REAL, done INTEGER, updated_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS sets_ex_date ON sets(ex, date);
  CREATE TABLE IF NOT EXISTS days (
    date TEXT PRIMARY KEY, foot INTEGER, run_mi REAL, strides INTEGER, weight REAL, waist REAL,
    notes TEXT, warmup INTEGER, stretch INTEGER, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY, date TEXT, cycle INTEGER, key TEXT, value TEXT, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT NOT NULL);
`);

const TABLES = {
  sets: ['id', 'date', 'session', 'cycle', 'deload', 'ex', 'set_no', 'stage', 'wi', 'target', 'sets_prescribed', 'weight', 'reps', 'done', 'updated_at'],
  days: ['date', 'foot', 'run_mi', 'strides', 'weight', 'waist', 'notes', 'warmup', 'stretch', 'updated_at'],
  tests: ['id', 'date', 'cycle', 'key', 'value', 'updated_at'],
  meta: ['key', 'value', 'updated_at'],
};
const PK = { sets: 'id', days: 'date', tests: 'id', meta: 'key' };

/* upsert where the newer updated_at wins */
const upserts = {};
for (const [t, cols] of Object.entries(TABLES)) {
  const sets = cols.filter(c => c !== PK[t]).map(c => `${c} = excluded.${c}`).join(', ');
  upserts[t] = db.prepare(
    `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
     ON CONFLICT(${PK[t]}) DO UPDATE SET ${sets} WHERE excluded.updated_at >= ${t}.updated_at`);
}

function clean(v) {
  if (v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'string' || v === null) return v;
  return String(v);
}

function applyRecords(records) {
  let n = 0;
  db.exec('BEGIN');
  try {
    for (const item of records) {
      const t = item && item.kind, rec = item && item.rec;
      if (!TABLES[t] || !rec || rec[PK[t]] == null || !rec.updated_at) continue;
      upserts[t].run(...TABLES[t].map(c => clean(rec[c])));
      n++;
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return n;
}

function state() {
  const out = {};
  for (const t of Object.keys(TABLES)) out[t] = db.prepare(`SELECT * FROM ${t}`).all();
  return out;
}

/* ---------- http ---------- */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
};
const PUBLIC = new Set(['/index.html', '/app.js', '/engine.js', '/program.js', '/styles.css', '/sw.js', '/manifest.webmanifest']);

function send(res, code, body, type = 'application/json', extra = {}) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...extra });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req, limit = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;

    if (p === '/api/health') return send(res, 200, { ok: true, db: DB_PATH });
    if (p === '/api/state' && req.method === 'GET') return send(res, 200, { state: state() });
    if (p === '/api/export' && req.method === 'GET') {
      return send(res, 200, JSON.stringify({ exported: new Date().toISOString(), ...state() }, null, 2), 'application/json',
        { 'Content-Disposition': `attachment; filename="apex-${new Date().toISOString().slice(0, 10)}.json"` });
    }
    if (p === '/api/sync' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req) || '{}');
      const n = applyRecords(Array.isArray(body.records) ? body.records : []);
      return send(res, 200, { ok: true, applied: n, state: state(), now: new Date().toISOString() });
    }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'not found' });

    /* static app files, whitelisted */
    let file = p === '/' ? '/index.html' : normalize(p).replace(/\\/g, '/');
    if (!PUBLIC.has(file) && !/^\/icons\/[a-z0-9-]+\.png$/.test(file)) return send(res, 404, 'not found', 'text/plain');
    const full = join(ROOT, file);
    await stat(full);
    return send(res, 200, await readFile(full), TYPES[extname(full)] || 'application/octet-stream');
  } catch (e) {
    if (e.code === 'ENOENT') return send(res, 404, 'not found', 'text/plain');
    console.error(e);
    return send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`apex on http://127.0.0.1:${PORT}  db=${DB_PATH}`));
