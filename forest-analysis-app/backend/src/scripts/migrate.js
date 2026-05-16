import db from '../config/database.js';
import {
  CREATE_TABLES_POSTGRES_SQL,
  CREATE_TABLES_SQLITE_SQL,
  ENSURE_DEFAULT_USER_POSTGRES_SQL,
  ENSURE_DEFAULT_USER_SQLITE_SQL,
  POSTGIS_OPTIONAL_SQL,
} from '../models/queries.js';

async function migrate() {
  try {
    const client = db.getDbClient();
    console.log(`Running migrations with ${client}...`);

    if (client === 'postgres') {
      await db.exec(CREATE_TABLES_POSTGRES_SQL);
      await db.exec(`
        ALTER TABLE zones ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#116b3b';
        ALTER TABLE species ADD COLUMN IF NOT EXISTS category VARCHAR(100);
      `);
      await db.exec(ENSURE_DEFAULT_USER_POSTGRES_SQL);

      if (process.env.ENABLE_POSTGIS === 'true') {
        await db.exec(POSTGIS_OPTIONAL_SQL);
        console.log('PostGIS structure enabled.');
      }
    } else {
      await db.exec(CREATE_TABLES_SQLITE_SQL);
      await ensureSqliteColumn('zones', 'color', "ALTER TABLE zones ADD COLUMN color TEXT DEFAULT '#116b3b';");
      await ensureSqliteColumn('species', 'category', 'ALTER TABLE species ADD COLUMN category TEXT;');
      await db.exec(ENSURE_DEFAULT_USER_SQLITE_SQL);
    }

    console.log('Migrations completed.');
    await db.closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    await db.closeDatabase();
    process.exit(1);
  }
}

async function ensureSqliteColumn(table, column, alterSql) {
  const result = await db.query(`PRAGMA table_info(${table});`);
  const hasColumn = result.rows.some((row) => row.name === column);
  if (!hasColumn) {
    await db.exec(alterSql);
  }
}

migrate();
