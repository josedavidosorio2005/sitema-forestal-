-- ============================================================
-- FMS - SQLite Schema: MODULE B - Aprovechamiento y Física de Extracción
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- ÓRDENES DE TRABAJO ----------------------
CREATE TABLE IF NOT EXISTS work_orders (
    wo_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    rodal_id        INTEGER NOT NULL REFERENCES rodales(rodal_id),
    order_type      TEXT NOT NULL CHECK(order_type IN ('tala','extraccion','tala_extraccion','mantenimiento')),
    status          TEXT NOT NULL DEFAULT 'borrador'
                        CHECK(status IN ('borrador','aprobada','en_ejecucion','bloqueada','completada','cancelada')),
    planned_date    TEXT,
    start_date      TEXT,
    end_date        TEXT,
    assigned_crew   TEXT,                    -- nombre o código de cuadrilla
    supervisor_id   INTEGER REFERENCES users(user_id),
    approved_by     INTEGER REFERENCES users(user_id),
    approved_at     TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_wo_rodal ON work_orders(rodal_id);
CREATE INDEX idx_wo_status ON work_orders(status);

-- ---------------------- EVENTOS DE TALA ----------------------
CREATE TABLE IF NOT EXISTS felling_events (
    felling_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    wo_id           INTEGER NOT NULL REFERENCES work_orders(wo_id),
    tree_id         INTEGER NOT NULL REFERENCES trees(tree_id),
    felling_date    TEXT NOT NULL,
    felled_by       INTEGER REFERENCES users(user_id),
    gps_lat         REAL,
    gps_lon         REAL,
    notes           TEXT,
    photo_path      TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente',
    UNIQUE(tree_id)  -- un árbol solo se tala una vez
);

CREATE INDEX idx_felling_wo ON felling_events(wo_id);
CREATE INDEX idx_felling_tree ON felling_events(tree_id);

-- ---------------------- TROZAS (LOGS) ----------------------
CREATE TABLE IF NOT EXISTS logs (
    log_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    qr_code         TEXT NOT NULL UNIQUE,    -- código QR único por troza
    felling_id      INTEGER NOT NULL REFERENCES felling_events(felling_id),
    tree_id         INTEGER NOT NULL REFERENCES trees(tree_id),
    log_number      INTEGER NOT NULL,        -- secuencia dentro del árbol
    species         TEXT NOT NULL,
    length_m        REAL NOT NULL CHECK(length_m > 0),
    diameter_thick_m REAL NOT NULL CHECK(diameter_thick_m > 0),  -- diámetro mayor
    diameter_thin_m  REAL NOT NULL CHECK(diameter_thin_m > 0),   -- diámetro menor
    -- Volumen Smalian: V = (PI/4)*L*((D1^2+D2^2)/2)
    volume_m3       REAL NOT NULL CHECK(volume_m3 > 0),
    estimated_mass_kg REAL,
    quality_grade   TEXT DEFAULT 'A' CHECK(quality_grade IN ('A','B','C','rechazo')),
    gps_lat         REAL,
    gps_lon         REAL,
    status          TEXT NOT NULL DEFAULT 'en_campo'
                        CHECK(status IN ('en_campo','en_acopio','despachada','en_transito','recibida','en_proceso','procesada')),
    photo_path      TEXT,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_logs_qr ON logs(qr_code);
CREATE INDEX idx_logs_tree ON logs(tree_id);
CREATE INDEX idx_logs_felling ON logs(felling_id);
CREATE INDEX idx_logs_status ON logs(status);

-- ---------------------- CATÁLOGO DE CABLES ----------------------
CREATE TABLE IF NOT EXISTS cables (
    cable_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    cable_type      TEXT NOT NULL CHECK(cable_type IN ('winch','skyline','retenida','auxiliar')),
    material        TEXT NOT NULL,            -- acero, sintético
    diameter_mm     REAL NOT NULL CHECK(diameter_mm > 0),
    length_m        REAL NOT NULL CHECK(length_m > 0),
    breaking_strength_kn REAL NOT NULL CHECK(breaking_strength_kn > 0),
    safety_factor   REAL NOT NULL DEFAULT 3.0 CHECK(safety_factor > 0),
    -- SWL = breaking_strength_kn / safety_factor
    swl_kn          REAL NOT NULL CHECK(swl_kn > 0),
    status          TEXT NOT NULL DEFAULT 'operativo'
                        CHECK(status IN ('operativo','desgastado','retirado','en_inspeccion')),
    purchase_date   TEXT,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

-- ---------------------- INSPECCIONES DE CABLES ----------------------
CREATE TABLE IF NOT EXISTS cable_inspections (
    inspection_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    cable_id        INTEGER NOT NULL REFERENCES cables(cable_id),
    inspection_date TEXT NOT NULL,
    inspector_id    INTEGER NOT NULL REFERENCES users(user_id),
    condition       TEXT NOT NULL CHECK(condition IN ('optimo','aceptable','desgastado','critico')),
    broken_wires    INTEGER DEFAULT 0,
    corrosion_level TEXT DEFAULT 'ninguna' CHECK(corrosion_level IN ('ninguna','leve','moderada','severa')),
    remaining_life_pct REAL CHECK(remaining_life_pct >= 0 AND remaining_life_pct <= 100),
    approved        INTEGER NOT NULL DEFAULT 1,  -- 1=aprobado, 0=rechazado
    photo_path      TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_cable_insp_cable ON cable_inspections(cable_id);

-- ---------------------- SIMULACIONES DE TENSIÓN ----------------------
CREATE TABLE IF NOT EXISTS tension_simulations (
    simulation_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    wo_id           INTEGER NOT NULL REFERENCES work_orders(wo_id),
    cable_id        INTEGER NOT NULL REFERENCES cables(cable_id),
    simulation_type TEXT NOT NULL CHECK(simulation_type IN ('winch','skyline')),
    -- Parámetros de entrada
    load_mass_kg    REAL NOT NULL CHECK(load_mass_kg > 0),
    gravity_ms2     REAL NOT NULL DEFAULT 9.81,
    -- Winch params
    slope_angle_deg REAL,
    friction_coeff  REAL CHECK(friction_coeff >= 0),
    -- Skyline params
    span_length_m   REAL CHECK(span_length_m > 0),
    sag_m           REAL CHECK(sag_m > 0),
    -- Resultados calculados
    tension_kn      REAL NOT NULL,
    swl_kn          REAL NOT NULL,
    result_status   TEXT NOT NULL CHECK(result_status IN ('aprobado','bloqueado')),
    -- Si bloqueado, requiere liberación
    released_by     INTEGER REFERENCES users(user_id),
    released_at     TEXT,
    release_notes   TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_tension_wo ON tension_simulations(wo_id);
CREATE INDEX idx_tension_result ON tension_simulations(result_status);
