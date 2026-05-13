import {
  calculatePolygonArea,
  polygonIsInsidePolygon,
} from '../utils/helpers';

const DB_KEY = 'forest-analysis-mobile-db-v1';
const VALID_SPECIES_TYPES = ['nativa', 'introducida', 'invasora', 'ornamental', 'comercial'];
const VALID_USE_TYPES = ['plantacion', 'recoleccion', 'conservacion', 'mixto'];
const VALID_OPERATION_TYPES = ['sembrar', 'recolectar', 'monitorear'];

const seedSpecies = [
  {
    id: 1,
    user_id: 1,
    common_name: 'Pino',
    scientific_name: 'Pinus patula',
    type: 'comercial',
    description: 'Especie comercial usada en plantaciones forestales.',
    region: 'Andina',
    image_url: null,
    observations: 'Color azul en subzonas.',
  },
  {
    id: 2,
    user_id: 1,
    common_name: 'Cedro',
    scientific_name: 'Cedrela odorata',
    type: 'nativa',
    description: 'Especie nativa de alto valor forestal.',
    region: 'Tropical',
    image_url: null,
    observations: '',
  },
  {
    id: 3,
    user_id: 1,
    common_name: 'Eucalipto',
    scientific_name: 'Eucalyptus globulus',
    type: 'comercial',
    description: 'Especie comercial de crecimiento rapido.',
    region: 'Andina',
    image_url: null,
    observations: '',
  },
].map((item) => ({
  ...item,
  created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
  deleted_at: null,
}));

function initialDb() {
  return {
    counters: {
      zones: 1,
      species: seedSpecies.length + 1,
      reports: 1,
      subzones: 1,
    },
    zones: [],
    species: seedSpecies,
    reports: [],
    subzones: [],
  };
}

function now() {
  return new Date().toISOString();
}

function loadDb() {
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return initialDb();

    const parsed = JSON.parse(raw);
    return {
      ...initialDb(),
      ...parsed,
      counters: {
        ...initialDb().counters,
        ...(parsed.counters || {}),
      },
    };
  } catch {
    return initialDb();
  }
}

function saveDb(db) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function nextId(db, collection) {
  const id = db.counters[collection] || 1;
  db.counters[collection] = id + 1;
  return id;
}

function ok(data, message = 'Operacion local completada.') {
  return Promise.resolve({
    status: 200,
    data: {
      success: true,
      message,
      data,
      local: true,
    },
  });
}

function fail(message, status = 400) {
  const error = new Error(message);
  error.friendlyMessage = message;
  error.response = {
    status,
    data: {
      success: false,
      message,
    },
  };
  throw error;
}

function activeItems(items) {
  return items.filter((item) => !item.deleted_at);
}

function findZone(db, id) {
  const zone = db.zones.find((item) => Number(item.id) === Number(id) && !item.deleted_at);
  if (!zone) fail('Zona no encontrada en el dispositivo.', 404);
  return zone;
}

function findSpecies(db, id) {
  const species = db.species.find((item) => Number(item.id) === Number(id) && !item.deleted_at);
  if (!species) fail('Especie no encontrada en el dispositivo.', 404);
  return species;
}

function findSubzone(db, id) {
  const subzone = db.subzones.find((item) => Number(item.id) === Number(id) && !item.deleted_at);
  if (!subzone) fail('Subzona no encontrada en el dispositivo.', 404);
  return subzone;
}

function normalizePolygon(geometry) {
  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) {
    fail('Dibuja un poligono valido antes de guardar.', 400);
  }

  const ring = geometry.coordinates[0];
  if (ring.length < 4) fail('El poligono debe tener al menos 3 puntos.', 400);

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

function withSpeciesNames(db, subzone) {
  const species = subzone.tree_species_id
    ? db.species.find((item) => Number(item.id) === Number(subzone.tree_species_id) && !item.deleted_at)
    : null;

  return {
    ...subzone,
    species_common_name: species?.common_name || null,
    species_scientific_name: species?.scientific_name || null,
  };
}

