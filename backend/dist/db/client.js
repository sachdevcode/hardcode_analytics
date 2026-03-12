import { CREATE_TABLES } from './schema.js';
import { CREATE_TABLES_SQLITE } from './schema-sqlite.js';
const u = process.env.DATABASE_URL ?? '';
export const useSqlite = () => !u || u.startsWith('sqlite') || u.startsWith('file');
let pool = null;
let sqliteDb = null;
function toSqlitePlaceholders(sql) {
    return sql.replace(/\$(\d+)/g, '?');
}
export async function initDb() {
    if (useSqlite()) {
        const Database = (await import('better-sqlite3')).default;
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
        const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'hardscope.db');
        const fs = await import('fs');
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
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
    }
    finally {
        client.release();
    }
}
export function query(text, params) {
    if (useSqlite() && sqliteDb) {
        const sql = toSqlitePlaceholders(text)
            .replace(/::text/gi, '')
            .replace(/BIGINT/gi, 'INTEGER');
        const stmt = sqliteDb.prepare(sql);
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
            const rows = (params?.length ? stmt.all(...params) : stmt.all());
            return Promise.resolve({ rows, rowCount: rows.length });
        }
        const result = params?.length ? stmt.run(...params) : stmt.run();
        return Promise.resolve({ rows: [], rowCount: result.changes });
    }
    if (!pool)
        return Promise.reject(new Error('Database not initialized'));
    return pool.query(text, params);
}
export function getPool() {
    return pool;
}
export default { initDb, query, useSqlite, getPool };
