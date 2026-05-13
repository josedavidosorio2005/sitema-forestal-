import db from '../config/database.js';
import {
  CREATE_TABLES_POSTGRES_SQL,
  CREATE_TABLES_SQLITE_SQL,
  POSTGIS_OPTIONAL_SQL,
} from '../models/queries.js';

async function migrate() {
  try {
    const client = db.getDbClient();
    console.log(`Running migrations with ${client}...`);

    if (client === 'postgres') {
      await db.exec(CREATE_TABLES_POSTGRES_SQL);

      if (process.env.ENABLE_POSTGIS === 'true') {
        await db.exec(POSTGIS_OPTIONAL_SQL);
        console.log('PostGIS structure enabled.');
      }
    } else {
      await db.exec(CREATE_TABLES_SQLITE_SQL);
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

migrate();