function calculateVegetation(zone) {
  const area = Number(zone.area_ha || 0);
  const coverage = Math.max(35, Math.min(92, Math.round(55 + (area % 35))));
  const density = coverage >= 75 ? 'alto' : coverage >= 50 ? 'medio' : 'bajo';

  return {
    vegetation_coverage: coverage,
    forest_density: density,
  };
}

function probableSpeciesFor(db, region) {
  const cleanRegion = String(region || '').trim().toLowerCase();
  const catalog = activeItems(db.species);
  const sorted = [...catalog].sort((a, b) => {
    const aMatches = cleanRegion && String(a.region || '').toLowerCase().includes(cleanRegion);
    const bMatches = cleanRegion && String(b.region || '').toLowerCase().includes(cleanRegion);
    return Number(bMatches) - Number(aMatches) || a.common_name.localeCompare(b.common_name);
  });

  return sorted.slice(0, 5).map((species, index) => ({
    id: species.id,
    common_name: species.common_name,
    scientific_name: species.scientific_name,
    type: species.type,
    probability: Math.max(0.45, 0.9 - index * 0.1),
  }));
}

function confirmedSpeciesFor(db, input = []) {
  const values = Array.isArray(input) ? input : [];

  return values
    .map((item) => {
      const id = typeof item === 'object' ? item.id : item;
      return db.species.find((species) => Number(species.id) === Number(id) && !species.deleted_at);
    })
    .filter(Boolean)
    .map((species) => ({
      id: species.id,
      common_name: species.common_name,
      scientific_name: species.scientific_name,
      type: species.type,
    }));
}

function reportWithZone(db, report) {
  const zone = db.zones.find((item) => Number(item.id) === Number(report.zone_id));

  return {
    ...report,
    zone_name: zone?.name || 'Zona',
    zone_region: zone?.region || '',
  };
}

