-- ============================================================
-- FMS PostgreSQL + PostGIS: 01 - Módulo A: Silvicultura
-- ============================================================
SET search_path TO fms, public;

-- ===================== PREDIOS =====================
CREATE TABLE fms.predios (
    predio_id     SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    code          VARCHAR(50) NOT NULL UNIQUE,
    name          VARCHAR(255) NOT NULL,
    department    VARCHAR(100),
    municipality  VARCHAR(100),
    total_area_ha NUMERIC(12,4) NOT NULL CHECK(total_area_ha > 0),
    boundary      GEOMETRY(MultiPolygon, 4326),
    centroid      GEOMETRY(Point, 4326),
    owner_name    VARCHAR(255),
    owner_doc     VARCHAR(50),
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    INT REFERENCES fms.users(user_id)
);

CREATE INDEX idx_predios_code ON fms.predios(code);
CREATE INDEX idx_predios_boundary ON fms.predios USING GIST(boundary);
CREATE INDEX idx_predios_centroid ON fms.predios USING GIST(centroid);

CREATE TRIGGER trg_predios_updated
    BEFORE UPDATE ON fms.predios
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- ===================== RODALES =====================
CREATE TABLE fms.rodales (
    rodal_id      SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    predio_id     INT NOT NULL REFERENCES fms.predios(predio_id),
    code          VARCHAR(50) NOT NULL,
    species       VARCHAR(100) NOT NULL,
    planting_date DATE,
    area_ha       NUMERIC(12,4) NOT NULL CHECK(area_ha > 0),
    avg_slope_deg NUMERIC(5,2) DEFAULT 0,
    boundary      GEOMETRY(MultiPolygon, 4326),
    centroid      GEOMETRY(Point, 4326),
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    INT REFERENCES fms.users(user_id),
    UNIQUE(predio_id, code)
);

CREATE INDEX idx_rodales_predio ON fms.rodales(predio_id);
CREATE INDEX idx_rodales_boundary ON fms.rodales USING GIST(boundary);
CREATE INDEX idx_rodales_species ON fms.rodales(species);

CREATE TRIGGER trg_rodales_updated
    BEFORE UPDATE ON fms.rodales
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- ===================== PARCELAS =====================
CREATE TABLE fms.parcelas (
    parcela_id    SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    rodal_id      INT NOT NULL REFERENCES fms.rodales(rodal_id),
    code          VARCHAR(50) NOT NULL,
    area_ha       NUMERIC(12,4) CHECK(area_ha > 0),
    slope_deg     NUMERIC(5,2) DEFAULT 0,
    boundary      GEOMETRY(Polygon, 4326),
    centroid      GEOMETRY(Point, 4326),
    notes         TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    INT REFERENCES fms.users(user_id),
    UNIQUE(rodal_id, code)
);

CREATE INDEX idx_parcelas_rodal ON fms.parcelas(rodal_id);
CREATE INDEX idx_parcelas_boundary ON fms.parcelas USING GIST(boundary);

CREATE TRIGGER trg_parcelas_updated
    BEFORE UPDATE ON fms.parcelas
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- ===================== ÁRBOLES =====================
CREATE TABLE fms.trees (
    tree_id              SERIAL PRIMARY KEY,
    uuid                 UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    parcela_id           INT NOT NULL REFERENCES fms.parcelas(parcela_id),
    code                 VARCHAR(50) NOT NULL UNIQUE,
    species              VARCHAR(100) NOT NULL,
    dap_m                NUMERIC(6,4) NOT NULL CHECK(dap_m > 0),
    commercial_height_m  NUMERIC(6,2) NOT NULL CHECK(commercial_height_m > 0),
    total_height_m       NUMERIC(6,2),
    form_factor          NUMERIC(4,3) NOT NULL DEFAULT 0.650 CHECK(form_factor > 0 AND form_factor <= 1),
    volume_m3            NUMERIC(10,6) NOT NULL GENERATED ALWAYS AS (
                             (3.14159265358979 / 4.0) * dap_m * dap_m * commercial_height_m * form_factor
                         ) STORED,
    location             GEOMETRY(Point, 4326),
    gps_accuracy_m       NUMERIC(6,2),
    health_status        VARCHAR(20) NOT NULL DEFAULT 'sano'
                             CHECK(health_status IN ('sano','plaga','enfermo','muerto','intervenido')),
    status               VARCHAR(20) NOT NULL DEFAULT 'en_pie'
                             CHECK(status IN ('en_pie','marcado','talado')),
    photo_url            TEXT,
    notes                TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by           INT REFERENCES fms.users(user_id)
);

CREATE INDEX idx_trees_parcela ON fms.trees(parcela_id);
CREATE INDEX idx_trees_species ON fms.trees(species);
CREATE INDEX idx_trees_status ON fms.trees(status);
CREATE INDEX idx_trees_health ON fms.trees(health_status);
CREATE INDEX idx_trees_location ON fms.trees USING GIST(location);

