-- ============================================================
-- FMS - SQLite Schema: MODULE F - BI, Dashboard Data & Seed Data
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------------------- VISTAS PARA DASHBOARD BI ----------------------

-- Vista: Trazabilidad inversa completa (SKU → Predio)
CREATE VIEW IF NOT EXISTS vw_full_traceability AS
SELECT
    p.package_id,
    p.qr_code          AS package_qr,
    p.package_code,
    p.volume_m3         AS package_volume_m3,
    p.quality_grade     AS package_quality,
    p.status            AS package_status,
    sk.code             AS sku_code,
    sk.name             AS sku_name,
    sb.batch_id,
    sb.code             AS batch_code,
    sb.batch_date,
    sb.yield_pct        AS batch_yield,
    sb.oee_overall      AS batch_oee,
    pll.proportion_pct,
    pll.volume_from_log_m3,
    l.log_id,
    l.qr_code           AS log_qr,
    l.volume_m3          AS log_volume_m3,
    l.quality_grade      AS log_quality,
    t.tree_id,
    t.code               AS tree_code,
    t.species,
    t.dap_m,
    t.commercial_height_m,
    t.volume_m3          AS tree_volume_m3,
    pa.parcela_id,
    pa.code              AS parcela_code,
    r.rodal_id,
    r.code               AS rodal_code,
    r.species            AS rodal_species,
    pr.predio_id,
    pr.code              AS predio_code,
    pr.name              AS predio_name
FROM packages p
LEFT JOIN sku_catalog sk ON p.sku_id = sk.sku_id
JOIN sawmill_batches sb ON p.batch_id = sb.batch_id
LEFT JOIN package_log_lineage pll ON p.package_id = pll.package_id
LEFT JOIN logs l ON pll.log_id = l.log_id
LEFT JOIN trees t ON l.tree_id = t.tree_id
LEFT JOIN parcelas pa ON t.parcela_id = pa.parcela_id
LEFT JOIN rodales r ON pa.rodal_id = r.rodal_id
LEFT JOIN predios pr ON r.predio_id = pr.predio_id;

-- Vista: Resumen OEE por batch
CREATE VIEW IF NOT EXISTS vw_oee_summary AS
SELECT
    sb.batch_id,
    sb.code             AS batch_code,
    sb.batch_date,
    m.code              AS machine_code,
    m.name              AS machine_name,
    sb.planned_time_min,
    sb.actual_run_time_min,
    sb.downtime_min,
    sb.oee_availability,
    sb.oee_performance,
    sb.oee_quality,
    sb.oee_overall,
    sb.input_volume_m3,
    sb.output_volume_m3,
    sb.yield_pct
FROM sawmill_batches sb
JOIN machines m ON sb.machine_id = m.machine_id;

-- Vista: Mermas de transporte
CREATE VIEW IF NOT EXISTS vw_shrinkage_report AS
SELECT
    pr.reception_id,
    tm.code             AS manifest_code,
    tm.truck_plate,
    tm.transporter,
    pr.dispatched_volume_m3,
    pr.received_volume_m3,
    pr.shrinkage_m3,
    pr.shrinkage_pct,
    pr.shrinkage_alert,
    pr.shrinkage_threshold_pct,
    pr.conciliation_status,
    pr.reception_date,
    r.code              AS rodal_code,
    p.code              AS predio_code
FROM plant_receptions pr
JOIN transport_manifests tm ON pr.manifest_id = tm.manifest_id
LEFT JOIN rodales r ON tm.origin_rodal_id = r.rodal_id
LEFT JOIN predios p ON r.predio_id = p.predio_id;

-- Vista: Costos acumulados COP/m3
CREATE VIEW IF NOT EXISTS vw_cost_per_m3 AS
SELECT
    ca.entity_table,
    ca.entity_id,
    ca.total_direct_cop,
    ca.total_indirect_cop,
    ca.total_cost_cop,
    ca.total_volume_m3,
    ca.cost_per_m3_cop,
    ca.last_calculated
FROM cost_accumulator ca
WHERE ca.total_volume_m3 > 0;

