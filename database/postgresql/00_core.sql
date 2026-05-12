-- ============================================================
-- FMS PostgreSQL + PostGIS: 00 - Extensiones, Schema y Core
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema dedicado
CREATE SCHEMA IF NOT EXISTS fms;
SET search_path TO fms, public;

-- ===================== RBAC =====================
CREATE TABLE fms.roles (
    role_id      SERIAL PRIMARY KEY,
    role_name    VARCHAR(50) NOT NULL UNIQUE,
    description  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fms.permissions (
    permission_id SERIAL PRIMARY KEY,
    code          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fms.role_permissions (
    role_id       INT NOT NULL REFERENCES fms.roles(role_id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES fms.permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE fms.users (
    user_id       SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    username      VARCHAR(100) NOT NULL UNIQUE,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT NOT NULL REFERENCES fms.roles(role_id),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON fms.users(role_id);
CREATE INDEX idx_users_uuid ON fms.users(uuid);
CREATE INDEX idx_users_email ON fms.users(email);

-- ===================== DISPOSITIVOS MÓVILES =====================
CREATE TABLE fms.devices (
    device_id     SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id       INT NOT NULL REFERENCES fms.users(user_id),
    device_name   VARCHAR(255),
    device_model  VARCHAR(100),
    os_version    VARCHAR(50),
    app_version   VARCHAR(20),
    last_sync_at  TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_user ON fms.devices(user_id);

-- ===================== SYNC LEDGER (servidor) =====================
CREATE TABLE fms.sync_ledger (
    ledger_id     BIGSERIAL PRIMARY KEY,
    device_uuid   UUID NOT NULL,
    user_id       INT NOT NULL REFERENCES fms.users(user_id),
    entity_table  VARCHAR(100) NOT NULL,
    entity_id     BIGINT NOT NULL,
    operation     VARCHAR(10) NOT NULL CHECK(operation IN ('INSERT','UPDATE','DELETE')),
    payload_json  JSONB NOT NULL,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolution    VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                      CHECK(resolution IN ('pendiente','sincronizado','conflicto','rechazado')),
    conflict_details JSONB,
    resolved_at   TIMESTAMPTZ,
    resolved_by   INT REFERENCES fms.users(user_id)
);

CREATE INDEX idx_sync_resolution ON fms.sync_ledger(resolution);
CREATE INDEX idx_sync_entity ON fms.sync_ledger(entity_table, entity_id);
CREATE INDEX idx_sync_device ON fms.sync_ledger(device_uuid);
CREATE INDEX idx_sync_server_ts ON fms.sync_ledger(server_timestamp);

-- ===================== AUDIT LOG =====================
CREATE TABLE fms.audit_log (
    audit_id      BIGSERIAL PRIMARY KEY,
    entity_table  VARCHAR(100) NOT NULL,
    entity_id     BIGINT NOT NULL,
    action        VARCHAR(20) NOT NULL CHECK(action IN ('CREATE','UPDATE','DELETE','STATUS_CHANGE','CUSTODY_TRANSFER')),
    old_values    JSONB,
    new_values    JSONB,
    user_id       INT NOT NULL REFERENCES fms.users(user_id),
    device_uuid   UUID,
    ip_address    INET,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Particionamiento por rango de tiempo para rendimiento a largo plazo
CREATE INDEX idx_audit_entity ON fms.audit_log(entity_table, entity_id);
CREATE INDEX idx_audit_ts ON fms.audit_log(timestamp);
CREATE INDEX idx_audit_user ON fms.audit_log(user_id);
CREATE INDEX idx_audit_action ON fms.audit_log(action);

-- ===================== CADENA DE CUSTODIA =====================
CREATE TABLE fms.custody_events (
    custody_id    BIGSERIAL PRIMARY KEY,
    entity_table  VARCHAR(100) NOT NULL,
    entity_id     BIGINT NOT NULL,
    stage_from    VARCHAR(50) NOT NULL,
    stage_to      VARCHAR(50) NOT NULL,
    responsible_from INT REFERENCES fms.users(user_id),
    responsible_to   INT NOT NULL REFERENCES fms.users(user_id),
    location      GEOMETRY(Point, 4326),
    notes         TEXT,
    evidence_url  TEXT,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_custody_entity ON fms.custody_events(entity_table, entity_id);
CREATE INDEX idx_custody_ts ON fms.custody_events(timestamp);
CREATE INDEX idx_custody_location ON fms.custody_events USING GIST(location);

-- ===================== CONFIGURACIÓN GLOBAL =====================
CREATE TABLE fms.global_config (
    config_key    VARCHAR(100) PRIMARY KEY,
    config_value  TEXT NOT NULL,
    description   TEXT,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by    INT REFERENCES fms.users(user_id)
);

-- ===================== FUNCIÓN: updated_at automático =====================
CREATE OR REPLACE FUNCTION fms.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================== TRIGGER: inmutabilidad audit_log =====================
CREATE OR REPLACE FUNCTION fms.fn_prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Los registros de auditoría son inmutables y no pueden ser modificados ni eliminados.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON fms.audit_log
    FOR EACH ROW EXECUTE FUNCTION fms.fn_prevent_audit_mutation();

-- ===================== TRIGGER: inmutabilidad custody_events =====================
CREATE OR REPLACE FUNCTION fms.fn_prevent_custody_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_immutable = TRUE THEN
        RAISE EXCEPTION 'Los eventos de custodia inmutables no pueden ser modificados.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_custody_immutable
    BEFORE UPDATE OR DELETE ON fms.custody_events
    FOR EACH ROW EXECUTE FUNCTION fms.fn_prevent_custody_mutation();

-- ===================== SEED: Roles =====================
INSERT INTO fms.roles (role_name, description) VALUES
    ('admin',              'Administrador - Configuración global y permisos'),
    ('gerencia',           'Gerencia - Tableros rendimiento, mermas, costos, rentabilidad'),
    ('ingeniero_forestal', 'Ingeniero Forestal - Inventarios, volumetría, nutrición'),
    ('jefe_campo',         'Jefe de Campo - Supervisión cuadrillas, asignación tareas'),
    ('operario',           'Operario Android - Captura offline, escaneo QR'),
    ('jefe_planta',        'Jefe de Planta - Recepción trozas, aserrío, secado, OEE'),
    ('finanzas',           'Finanzas - Costos, COP/m3, liquidación contratistas'),
    ('auditor',            'Auditor - Cadena custodia y evidencias (solo lectura)'),
    ('contratista',        'Contratista - Consulta tareas asignadas')
ON CONFLICT (role_name) DO NOTHING;

-- ===================== SEED: Configuración =====================
INSERT INTO fms.global_config (config_key, config_value, description) VALUES
    ('safety_factor_default',   '3.0',   'Factor de seguridad para SWL'),
    ('gravity_ms2',             '9.81',  'Aceleración gravedad m/s2'),
    ('shrinkage_threshold_pct', '1.5',   'Umbral merma transporte (%)'),
    ('default_form_factor',     '0.65',  'Factor de forma volumen'),
    ('currency',                'COP',   'Moneda de costeo'),
    ('oee_target_min',          '0.85',  'OEE objetivo mínimo'),
    ('yield_target_min_pct',    '45',    'Yield aserrío objetivo mínimo (%)')
ON CONFLICT (config_key) DO NOTHING;
