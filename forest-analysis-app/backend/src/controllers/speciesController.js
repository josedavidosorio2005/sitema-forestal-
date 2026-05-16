import db from '../config/database.js';
import { speciesQueries } from '../models/queries.js';
import { ApiError } from '../utils/errors.js';

export const VALID_SPECIES_TYPES = [
  'nativa',
  'introducida',
  'invasora',
  'ornamental',
  'comercial',
];

function currentUserId(req) {
  return req.user?.id || 1;
}

function validateSpeciesPayload(payload) {
  if (!payload.common_name || !String(payload.common_name).trim()) {
    throw new ApiError('El nombre comun es requerido.', 400);
  }

  if (!payload.scientific_name || !String(payload.scientific_name).trim()) {
    throw new ApiError('El nombre cientifico es requerido.', 400);
  }

  if (!payload.type || !String(payload.type).trim()) {
    throw new ApiError('El tipo/categoria es requerido.', 400);
  }
}

export async function createSpecies(req, res, next) {
  try {
    validateSpeciesPayload(req.body);

    const result = await db.query(speciesQueries.create, [
      currentUserId(req),
      req.body.common_name.trim(),
      req.body.scientific_name.trim(),
      req.body.type,
      req.body.description || null,
      req.body.region || null,
      req.body.image_url || null,
      req.body.observations || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Especie creada correctamente.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllSpecies(req, res, next) {
  try {
    const { type } = req.query;

    if (type && typeof type !== 'string') {
      throw new ApiError('Tipo debe ser texto.', 400);
    }

    const result = type
      ? await db.query(speciesQueries.getByType, [type, currentUserId(req)])
      : await db.query(speciesQueries.getAll, [currentUserId(req)]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSpeciesById(req, res, next) {
  try {
    const result = await db.query(speciesQueries.getById, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Especie no encontrada.', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSpecies(req, res, next) {
  try {
    validateSpeciesPayload(req.body);

    const result = await db.query(speciesQueries.update, [
      req.params.id,
      req.body.common_name.trim(),
      req.body.scientific_name.trim(),
      req.body.type,
      req.body.description || null,
      req.body.region || null,
      req.body.image_url || null,
      req.body.observations || null,
    ]);

    if (result.rows.length === 0) {
      throw new ApiError('Especie no encontrada.', 404);
    }

    res.json({
      success: true,
      message: 'Especie actualizada correctamente.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSpecies(req, res, next) {
  try {
    const result = await db.query(speciesQueries.softDelete, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Especie no encontrada.', 404);
    }

    res.json({
      success: true,
      message: 'Especie eliminada correctamente.',
    });
  } catch (error) {
    next(error);
  }
}
