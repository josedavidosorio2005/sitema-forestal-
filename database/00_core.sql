-- ============================================================
-- FMS - SQLite Schema: CORE (Users, RBAC, Sync, Audit)
-- ============================================================
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------- RBAC ----------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name       TEXT NOT NULL UNIQUE,  -- admin, gerencia, ingeniero_forestal, jefe_campo, operario, jefe_planta, finanzas, auditor, contratista
    description     TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS permissions (
    permission_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT NOT NULL UNIQUE,   -- e.g. 'module_a.tree.create'
    description     TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         INTEGER NOT NULL REFERENCES roles(role_id),
    permission_id   INTEGER NOT NULL REFERENCES permissions(permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    user_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid            TEXT NOT NULL UNIQUE,   -- UUID v4 server-generated
    username        TEXT NOT NULL UNIQUE,
    full_name       TEXT NOT NULL,
    email           TEXT,
    password_hash   TEXT NOT NULL,
    role_id         INTEGER NOT NULL REFERENCES roles(role_id),
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_uuid ON users(uuid);

-- ---------------------- SYNC QUEUE ----------------------
CREATE TABLE IF NOT EXISTS sync_queue (
    queue_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_table    TEXT NOT NULL,          -- target table name
    entity_id       INTEGER NOT NULL,       -- PK in target table
    operation       TEXT NOT NULL CHECK(operation IN ('INSERT','UPDATE','DELETE')),
    payload_json    TEXT NOT NULL,           -- full row as JSON
    sync_status     TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK(sync_status IN ('pendiente','sincronizado','conflicto','rechazado')),
    device_id       TEXT NOT NULL,
    user_id         INTEGER NOT NULL REFERENCES users(user_id),
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    synced_at       TEXT,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    error_message   TEXT
);

CREATE INDEX idx_sync_status ON sync_queue(sync_status);
CREATE INDEX idx_sync_entity ON sync_queue(entity_table, entity_id);

-- ---------------------- AUDIT TRAIL ----------------------
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_table    TEXT NOT NULL,
    entity_id       INTEGER NOT NULL,
    action          TEXT NOT NULL CHECK(action IN ('CREATE','UPDATE','DELETE','STATUS_CHANGE','CUSTODY_TRANSFER')),
    old_values_json TEXT,
    new_values_json TEXT,
    user_id         INTEGER NOT NULL REFERENCES users(user_id),
    device_id       TEXT,
    ip_address      TEXT,
    timestamp       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    is_synced       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_audit_entity ON audit_log(entity_table, entity_id);
CREATE INDEX idx_audit_ts ON audit_log(timestamp);

-- ---------------------- CHAIN OF CUSTODY ----------------------
CREATE TABLE IF NOT EXISTS custody_events (
    custody_id      INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_table    TEXT NOT NULL,          -- e.g. 'logs','packages'
    entity_id       INTEGER NOT NULL,
    stage_from      TEXT NOT NULL,
    stage_to        TEXT NOT NULL,
    responsible_from INTEGER REFERENCES users(user_id),
    responsible_to  INTEGER NOT NULL REFERENCES users(user_id),
    location_lat    REAL,
    location_lon    REAL,
    notes           TEXT,
    evidence_photo  TEXT,                   -- local file path
    timestamp       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    is_synced       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_custody_entity ON custody_events(entity_table, entity_id);

-- ---------------------- GLOBAL CONFIG ----------------------
CREATE TABLE IF NOT EXISTS global_config (
    config_key      TEXT PRIMARY KEY,
    config_value    TEXT NOT NULL,
    description     TEXT,
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_by      INTEGER REFERENCES users(user_id)
);
