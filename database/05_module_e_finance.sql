-- ============================================================
-- FMS - SQLite Schema: MODULE E - Finanzas y Costeo ABC
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- ACTIVIDADES DE COSTEO ABC ----------------------
CREATE TABLE IF NOT EXISTS cost_activities (
    activity_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    module          TEXT NOT NULL CHECK(module IN ('silvicultura','aprovechamiento','logistica','aserrio','secado','general')),
    cost_driver     TEXT NOT NULL CHECK(cost_driver IN ('m3','hora_maquina','hora_hombre','viaje','hectarea','kwh','unidad')),
    is_direct       INTEGER NOT NULL DEFAULT 1,  -- 1=directo, 0=indirecto
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

-- ---------------------- REGISTROS DE COSTOS ----------------------
CREATE TABLE IF NOT EXISTS cost_entries (
    entry_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    activity_id     INTEGER NOT NULL REFERENCES cost_activities(activity_id),
    -- Entidad a la que se asigna el costo
    entity_table    TEXT NOT NULL,  -- 'predios','rodales','work_orders','sawmill_batches','drying_processes','transport_manifests'
    entity_id       INTEGER NOT NULL,
    entry_date      TEXT NOT NULL,
    description     TEXT,
    -- Cantidades
    quantity        REAL NOT NULL CHECK(quantity > 0),
    unit            TEXT NOT NULL,            -- m3, horas, viajes, ha, kwh
    unit_cost_cop   REAL NOT NULL CHECK(unit_cost_cop >= 0),
    total_cost_cop  REAL NOT NULL CHECK(total_cost_cop >= 0),  -- quantity * unit_cost_cop
    -- Referencia documental
    invoice_number  TEXT,
    supplier        TEXT,
    notes           TEXT,
    status          TEXT NOT NULL DEFAULT 'registrado'
                        CHECK(status IN ('registrado','aprobado','rechazado','anulado')),
    approved_by     INTEGER REFERENCES users(user_id),
    approved_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_cost_entry_activity ON cost_entries(activity_id);
CREATE INDEX idx_cost_entry_entity ON cost_entries(entity_table, entity_id);
CREATE INDEX idx_cost_entry_date ON cost_entries(entry_date);
CREATE INDEX idx_cost_entry_status ON cost_entries(status);

-- ---------------------- COSTO ACUMULADO POR ENTIDAD ----------------------
-- Tabla desnormalizada para consulta rápida del COP/m3
CREATE TABLE IF NOT EXISTS cost_accumulator (
    accumulator_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_table    TEXT NOT NULL,
    entity_id       INTEGER NOT NULL,
    total_direct_cop    REAL NOT NULL DEFAULT 0,
    total_indirect_cop  REAL NOT NULL DEFAULT 0,
    total_cost_cop      REAL NOT NULL DEFAULT 0,
    total_volume_m3     REAL NOT NULL DEFAULT 0 CHECK(total_volume_m3 >= 0),
    cost_per_m3_cop     REAL DEFAULT 0,      -- total_cost / volume
    last_calculated     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE(entity_table, entity_id)
);

CREATE INDEX idx_accumulator_entity ON cost_accumulator(entity_table, entity_id);

-- ---------------------- CONTRATISTAS ----------------------
CREATE TABLE IF NOT EXISTS contractors (
    contractor_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    doc_type        TEXT CHECK(doc_type IN ('CC','NIT','CE','pasaporte')),
    doc_number      TEXT NOT NULL UNIQUE,
    phone           TEXT,
    email           TEXT,
    bank_name       TEXT,
    bank_account    TEXT,
    account_type    TEXT CHECK(account_type IN ('ahorros','corriente')),
    specialty       TEXT,  -- tala, transporte, aserrío, etc.
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

-- ---------------------- LIQUIDACIÓN DE CONTRATISTAS ----------------------
CREATE TABLE IF NOT EXISTS contractor_settlements (
    settlement_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,
    code            TEXT NOT NULL UNIQUE,
    contractor_id   INTEGER NOT NULL REFERENCES contractors(contractor_id),
    period_start    TEXT NOT NULL,
    period_end      TEXT NOT NULL,
    -- Basado en volumen REAL validado en báscula/recepción
    validated_volume_m3 REAL NOT NULL CHECK(validated_volume_m3 >= 0),
    rate_cop_per_m3     REAL NOT NULL CHECK(rate_cop_per_m3 >= 0),
    subtotal_cop        REAL NOT NULL CHECK(subtotal_cop >= 0),
    deductions_cop      REAL NOT NULL DEFAULT 0 CHECK(deductions_cop >= 0),
    additions_cop       REAL NOT NULL DEFAULT 0 CHECK(additions_cop >= 0),
    total_cop           REAL NOT NULL CHECK(total_cop >= 0),
    status          TEXT NOT NULL DEFAULT 'borrador'
                        CHECK(status IN ('borrador','calculado','aprobado','pagado','anulado')),
    -- Fuente de datos: SOLO recepción de planta o báscula
    data_source     TEXT NOT NULL DEFAULT 'recepcion_planta'
                        CHECK(data_source IN ('recepcion_planta','bascula')),
    approved_by     INTEGER REFERENCES users(user_id),
    approved_at     TEXT,
    paid_at         TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    created_by      INTEGER REFERENCES users(user_id),
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
);

CREATE INDEX idx_settlement_contractor ON contractor_settlements(contractor_id);
CREATE INDEX idx_settlement_status ON contractor_settlements(status);
CREATE INDEX idx_settlement_period ON contractor_settlements(period_start, period_end);

-- ---------------------- DETALLE DE LIQUIDACIÓN ----------------------
CREATE TABLE IF NOT EXISTS settlement_details (
    detail_id       INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_id   INTEGER NOT NULL REFERENCES contractor_settlements(settlement_id),
    reception_id    INTEGER REFERENCES plant_receptions(reception_id),
    manifest_id     INTEGER REFERENCES transport_manifests(manifest_id),
    log_id          INTEGER REFERENCES logs(log_id),
    volume_m3       REAL NOT NULL CHECK(volume_m3 >= 0),
    unit_rate_cop   REAL NOT NULL CHECK(unit_rate_cop >= 0),
    line_total_cop  REAL NOT NULL CHECK(line_total_cop >= 0),
    notes           TEXT
);

CREATE INDEX idx_settlement_detail ON settlement_details(settlement_id);