-- Vista: Alertas activas
CREATE VIEW IF NOT EXISTS vw_active_alerts AS
SELECT
    aa.alert_id,
    aa.alert_type,
    aa.severity,
    aa.entity_table,
    aa.entity_id,
    aa.title,
    aa.description,
    aa.deadline,
    aa.status,
    u.full_name AS assigned_to_name,
    aa.created_at
FROM agronomic_alerts aa
LEFT JOIN users u ON aa.assigned_to = u.user_id
WHERE aa.status IN ('abierta', 'en_progreso');

-- ---------------------- TRIGGERS DE AUDITORÍA ----------------------

-- Trigger: Impedir cierre de alerta sin evidencia fotográfica
CREATE TRIGGER IF NOT EXISTS trg_alert_require_photo
BEFORE UPDATE ON agronomic_alerts
WHEN NEW.status = 'cerrada' AND (NEW.evidence_photo IS NULL OR NEW.evidence_photo = '')
BEGIN
    SELECT RAISE(ABORT, 'ERROR: No se puede cerrar una alerta sin evidencia fotográfica.');
END;

-- Trigger: Auto-calcular volumen de árbol al insertar
CREATE TRIGGER IF NOT EXISTS trg_tree_calc_volume_insert
BEFORE INSERT ON trees
WHEN NEW.volume_m3 = 0 OR NEW.volume_m3 IS NULL
BEGIN
    SELECT RAISE(ABORT, 'ERROR: volume_m3 debe ser calculado antes de insertar. Usar: (PI/4) * DAP^2 * h * f');
END;

-- Trigger: Bloquear cambio de registros sincronizados en audit_log
CREATE TRIGGER IF NOT EXISTS trg_audit_immutable
BEFORE UPDATE ON audit_log
WHEN OLD.is_synced = 1
BEGIN
    SELECT RAISE(ABORT, 'ERROR: Los registros de auditoría sincronizados son inmutables.');
END;

-- Trigger: Bloquear cambio de eventos de custodia sincronizados
CREATE TRIGGER IF NOT EXISTS trg_custody_immutable
BEFORE UPDATE ON custody_events
WHEN OLD.is_synced = 1
BEGIN
    SELECT RAISE(ABORT, 'ERROR: Los eventos de custodia sincronizados son inmutables.');
END;

-- ---------------------- SEED DATA: ROLES ----------------------
INSERT OR IGNORE INTO roles (role_name, description) VALUES
    ('admin',              'Administrador del sistema - Configuración global y permisos'),
    ('gerencia',           'Gerencia - Tableros de rendimiento, mermas, costos y rentabilidad'),
    ('ingeniero_forestal', 'Ingeniero Forestal - Inventarios silviculturales, volumetría, nutrición'),
    ('jefe_campo',         'Jefe de Campo - Supervisión de cuadrillas, asignación de tareas'),
    ('operario',           'Operario Android - Captura offline en campo, escaneo QR'),
    ('jefe_planta',        'Jefe de Planta - Recepción de trozas, aserrío, secado, OEE'),
    ('finanzas',           'Finanzas - Costos directos/indirectos, COP/m3, liquidación contratistas'),
    ('auditor',            'Auditor - Cadena de custodia y evidencias (solo lectura)'),
    ('contratista',        'Contratista - Consulta tareas asignadas bajo permisos acotados');

-- ---------------------- SEED DATA: CONFIGURACIÓN GLOBAL ----------------------
INSERT OR IGNORE INTO global_config (config_key, config_value, description) VALUES
    ('safety_factor_default',     '3.0',   'Factor de seguridad por defecto para cálculo de SWL'),
    ('gravity_ms2',               '9.81',  'Aceleración de la gravedad m/s2'),
    ('shrinkage_threshold_pct',   '1.5',   'Umbral de merma de transporte para alerta crítica (%)'),
    ('default_form_factor',       '0.65',  'Factor de forma por defecto para cálculo de volumen'),
    ('currency',                  'COP',   'Moneda para costeo'),
    ('oee_target_min',            '0.85',  'OEE objetivo mínimo'),
    ('yield_target_min_pct',      '45',    'Rendimiento de aserrío objetivo mínimo (%)');
