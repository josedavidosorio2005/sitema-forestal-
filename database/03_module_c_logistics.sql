-- ============================================================
-- FMS - SQLite Schema: MODULE C - Logística y Recepción
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- MANIFIESTOS DE TRANSPORTE ----------------------
CREATE TABLE IF NOT EXISTS transport_manifests (
    manifest_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    wo_id           INTEGER REFERENCES work_orders(wo_id),
    origin_rodal_id INTEGER REFERENCES rodales(rodal_id),
    origin_description TEXT,
    destination     TEXT NOT NULL,            -- nombre de planta o destino
    truck_plate     TEXT NOT NULL,
    driver_name     TEXT NOT NULL,
    driver_doc      TEXT,
    transporter     TEXT,                    -- empresa transportadora
    total_logs      INTEGER NOT NULL DEFAULT 0,
    total_volume_m3 REAL NOT NULL DEFAULT 0,
    total_estimated_mass_kg REAL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'en_carga'
                        CHECK(status IN ('en_carga','despachado','en_transito','recibido','conciliado')),
    dispatch_time   TEXT,
    arrival_time    TEXT,
    dispatched_by   INTEGER REFERENCES users(user_id),
    received_by     INTEGER REFERENCES users(user_id),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_manifest_status ON transport_manifests(status);
CREATE INDEX idx_manifest_wo ON transport_manifests(wo_id);

-- ---------------------- DETALLE DE TROZAS POR MANIFIESTO ----------------------
CREATE TABLE IF NOT EXISTS manifest_logs (
    manifest_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    manifest_id     INTEGER NOT NULL REFERENCES transport_manifests(manifest_id),
    log_id          INTEGER NOT NULL REFERENCES logs(log_id),
    scanned_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    scanned_by      INTEGER REFERENCES users(user_id),
    UNIQUE(manifest_id, log_id)
);

CREATE INDEX idx_manifest_logs_manifest ON manifest_logs(manifest_id);
CREATE INDEX idx_manifest_logs_log ON manifest_logs(log_id);

-- ---------------------- RECEPCIÓN EN PLANTA ----------------------
CREATE TABLE IF NOT EXISTS plant_receptions (
    reception_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    manifest_id     INTEGER NOT NULL REFERENCES transport_manifests(manifest_id),
    reception_date  TEXT NOT NULL,
    received_by     INTEGER NOT NULL REFERENCES users(user_id),
    -- Báscula camionera
    gross_weight_kg REAL CHECK(gross_weight_kg >= 0),
    tare_weight_kg  REAL CHECK(tare_weight_kg >= 0),
    net_weight_kg   REAL CHECK(net_weight_kg >= 0),
    -- Volumen recibido (re-medición o báscula)
    received_volume_m3 REAL NOT NULL CHECK(received_volume_m3 >= 0),
    dispatched_volume_m3 REAL NOT NULL CHECK(dispatched_volume_m3 >= 0),
    -- Merma
    shrinkage_m3    REAL,                    -- dispatched - received
    shrinkage_pct   REAL,                    -- (shrinkage / dispatched) * 100
    shrinkage_alert INTEGER NOT NULL DEFAULT 0,  -- 1 si merma > umbral (1.5%)
    shrinkage_threshold_pct REAL NOT NULL DEFAULT 1.5,
    -- Conciliación
    conciliation_status TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK(conciliation_status IN ('pendiente','aprobada','alerta','investigacion')),
    conciliation_notes TEXT,
    photo_path      TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_reception_manifest ON plant_receptions(manifest_id);
CREATE INDEX idx_reception_conciliation ON plant_receptions(conciliation_status);

-- ---------------------- DETALLE DE TROZAS RECIBIDAS ----------------------
CREATE TABLE IF NOT EXISTS reception_logs (
    reception_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reception_id    INTEGER NOT NULL REFERENCES plant_receptions(reception_id),
    log_id          INTEGER NOT NULL REFERENCES logs(log_id),
    received_length_m REAL,
    received_diameter_thick_m REAL,
    received_diameter_thin_m REAL,
    received_volume_m3 REAL,
    quality_grade   TEXT CHECK(quality_grade IN ('A','B','C','rechazo')),
    accepted        INTEGER NOT NULL DEFAULT 1,
    notes           TEXT,
    scanned_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(reception_id, log_id)
);

CREATE INDEX idx_reception_logs_reception ON reception_logs(reception_id);
CREATE INDEX idx_reception_logs_log ON reception_logs(log_id);
