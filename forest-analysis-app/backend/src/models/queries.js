export const CREATE_TABLES_POSTGRES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  region VARCHAR(255),
  geometry_geojson JSONB NOT NULL,
  area_m2 DOUBLE PRECISION NOT NULL,
  area_ha DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS species (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  common_name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('nativa', 'introducida', 'invasora', 'ornamental', 'comercial')),
  description TEXT,
  region VARCHAR(255),
  image_url VARCHAR(500),
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  area_m2 DOUBLE PRECISION NOT NULL,
  area_ha DOUBLE PRECISION NOT NULL,
  vegetation_coverage DOUBLE PRECISION NOT NULL,
  forest_density VARCHAR(50) NOT NULL CHECK (forest_density IN ('bajo', 'medio', 'alto')),
  probable_species JSONB DEFAULT '[]'::jsonb,
  confirmed_species JSONB DEFAULT '[]'::jsonb,
  observations TEXT,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subzones (
  id SERIAL PRIMARY KEY,
  zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  use_type VARCHAR(50) NOT NULL CHECK (use_type IN ('plantacion', 'recoleccion', 'conservacion', 'mixto')),
  operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN ('sembrar', 'recolectar', 'monitorear')),
  slope_degrees DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (slope_degrees >= 0 AND slope_degrees <= 90),
  soil_type VARCHAR(255) NOT NULL,
  tree_species_id INTEGER REFERENCES species(id) ON DELETE SET NULL,
  tree_common_name VARCHAR(255),
  tree_count INTEGER NOT NULL DEFAULT 0 CHECK (tree_count >= 0),
  geometry_geojson JSONB,
  area_m2 DOUBLE PRECISION,
  area_ha DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_zones_user_id ON zones(user_id);
CREATE INDEX IF NOT EXISTS idx_zones_deleted_at ON zones(deleted_at);
CREATE INDEX IF NOT EXISTS idx_species_user_id ON species(user_id);
CREATE INDEX IF NOT EXISTS idx_species_type ON species(type);
CREATE INDEX IF NOT EXISTS idx_reports_zone_id ON reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_subzones_zone_id ON subzones(zone_id);
CREATE INDEX IF NOT EXISTS idx_subzones_use_type ON subzones(use_type);
CREATE INDEX IF NOT EXISTS idx_subzones_deleted_at ON subzones(deleted_at);
`;

export const POSTGIS_OPTIONAL_SQL = `
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS geom geometry(Polygon, 4326);
UPDATE zones
SET geom = ST_SetSRID(ST_GeomFromGeoJSON(geometry_geojson::text), 4326)
WHERE geom IS NULL;
CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones USING GIST (geom);
`;

export const CREATE_TABLES_SQLITE_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  region TEXT,
  geometry_geojson TEXT NOT NULL,
  area_m2 REAL NOT NULL,
  area_ha REAL NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('nativa', 'introducida', 'invasora', 'ornamental', 'comercial')),
  description TEXT,
  region TEXT,
  image_url TEXT,
  observations TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  area_m2 REAL NOT NULL,
  area_ha REAL NOT NULL,
  vegetation_coverage REAL NOT NULL,
  forest_density TEXT NOT NULL CHECK (forest_density IN ('bajo', 'medio', 'alto')),
  probable_species TEXT DEFAULT '[]',
  confirmed_species TEXT DEFAULT '[]',
  observations TEXT,
  analysis_date TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subzones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id INTEGER REFERENCES zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  use_type TEXT NOT NULL CHECK (use_type IN ('plantacion', 'recoleccion', 'conservacion', 'mixto')),
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sembrar', 'recolectar', 'monitorear')),
  slope_degrees REAL NOT NULL DEFAULT 0 CHECK (slope_degrees >= 0 AND slope_degrees <= 90),
  soil_type TEXT NOT NULL,
  tree_species_id INTEGER REFERENCES species(id) ON DELETE SET NULL,
  tree_common_name TEXT,
  tree_count INTEGER NOT NULL DEFAULT 0 CHECK (tree_count >= 0),
  geometry_geojson TEXT,
  area_m2 REAL,
  area_ha REAL,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_zones_user_id ON zones(user_id);
CREATE INDEX IF NOT EXISTS idx_zones_deleted_at ON zones(deleted_at);
CREATE INDEX IF NOT EXISTS idx_species_user_id ON species(user_id);
CREATE INDEX IF NOT EXISTS idx_species_type ON species(type);
CREATE INDEX IF NOT EXISTS idx_reports_zone_id ON reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_subzones_zone_id ON subzones(zone_id);
CREATE INDEX IF NOT EXISTS idx_subzones_use_type ON subzones(use_type);
CREATE INDEX IF NOT EXISTS idx_subzones_deleted_at ON subzones(deleted_at);
`;

