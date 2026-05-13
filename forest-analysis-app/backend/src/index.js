import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import zonesRoutes from './routes/zones.js';
import speciesRoutes from './routes/species.js';
import reportsRoutes from './routes/reports.js';
import db from './config/database.js';
import {
  CREATE_TABLES_POSTGRES_SQL,
  CREATE_TABLES_SQLITE_SQL,
  POSTGIS_OPTIONAL_SQL,
} from './models/queries.js';
import { errorHandler } from './utils/errors.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

function getCorsOrigins() {
  return (process.env.FRONTEND_URL || 'http://localhost:3000,http://127.0.0.1:3000')
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

    if (process.env.ENABLE_POSTGIS === 'true') {
      await db.exec(POSTGIS_OPTIONAL_SQL);
    }
    return;
  }

  await db.exec(CREATE_TABLES_SQLITE_SQL);
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
