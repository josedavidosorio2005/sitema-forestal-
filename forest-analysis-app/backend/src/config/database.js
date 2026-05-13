import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbClient =
  process.env.DB_CLIENT ||
  (process.env.DATABASE_URL ? 'postgres' : 'sqlite');

let postgresPool = null;
let sqliteDb = null;

function getSqlitePath() {
  const configuredPath = process.env.SQLITE_FILE;
  const fallbackPath = path.resolve(__dirname, '../../data/forest-analysis.db');
  return path.resolve(configuredPath || fallbackPath);
}

function initPostgres() {
  if (postgresPool) return postgresPool;

  postgresPool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'forest_analysis',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
  });

  postgresPool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });

  return postgresPool;
}

function initSqlite() {
  if (sqliteDb) return sqliteDb;

  const sqlitePath = getSqlitePath();
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

  sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma('foreign_keys = ON');
  sqliteDb.pragma('journal_mode = WAL');

  return sqliteDb;
}

function normalizeSqliteSql(sql) {
  return sql.replace(/\$(\d+)/g, (_, index) => `@p${index}`);
}

function normalizeSqliteParams(params = []) {
  return params.reduce((acc, value, index) => {
    acc[`p${index + 1}`] = value;
    return acc;
  }, {});
}

function isSelectLike(sql) {
  const normalized = sql.trim().toLowerCase();
  return (
    normalized.startsWith('select') ||
    normalized.startsWith('pragma') ||
    /\breturning\b/.test(normalized)
  );
}

export function getDbClient() {
  return dbClient;
}

export async function query(sql, params = []) {
  if (dbClient === 'postgres') {
    const pool = initPostgres();
    return pool.query(sql, params);
  }

  const db = initSqlite();
  const sqliteSql = normalizeSqliteSql(sql);
  const sqliteParams = normalizeSqliteParams(params);
  const statement = db.prepare(sqliteSql);

  if (isSelectLike(sqliteSql)) {
    return { rows: statement.all(sqliteParams), rowCount: undefined };
  }

  const result = statement.run(sqliteParams);
  return { rows: [], rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
}

export async function exec(sql) {
  if (dbClient === 'postgres') {
    const pool = initPostgres();
    return pool.query(sql);
  }

  const db = initSqlite();
  return db.exec(sql);
}

export async function testConnection() {
  if (dbClient === 'postgres') {
    const pool = initPostgres();
    const client = await pool.connect();
    client.release();
    console.log('Database connected: PostgreSQL');
    return;
  }

  initSqlite();
  console.log(`Database connected: SQLite (${getSqlitePath()})`);
}

export async function closeDatabase() {
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
  }

  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
}

export default {
  query,
  exec,
  testConnection,
  closeDatabase,
  getDbClient,
};
