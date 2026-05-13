import db from '../config/database.js';
import { reportsQueries, speciesQueries, zonesQueries } from '../models/queries.js';
import { analyzeVegetation } from '../services/vegetationService.js';
import {
  findProbableSpecies,
  normalizeConfirmedSpecies,
} from '../services/speciesMatchService.js';
import { ApiError } from '../utils/errors.js';
import { parseJsonField } from '../utils/geojson.js';
import { formatZone } from './zonesController.js';

function currentUserId(req) {
  return req.user?.id || 1;
}

function jsonForDb(value) {
  return JSON.stringify(value || []);
}

export function formatReport(row) {
  if (!row) return null;

  return {
    ...row,
    probable_species: parseJsonField(row.probable_species, []),
    confirmed_species: parseJsonField(row.confirmed_species, []),
  };
}

async function loadZoneOrFail(zoneId) {
  const zoneResult = await db.query(zonesQueries.getById, [zoneId]);

  if (zoneResult.rows.length === 0) {
    throw new ApiError('Zona no encontrada.', 404);
  }

  return formatZone(zoneResult.rows[0]);
}

async function loadUserSpecies(userId) {
  const speciesResult = await db.query(speciesQueries.getAll, [userId]);
  return speciesResult.rows;
}

export async function createReport(req, res, next) {
  try {
    const zoneId = req.params.zoneId || req.body.zone_id || req.body.zoneId;

    if (!zoneId) {
      throw new ApiError('zone_id es requerido para generar el reporte.', 400);
    }

    const zone = await loadZoneOrFail(zoneId);
    const speciesCatalog = await loadUserSpecies(currentUserId(req));
    const analysisRegion = req.body.region || zone.region || '';
    const vegetation = await analyzeVegetation({
      geometry: zone.geometry,
      areaM2: zone.area_m2,
    });
    const probableSpecies = findProbableSpecies(speciesCatalog, analysisRegion);
    const confirmedInput = req.body.confirmed_species_ids || req.body.confirmed_species || [];
    const confirmedSpecies = normalizeConfirmedSpecies(confirmedInput, speciesCatalog);

    const result = await db.query(reportsQueries.create, [
      zone.id,
      zone.area_m2,
      zone.area_ha,
      vegetation.vegetationCoverage,
      vegetation.forestDensity,
      jsonForDb(probableSpecies),
      jsonForDb(confirmedSpecies),
      req.body.observations || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Reporte generado correctamente.',
      data: {
        ...formatReport(result.rows[0]),
        analysis_source: vegetation.source,
        integration_ready: vegetation.integrationReady,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllReports(req, res, next) {
  try {
    const result = await db.query(reportsQueries.getAll, [currentUserId(req)]);

    res.json({
      success: true,
      data: result.rows.map(formatReport),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportById(req, res, next) {
  try {
    const result = await db.query(reportsQueries.getById, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Reporte no encontrado.', 404);
    }

    res.json({
      success: true,
      data: formatReport(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function getReportsByZoneId(req, res, next) {
  try {
    const zoneId = req.params.zoneId || req.params.id;
    await loadZoneOrFail(zoneId);

    const result = await db.query(reportsQueries.getByZoneId, [zoneId]);

    res.json({
      success: true,
      data: result.rows.map(formatReport),
    });
  } catch (error) {
    next(error);
  }
}

export async function getLatestReportForZone(req, res, next) {
  try {
    const zoneId = req.params.zoneId || req.params.id;
    await loadZoneOrFail(zoneId);

    const result = await db.query(reportsQueries.getLatestByZoneId, [zoneId]);

    if (result.rows.length === 0) {
      throw new ApiError('La zona aun no tiene reportes.', 404);
    }

    res.json({
      success: true,
      data: formatReport(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateReport(req, res, next) {
  try {
    const speciesCatalog = await loadUserSpecies(currentUserId(req));
    const confirmedInput = req.body.confirmed_species_ids || req.body.confirmed_species || [];
    const confirmedSpecies = normalizeConfirmedSpecies(confirmedInput, speciesCatalog);

    const result = await db.query(reportsQueries.update, [
      req.params.id,
      jsonForDb(confirmedSpecies),
      req.body.observations || null,
    ]);

    if (result.rows.length === 0) {
      throw new ApiError('Reporte no encontrado.', 404);
    }

    res.json({
      success: true,
      message: 'Reporte actualizado correctamente.',
      data: formatReport(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}
