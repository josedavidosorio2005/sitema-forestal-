import db from '../config/database.js';
import { speciesQueries, subzonesQueries, zonesQueries } from '../models/queries.js';
import { ApiError } from '../utils/errors.js';
import {
  calculatePolygonArea,
  normalizePolygonGeometry,
  parseJsonField,
  polygonIsInsidePolygon,
} from '../utils/geojson.js';

function nullableText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function nullableId(value) {
  if (value === null || value === undefined || value === '') return null;
  return Number(value);
}

function normalizeSubzonePayload(body) {
  let geometry = null;
  let areaM2 = null;
  let areaHa = null;

  if (body.geometry) {
    geometry = normalizePolygonGeometry(body.geometry);
    const area = calculatePolygonArea(geometry);
    areaM2 = area.areaM2;
    areaHa = area.areaHa;
  }

  return {
    name: String(body.name || '').trim(),
    useType: body.use_type,
    operationType: body.operation_type,
    slopeDegrees: Number(body.slope_degrees || 0),
    soilType: String(body.soil_type || '').trim(),
    treeSpeciesId: nullableId(body.tree_species_id),
    treeCommonName: nullableText(body.tree_common_name),
    treeCount: Number(body.tree_count || 0),
    geometry,
    areaM2,
    areaHa,
    notes: nullableText(body.notes),
  };
}

export function formatSubzone(row) {
  if (!row) return null;

  return {
    ...row,
    geometry: parseJsonField(row.geometry_geojson, null),
    geometry_geojson: undefined,
  };
}

async function loadZoneOrFail(zoneId) {
  const zoneResult = await db.query(zonesQueries.getById, [zoneId]);

  if (zoneResult.rows.length === 0) {
    throw new ApiError('Zona no encontrada.', 404);
  }

  return zoneResult.rows[0];
}

function assertSubzoneInsideZone(zone, subzoneGeometry) {
  if (!subzoneGeometry) return;

  const zoneGeometry = parseJsonField(zone.geometry_geojson, null);
  if (!zoneGeometry) return;

  if (!polygonIsInsidePolygon(subzoneGeometry, zoneGeometry)) {
    throw new ApiError('La subzona debe quedar dentro del poligono de la zona.', 400);
  }
}

async function resolveTreeCommonName(treeSpeciesId, treeCommonName) {
  if (!treeSpeciesId) return treeCommonName;

  const speciesResult = await db.query(speciesQueries.getById, [treeSpeciesId]);
  if (speciesResult.rows.length === 0) {
    throw new ApiError('La especie seleccionada no existe.', 400);
  }

  return treeCommonName || speciesResult.rows[0].common_name;
}

export async function createSubzone(req, res, next) {
  try {
    const zoneId = Number(req.params.zoneId || req.body.zone_id);
    const zone = await loadZoneOrFail(zoneId);

    const payload = normalizeSubzonePayload(req.body);
    assertSubzoneInsideZone(zone, payload.geometry);
    const treeCommonName = await resolveTreeCommonName(
      payload.treeSpeciesId,
      payload.treeCommonName
    );

    const result = await db.query(subzonesQueries.create, [
      zoneId,
      payload.name,
      payload.useType,
      payload.operationType,
      payload.slopeDegrees,
      payload.soilType,
      payload.treeSpeciesId,
      treeCommonName,
      payload.treeCount,
      payload.geometry ? JSON.stringify(payload.geometry) : null,
      payload.areaM2,
      payload.areaHa,
      payload.notes,
    ]);

    res.status(201).json({
      success: true,
      message: 'Subzona guardada correctamente.',
      data: formatSubzone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubzonesByZoneId(req, res, next) {
  try {
    const zoneId = Number(req.params.zoneId || req.params.id);
    await loadZoneOrFail(zoneId);

    const result = await db.query(subzonesQueries.getByZoneId, [zoneId]);

    res.json({
      success: true,
      data: result.rows.map(formatSubzone),
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubzoneById(req, res, next) {
  try {
    const result = await db.query(subzonesQueries.getById, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Subzona no encontrada.', 404);
    }

    res.json({
      success: true,
      data: formatSubzone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubzone(req, res, next) {
  try {
    const existingResult = await db.query(subzonesQueries.getById, [req.params.id]);

    if (existingResult.rows.length === 0) {
      throw new ApiError('Subzona no encontrada.', 404);
    }

    const existing = formatSubzone(existingResult.rows[0]);
    const zone = await loadZoneOrFail(existing.zone_id);
    const payload = normalizeSubzonePayload({
      ...req.body,
      geometry: req.body.geometry === undefined ? existing.geometry : req.body.geometry,
    });
    assertSubzoneInsideZone(zone, payload.geometry);
    const treeCommonName = await resolveTreeCommonName(
      payload.treeSpeciesId,
      payload.treeCommonName
    );

    const result = await db.query(subzonesQueries.update, [
      req.params.id,
      payload.name,
      payload.useType,
      payload.operationType,
      payload.slopeDegrees,
      payload.soilType,
      payload.treeSpeciesId,
      treeCommonName,
      payload.treeCount,
      payload.geometry ? JSON.stringify(payload.geometry) : null,
      payload.areaM2,
      payload.areaHa,
      payload.notes,
    ]);

    res.json({
      success: true,
      message: 'Subzona actualizada correctamente.',
      data: formatSubzone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubzone(req, res, next) {
  try {
    const result = await db.query(subzonesQueries.softDelete, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Subzona no encontrada.', 404);
    }

    res.json({
      success: true,
      message: 'Subzona eliminada correctamente.',
    });
  } catch (error) {
    next(error);
  }
}
