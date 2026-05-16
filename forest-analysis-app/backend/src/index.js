import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import zonesRoutes from './routes/zones.js';
import speciesRoutes from './routes/species.js';
import reportsRoutes from './routes/reports.js';
import subzonesRoutes from './routes/subzones.js';
import calculationsRoutes from './routes/calculations.js';
import db from './config/database.js';
import {
  CREATE_TABLES_POSTGRES_SQL,
  CREATE_TABLES_SQLITE_SQL,
  ENSURE_DEFAULT_USER_POSTGRES_SQL,
  ENSURE_DEFAULT_USER_SQLITE_SQL,
  POSTGIS_OPTIONAL_SQL,
} from './models/queries.js';
import { errorHandler } from './utils/errors.js';
import { createRateLimiter } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 300);

if (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

function getCorsOrigins() {
  return (
    process.env.FRONTEND_URL ||
    'http://localhost:3000,http://127.0.0.1:3000,https://localhost,capacitor://localhost'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || getCorsOrigins().includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(
  createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Forest Analysis API operational',
    dbClient: db.getDbClient(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/zones', zonesRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/subzones', subzonesRoutes);
app.use('/api/calculations', calculationsRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada.',
  });
});

app.use(errorHandler);

async function ensureSchema() {
  if (process.env.AUTO_MIGRATE === 'false') return;

  if (db.getDbClient() === 'postgres') {
    await db.exec(CREATE_TABLES_POSTGRES_SQL);
    await db.exec(`
      ALTER TABLE zones ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#116b3b';
      ALTER TABLE species ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    `);
    await db.exec(ENSURE_DEFAULT_USER_POSTGRES_SQL);

    if (process.env.ENABLE_POSTGIS === 'true') {
      await db.exec(POSTGIS_OPTIONAL_SQL);
    }
    return;
  }

  await db.exec(CREATE_TABLES_SQLITE_SQL);
  await ensureSqliteColumn('zones', 'color', "ALTER TABLE zones ADD COLUMN color TEXT DEFAULT '#116b3b';");
  await ensureSqliteColumn('species', 'category', 'ALTER TABLE species ADD COLUMN category TEXT;');
  await db.exec(ENSURE_DEFAULT_USER_SQLITE_SQL);
}

async function ensureSqliteColumn(table, column, alterSql) {
  const result = await db.query(`PRAGMA table_info(${table});`);
  const hasColumn = result.rows.some((row) => row.name === column);
  if (!hasColumn) {
    await db.exec(alterSql);
  }
}

async function startServer() {
  try {
    await db.testConnection();
    await ensureSchema();

    app.listen(PORT, () => {
      console.log(`Forest Analysis API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start API:', error.message);
    process.exit(1);
  }
}

startServer();
