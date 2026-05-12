-- ============================================================
-- FMS - SQLite Schema: MODULE D - Aserrío y Transformación Industrial
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- MAQUINARIA ----------------------
CREATE TABLE IF NOT EXISTS machines (
    machine_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    machine_type    TEXT NOT NULL CHECK(machine_type IN ('aserradero','canteadora','cepilladora','sierra_circular','horno_secado','descortezadora','otra')),
    brand           TEXT,
    model           TEXT,
    serial_number   TEXT,
    nominal_capacity_m3h REAL CHECK(nominal_capacity_m3h > 0),  -- capacidad nominal m3/hora
    status          TEXT NOT NULL DEFAULT 'operativa'
                        CHECK(status IN ('operativa','en_mantenimiento','fuera_servicio')),
    location        TEXT,
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

-- ---------------------- BATCHES DE ASERRÍO ----------------------
CREATE TABLE IF NOT EXISTS sawmill_batches (
    batch_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    machine_id      INTEGER NOT NULL REFERENCES machines(machine_id),
    operator_id     INTEGER REFERENCES users(user_id),
    supervisor_id   INTEGER REFERENCES users(user_id),
    batch_date      TEXT NOT NULL,
    shift           TEXT CHECK(shift IN ('diurno','nocturno','continuo')),
    status          TEXT NOT NULL DEFAULT 'abierto'
                        CHECK(status IN ('abierto','en_proceso','cerrado','anulado')),
    -- Totales calculados
    input_volume_m3     REAL NOT NULL DEFAULT 0 CHECK(input_volume_m3 >= 0),
    output_volume_m3    REAL NOT NULL DEFAULT 0 CHECK(output_volume_m3 >= 0),
    waste_volume_m3     REAL NOT NULL DEFAULT 0 CHECK(waste_volume_m3 >= 0),
    -- Yield = (output / input) * 100
    yield_pct           REAL DEFAULT 0 CHECK(yield_pct >= 0 AND yield_pct <= 100),
    -- Tiempos para OEE
    planned_time_min    REAL DEFAULT 0 CHECK(planned_time_min >= 0),
    actual_run_time_min REAL DEFAULT 0 CHECK(actual_run_time_min >= 0),
    downtime_min        REAL DEFAULT 0 CHECK(downtime_min >= 0),
    -- OEE components
    oee_availability    REAL CHECK(oee_availability >= 0 AND oee_availability <= 1),
    oee_performance     REAL CHECK(oee_performance >= 0 AND oee_performance <= 1),
    oee_quality         REAL CHECK(oee_quality >= 0 AND oee_quality <= 1),
    oee_overall         REAL CHECK(oee_overall >= 0 AND oee_overall <= 1),
    notes           TEXT,
    closed_at       TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_batch_machine ON sawmill_batches(machine_id);
CREATE INDEX idx_batch_status ON sawmill_batches(status);
CREATE INDEX idx_batch_date ON sawmill_batches(batch_date);

-- ---------------------- TROZAS DE ENTRADA AL BATCH ----------------------
CREATE TABLE IF NOT EXISTS batch_input_logs (
    batch_input_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id        INTEGER NOT NULL REFERENCES sawmill_batches(batch_id),
    log_id          INTEGER NOT NULL REFERENCES logs(log_id),
    input_volume_m3 REAL NOT NULL CHECK(input_volume_m3 > 0),
    scanned_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    scanned_by      INTEGER REFERENCES users(user_id),
    UNIQUE(batch_id, log_id)
);

CREATE INDEX idx_batch_input_batch ON batch_input_logs(batch_id);
CREATE INDEX idx_batch_input_log ON batch_input_logs(log_id);

-- ---------------------- SKU / PRODUCTOS FINALES ----------------------
CREATE TABLE IF NOT EXISTS sku_catalog (
    sku_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    species         TEXT,
    product_type    TEXT NOT NULL CHECK(product_type IN ('tabla','bloque','liston','viga','otro')),
    thickness_mm    REAL CHECK(thickness_mm > 0),
    width_mm        REAL CHECK(width_mm > 0),
    length_mm       REAL CHECK(length_mm > 0),
    unit_volume_m3  REAL CHECK(unit_volume_m3 > 0),
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------- PAQUETES DE SALIDA ----------------------
CREATE TABLE IF NOT EXISTS packages (
    package_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    qr_code         TEXT NOT NULL UNIQUE,
    batch_id        INTEGER NOT NULL REFERENCES sawmill_batches(batch_id),
    sku_id          INTEGER REFERENCES sku_catalog(sku_id),
    package_code    TEXT NOT NULL,
    species         TEXT NOT NULL,
    piece_count     INTEGER NOT NULL DEFAULT 0 CHECK(piece_count >= 0),
    volume_m3       REAL NOT NULL CHECK(volume_m3 >= 0),
    quality_grade   TEXT DEFAULT 'primera' CHECK(quality_grade IN ('primera','segunda','tercera','rechazo')),
    status          TEXT NOT NULL DEFAULT 'producido'
                        CHECK(status IN ('producido','en_secado','seco','empaquetado','despachado','vendido')),
    -- Herencia proporcional de trozas de origen
    -- Se almacena en tabla package_log_lineage
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_packages_batch ON packages(batch_id);
CREATE INDEX idx_packages_sku ON packages(sku_id);
CREATE INDEX idx_packages_qr ON packages(qr_code);
CREATE INDEX idx_packages_status ON packages(status);

-- ---------------------- HERENCIA PROPORCIONAL: PAQUETE ← TROZA ----------------------
CREATE TABLE IF NOT EXISTS package_log_lineage (
    lineage_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id      INTEGER NOT NULL REFERENCES packages(package_id),
    log_id          INTEGER NOT NULL REFERENCES logs(log_id),
    tree_id         INTEGER NOT NULL REFERENCES trees(tree_id),
    proportion_pct  REAL NOT NULL CHECK(proportion_pct > 0 AND proportion_pct <= 100),
    volume_from_log_m3 REAL NOT NULL CHECK(volume_from_log_m3 >= 0),
    UNIQUE(package_id, log_id)
);

CREATE INDEX idx_lineage_package ON package_log_lineage(package_id);
CREATE INDEX idx_lineage_log ON package_log_lineage(log_id);
CREATE INDEX idx_lineage_tree ON package_log_lineage(tree_id);

-- ---------------------- PARADAS DE MÁQUINA ----------------------
CREATE TABLE IF NOT EXISTS machine_downtimes (
    downtime_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    batch_id        INTEGER REFERENCES sawmill_batches(batch_id),
    machine_id      INTEGER NOT NULL REFERENCES machines(machine_id),
    start_time      TEXT NOT NULL,
    end_time        TEXT,
    duration_min    REAL CHECK(duration_min >= 0),
    cause           TEXT NOT NULL CHECK(cause IN ('mecanica','electrica','material','cambio_setup','programada','sin_material','otra')),
    is_planned      INTEGER NOT NULL DEFAULT 0,
    description     TEXT,
    resolved_by     INTEGER REFERENCES users(user_id),
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_downtime_batch ON machine_downtimes(batch_id);
CREATE INDEX idx_downtime_machine ON machine_downtimes(machine_id);

-- ---------------------- PROCESOS DE SECADO ----------------------
CREATE TABLE IF NOT EXISTS drying_processes (
    drying_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    machine_id      INTEGER NOT NULL REFERENCES machines(machine_id),  -- horno
    operator_id     INTEGER REFERENCES users(user_id),
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    status          TEXT NOT NULL DEFAULT 'en_proceso'
                        CHECK(status IN ('en_proceso','completado','abortado')),
    initial_moisture_pct REAL CHECK(initial_moisture_pct >= 0 AND initial_moisture_pct <= 100),
    final_moisture_pct   REAL CHECK(final_moisture_pct >= 0 AND final_moisture_pct <= 100),
    target_moisture_pct  REAL CHECK(target_moisture_pct >= 0 AND target_moisture_pct <= 100),
    energy_kwh      REAL CHECK(energy_kwh >= 0),
    energy_cost_cop REAL CHECK(energy_cost_cop >= 0),
    total_volume_m3 REAL CHECK(total_volume_m3 >= 0),
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_drying_machine ON drying_processes(machine_id);
CREATE INDEX idx_drying_status ON drying_processes(status);

-- ---------------------- PAQUETES EN SECADO ----------------------
CREATE TABLE IF NOT EXISTS drying_packages (
    drying_pkg_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    drying_id       INTEGER NOT NULL REFERENCES drying_processes(drying_id),
    package_id      INTEGER NOT NULL REFERENCES packages(package_id),
    initial_moisture_pct REAL,
    final_moisture_pct   REAL,
    UNIQUE(drying_id, package_id)
);

CREATE INDEX idx_drying_pkg_drying ON drying_packages(drying_id);
CREATE INDEX idx_drying_pkg_package ON drying_packages(package_id);
