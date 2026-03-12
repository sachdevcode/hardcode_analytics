import { CREATE_TABLES } from './schema.js';
import { CREATE_TABLES_SQLITE } from './schema-sqlite.js';

const u = process.env.DATABASE_URL ?? '';
export const useSqlite = (): boolean =>
  !u || u.startsWith('sqlite') || u.startsWith('file');

let pool: import('pg').Pool | null = null;
let sqliteDb: import('better-sqlite3').Database | null = null;

function toSqlitePlaceholders(sql: string): string {
  return sql.replace(/\$(\d+)/g, '?');
}

export async function initDb(): Promise<void> {
  if (useSqlite()) {
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'hardscope.db');
    const fs = await import('fs');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sqliteDb = new Database(dbPath);
    sqliteDb.exec(CREATE_TABLES_SQLITE);
    return;
  }
  const { default: pg } = await import('pg');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
  });
  const client = await pool.connect();
  try {
    await client.query(CREATE_TABLES);
  } finally {
    client.release();
  }
}

export function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  if (useSqlite() && sqliteDb) {
    const sql = toSqlitePlaceholders(text)
      .replace(/::text/gi, '')
      .replace(/BIGINT/gi, 'INTEGER');
    const stmt = sqliteDb.prepare(sql);
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const rows = (params?.length ? stmt.all(...params) : stmt.all()) as T[];
      return Promise.resolve({ rows, rowCount: rows.length });
    }
    const result = params?.length ? stmt.run(...params) : stmt.run();
    return Promise.resolve({ rows: [], rowCount: (result as { changes: number }).changes });
  }
  if (!pool) return Promise.reject(new Error('Database not initialized'));
  return pool.query(text, params) as unknown as Promise<{ rows: T[]; rowCount: number }>;
}

export function getPool(): import('pg').Pool | null {
  return pool;
}

export default { initDb, query, useSqlite, getPool };