CREATE TRIGGER trg_trees_updated
    BEFORE UPDATE ON fms.trees
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- ===================== ANÁLISIS DE SUELOS =====================
CREATE TABLE fms.soil_analyses (
    analysis_id      SERIAL PRIMARY KEY,
    uuid             UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    rodal_id         INT REFERENCES fms.rodales(rodal_id),
    parcela_id       INT REFERENCES fms.parcelas(parcela_id),
    sample_date      DATE NOT NULL,
    sample_location  GEOMETRY(Point, 4326),
    lab_name         VARCHAR(255),
    lab_reference    VARCHAR(100),
    ph               NUMERIC(4,2) CHECK(ph >= 0 AND ph <= 14),
    organic_matter_pct NUMERIC(6,3) CHECK(organic_matter_pct >= 0),
    nitrogen_ppm     NUMERIC(10,3) CHECK(nitrogen_ppm >= 0),
    phosphorus_ppm   NUMERIC(10,3) CHECK(phosphorus_ppm >= 0),
    potassium_ppm    NUMERIC(10,3) CHECK(potassium_ppm >= 0),
    calcium_ppm      NUMERIC(10,3) CHECK(calcium_ppm >= 0),
    magnesium_ppm    NUMERIC(10,3) CHECK(magnesium_ppm >= 0),
    sulfur_ppm       NUMERIC(10,3) CHECK(sulfur_ppm >= 0),
    boron_ppm        NUMERIC(10,3) CHECK(boron_ppm >= 0),
    zinc_ppm         NUMERIC(10,3) CHECK(zinc_ppm >= 0),
    iron_ppm         NUMERIC(10,3) CHECK(iron_ppm >= 0),
    manganese_ppm    NUMERIC(10,3) CHECK(manganese_ppm >= 0),
    copper_ppm       NUMERIC(10,3) CHECK(copper_ppm >= 0),
    texture_class    VARCHAR(50),
    cec              NUMERIC(8,3),
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       INT REFERENCES fms.users(user_id),
    CHECK (rodal_id IS NOT NULL OR parcela_id IS NOT NULL)
);

CREATE INDEX idx_soil_rodal ON fms.soil_analyses(rodal_id);
CREATE INDEX idx_soil_parcela ON fms.soil_analyses(parcela_id);
CREATE INDEX idx_soil_sample_loc ON fms.soil_analyses USING GIST(sample_location);

CREATE TRIGGER trg_soil_updated
    BEFORE UPDATE ON fms.soil_analyses
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- ===================== REQUERIMIENTOS NUTRICIONALES =====================
CREATE TABLE fms.species_nutrient_requirements (
    requirement_id         SERIAL PRIMARY KEY,
    species                VARCHAR(100) NOT NULL,
    growth_stage           VARCHAR(30) NOT NULL CHECK(growth_stage IN ('plantula','juvenil','adulto','cosecha')),
    nutrient               VARCHAR(30) NOT NULL,
    required_ppm           NUMERIC(10,3) NOT NULL CHECK(required_ppm >= 0),
    absorption_efficiency  NUMERIC(4,3) NOT NULL DEFAULT 0.700 CHECK(absorption_efficiency > 0 AND absorption_efficiency <= 1),
    nutrient_content_pct   NUMERIC(4,3) NOT NULL DEFAULT 0.460 CHECK(nutrient_content_pct > 0 AND nutrient_content_pct <= 1),
    notes                  TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(species, growth_stage, nutrient)
);

-- ===================== ALERTAS AGRONÓMICAS =====================
CREATE TABLE fms.agronomic_alerts (
    alert_id      SERIAL PRIMARY KEY,
    uuid          UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    alert_type    VARCHAR(20) NOT NULL CHECK(alert_type IN ('poda','plaga','fertilizacion','riego','sanitaria','otra')),
    severity      VARCHAR(10) NOT NULL DEFAULT 'media' CHECK(severity IN ('baja','media','alta','critica')),
    entity_table  VARCHAR(50) NOT NULL,
    entity_id     INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    assigned_to   INT REFERENCES fms.users(user_id),
    deadline      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'abierta'
                      CHECK(status IN ('abierta','en_progreso','cerrada','cancelada')),
    closed_at     TIMESTAMPTZ,
    closed_by     INT REFERENCES fms.users(user_id),
    closure_notes TEXT,
    evidence_url  TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    INT REFERENCES fms.users(user_id)
);

CREATE INDEX idx_alerts_status ON fms.agronomic_alerts(status);
CREATE INDEX idx_alerts_severity ON fms.agronomic_alerts(severity);
CREATE INDEX idx_alerts_assigned ON fms.agronomic_alerts(assigned_to);
CREATE INDEX idx_alerts_entity ON fms.agronomic_alerts(entity_table, entity_id);
CREATE INDEX idx_alerts_deadline ON fms.agronomic_alerts(deadline);

CREATE TRIGGER trg_alerts_updated
    BEFORE UPDATE ON fms.agronomic_alerts
    FOR EACH ROW EXECUTE FUNCTION fms.fn_set_updated_at();

-- Trigger: impedir cierre sin evidencia
CREATE OR REPLACE FUNCTION fms.fn_alert_require_evidence()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cerrada' AND (NEW.evidence_url IS NULL OR NEW.evidence_url = '') THEN
        RAISE EXCEPTION 'No se puede cerrar una alerta sin evidencia fotográfica (evidence_url).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alert_require_evidence
    BEFORE UPDATE ON fms.agronomic_alerts
    FOR EACH ROW
    WHEN (NEW.status = 'cerrada')
    EXECUTE FUNCTION fms.fn_alert_require_evidence();
