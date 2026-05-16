import db from '../config/database.js';
import { zoneEventsQueries, zonesQueries } from '../models/queries.js';
import { ApiError } from '../utils/errors.js';

async function ensureZoneExists(zoneId) {
  const result = await db.query(zonesQueries.getById, [zoneId]);
  if (result.rows.length === 0) {
    throw new ApiError('Zona no encontrada.', 404);
  }
}

export async function createZoneEvent(req, res, next) {
  try {
    await ensureZoneExists(req.params.zoneId);

    const result = await db.query(zoneEventsQueries.create, [
      req.params.zoneId,
      req.body.event_type,
      String(req.body.title || '').trim(),
      req.body.description || null,
      req.body.actor || null,
      req.body.event_date || new Date().toISOString(),
    ]);

    res.status(201).json({
      success: true,
      message: 'Evento de trazabilidad guardado.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getZoneEvents(req, res, next) {
  try {
    await ensureZoneExists(req.params.zoneId);
    const result = await db.query(zoneEventsQueries.getByZoneId, [req.params.zoneId]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteZoneEvent(req, res, next) {
  try {
    const result = await db.query(zoneEventsQueries.softDelete, [req.params.eventId]);

    if (result.rows.length === 0) {
      throw new ApiError('Evento no encontrado.', 404);
    }

    res.json({
      success: true,
      message: 'Evento eliminado.',
    });
  } catch (error) {
    next(error);
  }
}