function buildReport(db, zone, payload = {}) {
  const vegetation = calculateVegetation(zone);
  const timestamp = now();

  return {
    id: nextId(db, 'reports'),
    zone_id: zone.id,
    area_m2: zone.area_m2,
    area_ha: zone.area_ha,
    vegetation_coverage: vegetation.vegetation_coverage,
    forest_density: vegetation.forest_density,
    probable_species: probableSpeciesFor(db, payload.region || zone.region),
    confirmed_species: confirmedSpeciesFor(
      db,
      payload.confirmed_species_ids || payload.confirmed_species
    ),
    observations: payload.observations || null,
    analysis_date: timestamp,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export const localDataStore = {
  zones: {
    async create(payload) {
      const db = loadDb();
      const geometry = normalizePolygon(payload.geometry);
      const area = calculatePolygonArea(geometry.coordinates[0]);
      const timestamp = now();
      const zone = {
        id: nextId(db, 'zones'),
        user_id: 1,
        name: String(payload.name || '').trim(),
        description: payload.description || null,
        region: payload.region || null,
        geometry,
        area_m2: area.areaM2,
        area_ha: area.areaHa,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      };

      if (!zone.name) fail('El nombre de la zona es requerido.', 400);

      db.zones.unshift(zone);
      saveDb(db);
      return ok(zone, 'Zona guardada en el dispositivo.');
    },

    async getAll() {
      const db = loadDb();
      return ok(activeItems(db.zones).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    },

    async getById(id) {
      const db = loadDb();
      return ok(findZone(db, id));
    },

    async update(id, payload) {
      const db = loadDb();
      const zone = findZone(db, id);
      const name = String(payload.name || '').trim();
      if (!name) fail('El nombre de la zona es requerido.', 400);

      Object.assign(zone, {
        name,
        description: payload.description || null,
        region: payload.region || null,
        updated_at: now(),
      });
      saveDb(db);
      return ok(zone, 'Zona actualizada en el dispositivo.');
    },

    async delete(id) {
      const db = loadDb();
      const zone = findZone(db, id);
      zone.deleted_at = now();
      db.subzones.forEach((subzone) => {
        if (Number(subzone.zone_id) === Number(id)) subzone.deleted_at = now();
      });
      db.reports = db.reports.filter((report) => Number(report.zone_id) !== Number(id));
      saveDb(db);
      return ok(null, 'Zona eliminada del dispositivo.');
    },

    async getReport(id) {
      const db = loadDb();
      findZone(db, id);
      const report = db.reports
        .filter((item) => Number(item.zone_id) === Number(id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      if (!report) fail('La zona aun no tiene reportes.', 404);
      return ok(reportWithZone(db, report));
    },
  },

  species: {
    async create(payload) {
      const db = loadDb();
      const commonName = String(payload.common_name || '').trim();
      const scientificName = String(payload.scientific_name || '').trim();

      if (!commonName) fail('El nombre comun es requerido.', 400);
      if (!scientificName) fail('El nombre cientifico es requerido.', 400);
      if (!VALID_SPECIES_TYPES.includes(payload.type)) fail('Tipo de especie invalido.', 400);

      const timestamp = now();
      const species = {
        id: nextId(db, 'species'),
        user_id: 1,
        common_name: commonName,
        scientific_name: scientificName,
        type: payload.type,
        description: payload.description || null,
        region: payload.region || null,
        image_url: payload.image_url || null,
        observations: payload.observations || null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      };

      db.species.push(species);
      saveDb(db);
      return ok(species, 'Especie guardada en el dispositivo.');
    },

    async getAll(type = null) {
      const db = loadDb();
      const items = activeItems(db.species)
        .filter((item) => !type || item.type === type)
        .sort((a, b) => a.common_name.localeCompare(b.common_name));
      return ok(items);
    },

    async getById(id) {
      const db = loadDb();
      return ok(findSpecies(db, id));
    },

    async update(id, payload) {
      const db = loadDb();
      const species = findSpecies(db, id);
      const commonName = String(payload.common_name || '').trim();
      const scientificName = String(payload.scientific_name || '').trim();

      if (!commonName) fail('El nombre comun es requerido.', 400);
      if (!scientificName) fail('El nombre cientifico es requerido.', 400);
      if (!VALID_SPECIES_TYPES.includes(payload.type)) fail('Tipo de especie invalido.', 400);

      Object.assign(species, {
        common_name: commonName,
        scientific_name: scientificName,
        type: payload.type,
        description: payload.description || null,
        region: payload.region || null,
        image_url: payload.image_url || null,
        observations: payload.observations || null,
        updated_at: now(),
      });
      saveDb(db);
      return ok(species, 'Especie actualizada en el dispositivo.');
    },

    async delete(id) {
      const db = loadDb();
      const species = findSpecies(db, id);
      species.deleted_at = now();
      saveDb(db);
      return ok(null, 'Especie eliminada del dispositivo.');
    },
  },

  reports: {
    async create(zoneId, payload = {}) {
      const db = loadDb();
      const zone = findZone(db, zoneId || payload.zone_id || payload.zoneId);
      const report = buildReport(db, zone, payload);
      db.reports.unshift(report);
      saveDb(db);
      return ok(reportWithZone(db, report), 'Reporte generado en el dispositivo.');
    },

    async getAll() {
      const db = loadDb();
      const reports = db.reports
        .filter((report) => db.zones.some((zone) => zone.id === report.zone_id && !zone.deleted_at))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((report) => reportWithZone(db, report));
      return ok(reports);
    },

    async getById(id) {
      const db = loadDb();
      const report = db.reports.find((item) => Number(item.id) === Number(id));
      if (!report) fail('Reporte no encontrado.', 404);
      return ok(reportWithZone(db, report));
    },

    async getByZoneId(zoneId) {
      const db = loadDb();
      findZone(db, zoneId);
      const reports = db.reports
        .filter((item) => Number(item.zone_id) === Number(zoneId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return ok(reports);
    },

    async update(id, payload) {
      const db = loadDb();
      const report = db.reports.find((item) => Number(item.id) === Number(id));
      if (!report) fail('Reporte no encontrado.', 404);

      Object.assign(report, {
        confirmed_species: confirmedSpeciesFor(
          db,
          payload.confirmed_species_ids || payload.confirmed_species
        ),
        observations: payload.observations || null,
        updated_at: now(),
      });
      saveDb(db);
      return ok(reportWithZone(db, report), 'Reporte actualizado en el dispositivo.');
    },
  },

  subzones: {
    async create(zoneId, payload) {
      const db = loadDb();
      const zone = findZone(db, zoneId);
      const name = String(payload.name || '').trim();
      const slope = Number(payload.slope_degrees || 0);
      const treeCount = Number(payload.tree_count || 0);

      if (!name) fail('El nombre de la subzona es requerido.', 400);
      if (!VALID_USE_TYPES.includes(payload.use_type)) fail('Tipo de uso invalido.', 400);
      if (!VALID_OPERATION_TYPES.includes(payload.operation_type)) fail('Operacion invalida.', 400);
      if (!String(payload.soil_type || '').trim()) fail('El tipo de suelo es requerido.', 400);
      if (!Number.isFinite(slope) || slope < 0 || slope > 90) {
        fail('La inclinacion debe estar entre 0 y 90 grados.', 400);
      }
      if (!Number.isInteger(treeCount) || treeCount < 0) {
        fail('La cantidad de arboles debe ser un entero mayor o igual a cero.', 400);
      }
      if (!payload.tree_species_id && !String(payload.tree_common_name || '').trim()) {
        fail('Selecciona una especie o escribe el arbol.', 400);
      }

      const geometry = payload.geometry ? normalizePolygon(payload.geometry) : null;
      if (geometry && !polygonIsInsidePolygon(geometry, zone.geometry)) {
        fail('La subzona debe quedar completamente dentro de la zona seleccionada.', 400);
      }
      const area = geometry ? calculatePolygonArea(geometry.coordinates[0]) : { areaM2: null, areaHa: null };
      const timestamp = now();
      const subzone = {
        id: nextId(db, 'subzones'),
        zone_id: Number(zone.id),
        name,
        use_type: payload.use_type,
        operation_type: payload.operation_type,
        slope_degrees: slope,
        soil_type: String(payload.soil_type || '').trim(),
        tree_species_id: payload.tree_species_id ? Number(payload.tree_species_id) : null,
        tree_common_name: String(payload.tree_common_name || '').trim() || null,
        tree_count: treeCount,
        geometry,
        area_m2: area.areaM2,
        area_ha: area.areaHa,
        notes: payload.notes || null,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
      };

      db.subzones.unshift(subzone);
      saveDb(db);
      return ok(withSpeciesNames(db, subzone), 'Subzona guardada en el dispositivo.');
    },

    async getByZoneId(zoneId) {
      const db = loadDb();
      findZone(db, zoneId);
      const subzones = activeItems(db.subzones)
        .filter((item) => Number(item.zone_id) === Number(zoneId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((item) => withSpeciesNames(db, item));
      return ok(subzones);
    },

    async getById(id) {
      const db = loadDb();
      return ok(withSpeciesNames(db, findSubzone(db, id)));
    },

    async update(id, payload) {
      const db = loadDb();
      const current = findSubzone(db, id);
      const zone = findZone(db, current.zone_id);
      const nextGeometry = payload.geometry ? normalizePolygon(payload.geometry) : current.geometry;
      const area = nextGeometry
        ? calculatePolygonArea(nextGeometry.coordinates[0])
        : { areaM2: null, areaHa: null };

      if (nextGeometry && !polygonIsInsidePolygon(nextGeometry, zone.geometry)) {
        fail('La subzona debe quedar completamente dentro de la zona seleccionada.', 400);
      }

      Object.assign(current, {
        name: String(payload.name || '').trim(),
        use_type: payload.use_type,
        operation_type: payload.operation_type,
        slope_degrees: Number(payload.slope_degrees || 0),
        soil_type: String(payload.soil_type || '').trim(),
        tree_species_id: payload.tree_species_id ? Number(payload.tree_species_id) : null,
        tree_common_name: String(payload.tree_common_name || '').trim() || null,
        tree_count: Number(payload.tree_count || 0),
        geometry: nextGeometry,
        area_m2: area.areaM2,
        area_ha: area.areaHa,
        notes: payload.notes || null,
        updated_at: now(),
      });
      saveDb(db);
      return ok(withSpeciesNames(db, current), 'Subzona actualizada en el dispositivo.');
    },

    async delete(id) {
      const db = loadDb();
      const subzone = findSubzone(db, id);
      subzone.deleted_at = now();
      saveDb(db);
      return ok(null, 'Subzona eliminada del dispositivo.');
    },
  },
};