export const zonesQueries = {
  create: `
    INSERT INTO zones (user_id, name, description, region, geometry_geojson, area_m2, area_ha)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `,
  getAll: `
    SELECT * FROM zones
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC;
  `,
  getById: `
    SELECT * FROM zones
    WHERE id = $1 AND deleted_at IS NULL;
  `,
  update: `
    UPDATE zones
    SET name = $2,
        description = $3,
        region = $4,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
  softDelete: `
    UPDATE zones
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
};

export const speciesQueries = {
  create: `
    INSERT INTO species (user_id, common_name, scientific_name, type, description, region, image_url, observations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `,
  getAll: `
    SELECT * FROM species
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY common_name ASC;
  `,
  getById: `
    SELECT * FROM species
    WHERE id = $1 AND deleted_at IS NULL;
  `,
  getByType: `
    SELECT * FROM species
    WHERE type = $1 AND user_id = $2 AND deleted_at IS NULL
    ORDER BY common_name ASC;
  `,
  update: `
    UPDATE species
    SET common_name = $2,
        scientific_name = $3,
        type = $4,
        description = $5,
        region = $6,
        image_url = $7,
        observations = $8,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
  softDelete: `
    UPDATE species
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
};

export const reportsQueries = {
  create: `
    INSERT INTO reports (
      zone_id,
      area_m2,
      area_ha,
      vegetation_coverage,
      forest_density,
      probable_species,
      confirmed_species,
      observations
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `,
  getAll: `
    SELECT r.*, z.name AS zone_name, z.region AS zone_region
    FROM reports r
    JOIN zones z ON r.zone_id = z.id
    WHERE z.user_id = $1 AND z.deleted_at IS NULL
    ORDER BY r.created_at DESC;
  `,
  getById: `
    SELECT r.*, z.name AS zone_name, z.region AS zone_region
    FROM reports r
    JOIN zones z ON r.zone_id = z.id
    WHERE r.id = $1;
  `,
  getByZoneId: `
    SELECT * FROM reports
    WHERE zone_id = $1
    ORDER BY created_at DESC;
  `,
  getLatestByZoneId: `
    SELECT * FROM reports
    WHERE zone_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `,
  update: `
    UPDATE reports
    SET confirmed_species = $2,
        observations = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `,
};

export const subzonesQueries = {
  create: `
    INSERT INTO subzones (
      zone_id,
      name,
      use_type,
      operation_type,
      slope_degrees,
      soil_type,
      tree_species_id,
      tree_common_name,
      tree_count,
      geometry_geojson,
      area_m2,
      area_ha,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *;
  `,
  getByZoneId: `
    SELECT sz.*, s.common_name AS species_common_name, s.scientific_name AS species_scientific_name
    FROM subzones sz
    LEFT JOIN species s ON sz.tree_species_id = s.id
    WHERE sz.zone_id = $1 AND sz.deleted_at IS NULL
    ORDER BY sz.created_at DESC;
  `,
  getById: `
    SELECT sz.*, s.common_name AS species_common_name, s.scientific_name AS species_scientific_name
    FROM subzones sz
    LEFT JOIN species s ON sz.tree_species_id = s.id
    WHERE sz.id = $1 AND sz.deleted_at IS NULL;
  `,
  update: `
    UPDATE subzones
    SET name = $2,
        use_type = $3,
        operation_type = $4,
        slope_degrees = $5,
        soil_type = $6,
        tree_species_id = $7,
        tree_common_name = $8,
        tree_count = $9,
        geometry_geojson = $10,
        area_m2 = $11,
        area_ha = $12,
        notes = $13,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
  softDelete: `
    UPDATE subzones
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING *;
  `,
};
