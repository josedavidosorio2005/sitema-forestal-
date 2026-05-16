import db from '../config/database.js';
import { zonesQueries } from '../models/queries.js';
import { ApiError } from '../utils/errors.js';
import {
  calculatePolygonArea,
  normalizePolygonGeometry,
  parseJsonField,
} from '../utils/geojson.js';

function currentUserId(req) {
  return req.user?.id || 1;
}

function normalizeColor(value) {
  const color = String(value || '#116b3b').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#116b3b';
}

export const VALID_ZONE_STATUSES = [
  'planeacion',
  'listo_siembra',
  'en_siembra',
  'mantenimiento',
  'alerta_plaga',
  'alerta_operativa',
  'listo_cosecha',
  'cosechado',
  'descanso',
  'conservacion',
];

export function normalizeZoneStatus(value) {
  const status = String(value || 'planeacion').trim().toLowerCase();
  return VALID_ZONE_STATUSES.includes(status) ? status : 'planeacion';
}

export function formatZone(row) {
  if (!row) return null;

  return {
    ...row,
    geometry: parseJsonField(row.geometry_geojson, row.geometry_geojson),
    geometry_geojson: undefined,
  };
}

export async function createZone(req, res, next) {
  try {
    const { name, description, region, geometry } = req.body;

    if (!name || !String(name).trim()) {
      throw new ApiError('El nombre de la zona es requerido.', 400);
    }

    let normalizedGeometry;
    try {
      normalizedGeometry = normalizePolygonGeometry(geometry);
    } catch (error) {
      throw new ApiError(error.message, 400);
    }

    const { areaM2, areaHa } = calculatePolygonArea(normalizedGeometry);

    const result = await db.query(zonesQueries.create, [
      currentUserId(req),
      String(name).trim(),
      description || null,
      region || null,
      normalizeColor(req.body.color),
      normalizeZoneStatus(req.body.status),
      JSON.stringify(normalizedGeometry),
      areaM2,
      areaHa,
    ]);

    res.status(201).json({
      success: true,
      message: 'Zona guardada correctamente.',
      data: formatZone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllZones(req, res, next) {
  try {
    const result = await db.query(zonesQueries.getAll, [currentUserId(req)]);

    res.json({
      success: true,
      data: result.rows.map(formatZone),
    });
  } catch (error) {
    next(error);
  }
}

export async function getZoneById(req, res, next) {
  try {
    const result = await db.query(zonesQueries.getById, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Zona no encontrada.', 404);
    }

    res.json({
      success: true,
      data: formatZone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateZone(req, res, next) {
  try {
    const { name, description, region } = req.body;

    if (!name || !String(name).trim()) {
      throw new ApiError('El nombre de la zona es requerido.', 400);
    }

    const result = await db.query(zonesQueries.update, [
      req.params.id,
      String(name).trim(),
      description || null,
      region || null,
      normalizeColor(req.body.color),
      normalizeZoneStatus(req.body.status),
    ]);

    if (result.rows.length === 0) {
      throw new ApiError('Zona no encontrada.', 404);
    }

    res.json({
      success: true,
      message: 'Zona actualizada correctamente.',
      data: formatZone(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteZone(req, res, next) {
  try {
    const result = await db.query(zonesQueries.softDelete, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Zona no encontrada.', 404);
    }

    res.json({
      success: true,
      message: 'Zona eliminada correctamente.',
    });
  } catch (error) {
    next(error);
  }
}
