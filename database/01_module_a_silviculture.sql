-- ============================================================
-- FMS - SQLite Schema: MODULE A - Silvicultura, Inventario y Alertas
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- JERARQUÍA ESPACIAL ----------------------
CREATE TABLE IF NOT EXISTS predios (
    predio_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    department      TEXT,
    municipality    TEXT,
    total_area_ha   REAL NOT NULL CHECK(total_area_ha > 0),
    -- Geometría almacenada como GeoJSON text (PostGIS en server)
    geojson         TEXT,
    centroid_lat    REAL,
    centroid_lon    REAL,
    owner_name      TEXT,
    owner_doc       TEXT,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK(sync_status IN ('pendiente','sincronizado','conflicto','rechazado'))
);

CREATE INDEX idx_predios_code ON predios(code);

CREATE TABLE IF NOT EXISTS rodales (
    rodal_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    predio_id       INTEGER NOT NULL REFERENCES predios(predio_id),
    code            TEXT NOT NULL,
    species         TEXT NOT NULL,           -- especie predominante
    planting_date   TEXT,                    -- fecha de siembra
    area_ha         REAL NOT NULL CHECK(area_ha > 0),
    avg_slope_deg   REAL DEFAULT 0,          -- pendiente promedio en grados
    geojson         TEXT,
    centroid_lat    REAL,
    centroid_lon    REAL,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente',
    UNIQUE(predio_id, code)
);

CREATE INDEX idx_rodales_predio ON rodales(predio_id);

CREATE TABLE IF NOT EXISTS parcelas (
    parcela_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    rodal_id        INTEGER NOT NULL REFERENCES rodales(rodal_id),
    code            TEXT NOT NULL,
    area_ha         REAL CHECK(area_ha > 0),
    slope_deg       REAL DEFAULT 0,
    geojson         TEXT,
    centroid_lat    REAL,
    centroid_lon    REAL,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente',
    UNIQUE(rodal_id, code)
);

CREATE INDEX idx_parcelas_rodal ON parcelas(rodal_id);

-- ---------------------- ÁRBOLES ----------------------
CREATE TABLE IF NOT EXISTS trees (
    tree_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    parcela_id      INTEGER NOT NULL REFERENCES parcelas(parcela_id),
    code            TEXT NOT NULL UNIQUE,     -- código único del árbol
    species         TEXT NOT NULL,
    dap_m           REAL NOT NULL CHECK(dap_m > 0),           -- DAP en metros
    commercial_height_m REAL NOT NULL CHECK(commercial_height_m > 0),
    total_height_m  REAL,
    form_factor     REAL NOT NULL DEFAULT 0.65 CHECK(form_factor > 0 AND form_factor <= 1),
    -- Volumen calculado: V = (PI/4) * DAP^2 * h * f
    volume_m3       REAL NOT NULL CHECK(volume_m3 >= 0),
    gps_lat         REAL,
    gps_lon         REAL,
    gps_accuracy_m  REAL,
    health_status   TEXT NOT NULL DEFAULT 'sano'
                        CHECK(health_status IN ('sano','plaga','enfermo','muerto','intervenido')),
    status          TEXT NOT NULL DEFAULT 'en_pie'
                        CHECK(status IN ('en_pie','marcado','talado')),
    photo_path      TEXT,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_trees_parcela ON trees(parcela_id);
CREATE INDEX idx_trees_species ON trees(species);
CREATE INDEX idx_trees_status ON trees(status);

-- ---------------------- ANÁLISIS DE SUELOS ----------------------
CREATE TABLE IF NOT EXISTS soil_analyses (
    analysis_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    rodal_id        INTEGER REFERENCES rodales(rodal_id),
    parcela_id      INTEGER REFERENCES parcelas(parcela_id),
    sample_date     TEXT NOT NULL,
    lab_name        TEXT,
    lab_reference   TEXT,
    ph              REAL CHECK(ph >= 0 AND ph <= 14),
    organic_matter_pct REAL CHECK(organic_matter_pct >= 0),
    nitrogen_ppm    REAL CHECK(nitrogen_ppm >= 0),
    phosphorus_ppm  REAL CHECK(phosphorus_ppm >= 0),
    potassium_ppm   REAL CHECK(potassium_ppm >= 0),
    calcium_ppm     REAL CHECK(calcium_ppm >= 0),
    magnesium_ppm   REAL CHECK(magnesium_ppm >= 0),
    sulfur_ppm      REAL CHECK(sulfur_ppm >= 0),
    boron_ppm       REAL CHECK(boron_ppm >= 0),
    zinc_ppm        REAL CHECK(zinc_ppm >= 0),
    iron_ppm        REAL CHECK(iron_ppm >= 0),
    manganese_ppm   REAL CHECK(manganese_ppm >= 0),
    copper_ppm      REAL CHECK(copper_ppm >= 0),
    texture_class   TEXT,                    -- arcilloso, limoso, arenoso, franco
    cec             REAL,                    -- capacidad intercambio catiónico
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_soil_rodal ON soil_analyses(rodal_id);
CREATE INDEX idx_soil_parcela ON soil_analyses(parcela_id);

-- ---------------------- REQUERIMIENTOS NUTRICIONALES POR ESPECIE ----------------------
CREATE TABLE IF NOT EXISTS species_nutrient_requirements (
    requirement_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    species         TEXT NOT NULL,
    growth_stage    TEXT NOT NULL,            -- plantula, juvenil, adulto, cosecha
    nutrient        TEXT NOT NULL,            -- nitrogen, phosphorus, potassium, etc.
    required_ppm    REAL NOT NULL CHECK(required_ppm >= 0),
    absorption_efficiency REAL NOT NULL DEFAULT 0.7 CHECK(absorption_efficiency > 0 AND absorption_efficiency <= 1),
    nutrient_content_pct  REAL NOT NULL DEFAULT 0.46 CHECK(nutrient_content_pct > 0 AND nutrient_content_pct <= 1),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(species, growth_stage, nutrient)
);

-- ---------------------- ALERTAS AGRONÓMICAS ----------------------
CREATE TABLE IF NOT EXISTS agronomic_alerts (
    alert_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    alert_type      TEXT NOT NULL CHECK(alert_type IN ('poda','plaga','fertilizacion','riego','sanitaria','otra')),
    severity        TEXT NOT NULL DEFAULT 'media' CHECK(severity IN ('baja','media','alta','critica')),
    entity_table    TEXT NOT NULL,            -- 'trees','parcelas','rodales'
    entity_id       INTEGER NOT NULL,
    title           TEXT NOT NULL,
    description     TEXT,
    assigned_to     INTEGER REFERENCES users(user_id),
    deadline        TEXT,
    status          TEXT NOT NULL DEFAULT 'abierta'
                        CHECK(status IN ('abierta','en_progreso','cerrada','cancelada')),
    closed_at       TEXT,
    closed_by       INTEGER REFERENCES users(user_id),
    closure_notes   TEXT,
    evidence_photo  TEXT,                    -- REQUERIDA para cierre
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_alerts_status ON agronomic_alerts(status);
CREATE INDEX idx_alerts_assigned ON agronomic_alerts(assigned_to);
CREATE INDEX idx_alerts_entity ON agronomic_alerts(entity_table, entity_id);
