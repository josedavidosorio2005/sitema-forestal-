import db from '../config/database.js';
import { treesQueries, treeLogsQueries, subzonesQueries, zonesQueries } from '../models/queries.js';
import { ApiError } from '../utils/errors.js';
import { parseJsonField, normalizePointGeometry, pointInsidePolygon } from '../utils/geojson.js';

export function formatTree(row) {
  if (!row) return null;

  return {
    ...row,
    geometry: parseJsonField(row.geometry_geojson, row.geometry_geojson),
    geometry_geojson: undefined,
  };
}

/**
 * Load the boundary polygon for spatial validation.
 * Prefers the subzone polygon; falls back to the parent zone polygon.
 */
async function loadBoundaryForSubzone(subzoneId) {
  const szResult = await db.query(subzonesQueries.getById, [subzoneId]);
  if (szResult.rows.length === 0) {
    throw new ApiError('Subzona no encontrada.', 404);
  }
  const subzone = szResult.rows[0];
  const subzoneGeom = parseJsonField(subzone.geometry_geojson, null);

  if (subzoneGeom && subzoneGeom.type === 'Polygon') {
    return { boundary: subzoneGeom, label: 'subzona' };
  }

  // Fallback: use the parent zone polygon
  const zoneResult = await db.query(zonesQueries.getById, [subzone.zone_id]);
  if (zoneResult.rows.length === 0) {
    return { boundary: null, label: 'zona' };
  }
  const zoneGeom = parseJsonField(zoneResult.rows[0].geometry_geojson, null);
  return { boundary: zoneGeom, label: 'zona' };
}

function assertPointInsideBoundary(pointCoords, boundary, label) {
  if (!boundary) return; // no geometry to validate against
  if (!pointInsidePolygon(pointCoords, boundary)) {
    throw new ApiError(
      `Las coordenadas del arbol estan fuera de la ${label}. Ubica el punto dentro del poligono.`,
      400
    );
  }
}

export async function createTree(req, res, next) {
  try {
    const { subzone_id, qr_tag, species_id, dap, commercial_height, estimated_volume, status, legal_permit, fall_direction, geometry, health_condition } = req.body;

    let normalizedGeometry;
    try {
      normalizedGeometry = normalizePointGeometry(geometry);
    } catch (error) {
      throw new ApiError(error.message, 400);
    }

    // Spatial validation: tree must be inside subzone (or zone)
    const { boundary, label } = await loadBoundaryForSubzone(subzone_id);
    assertPointInsideBoundary(normalizedGeometry.coordinates, boundary, label);

    const result = await db.query(treesQueries.create, [
      subzone_id,
      qr_tag,
      species_id || null,
      dap,
      commercial_height,
      estimated_volume,
      status || 'Marcado',
      legal_permit ? 1 : 0,
      fall_direction || null,
      JSON.stringify(normalizedGeometry),
      health_condition || 'Sano / Normal'
    ]);

    res.status(201).json({
      success: true,
      message: 'Arbol registrado correctamente.',
      data: formatTree(result.rows[0]),
    });
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.code === '23505') {
      next(new ApiError('Ya existe un arbol con ese QR/Tag.', 400));
    } else {
      next(error);
    }
  }
}

export async function createTreesBatch(req, res, next) {
  try {
    const { trees: treesPayload } = req.body;

    if (!Array.isArray(treesPayload) || treesPayload.length === 0) {
      throw new ApiError('Debes enviar al menos un arbol en el lote.', 400);
    }

    if (treesPayload.length > 50) {
      throw new ApiError('Maximo 50 arboles por lote.', 400);
    }

    // Pre-load boundary once (all trees in a batch belong to the same subzone)
    const firstSubzoneId = treesPayload[0].subzone_id;
    let boundary = null;
    let boundaryLabel = 'zona';
    try {
      const loaded = await loadBoundaryForSubzone(firstSubzoneId);
      boundary = loaded.boundary;
      boundaryLabel = loaded.label;
    } catch { /* proceed without spatial check if subzone lookup fails */ }

    const created = [];
    const errors = [];

    for (let i = 0; i < treesPayload.length; i++) {
      const item = treesPayload[i];
      try {
        let normalizedGeometry;
        try {
          normalizedGeometry = normalizePointGeometry(item.geometry);
        } catch (error) {
          throw new ApiError(`Arbol #${i + 1}: ${error.message}`, 400);
        }

        // Spatial validation per tree
        assertPointInsideBoundary(normalizedGeometry.coordinates, boundary, boundaryLabel);

        const result = await db.query(treesQueries.create, [
          item.subzone_id,
          item.qr_tag,
          item.species_id || null,
          item.dap,
          item.commercial_height,
          item.estimated_volume,
          item.status || 'Marcado',
          item.legal_permit ? 1 : 0,
          item.fall_direction || null,
          JSON.stringify(normalizedGeometry),
          item.health_condition || 'Sano / Normal'
        ]);

        created.push(formatTree(result.rows[0]));
      } catch (error) {
        if (error.message.includes('UNIQUE') || error.code === '23505') {
          errors.push({ index: i, qr_tag: item.qr_tag, error: 'Ya existe un arbol con ese QR/Tag.' });
        } else {
          errors.push({ index: i, qr_tag: item.qr_tag, error: error.message });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `${created.length} arboles registrados. ${errors.length} errores.`,
      data: created,
      errors,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTreesBySubzoneId(req, res, next) {
  try {
    const result = await db.query(treesQueries.getBySubzoneId, [req.params.subzoneId]);

    res.json({
      success: true,
      data: result.rows.map(formatTree),
    });
  } catch (error) {
    next(error);
  }
}

export async function getTreeById(req, res, next) {
  try {
    const result = await db.query(treesQueries.getById, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Arbol no encontrado.', 404);
    }

    res.json({
      success: true,
      data: formatTree(result.rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTree(req, res, next) {
  try {
    const { qr_tag, species_id, dap, commercial_height, estimated_volume, status, legal_permit, fall_direction, geometry, health_condition } = req.body;

    let normalizedGeometry;
    try {
      normalizedGeometry = normalizePointGeometry(geometry);
    } catch (error) {
      throw new ApiError(error.message, 400);
    }

    const result = await db.query(treesQueries.update, [
      req.params.id,
      qr_tag,
      species_id || null,
      dap,
      commercial_height,
      estimated_volume,
      status,
      legal_permit ? 1 : 0,
      fall_direction,
      JSON.stringify(normalizedGeometry),
      health_condition || 'Sano / Normal'
    ]);

    if (result.rows.length === 0) {
      throw new ApiError('Arbol no encontrado.', 404);
    }

    res.json({
      success: true,
      message: 'Arbol actualizado correctamente.',
      data: formatTree(result.rows[0]),
    });
  } catch (error) {
    if (error.message.includes('UNIQUE') || error.code === '23505') {
      next(new ApiError('Ya existe un arbol con ese QR/Tag.', 400));
    } else {
      next(error);
    }
  }
}

export async function deleteTree(req, res, next) {
  try {
    const result = await db.query(treesQueries.softDelete, [req.params.id]);

    if (result.rows.length === 0) {
      throw new ApiError('Arbol no encontrado.', 404);
    }

    res.json({
      success: true,
      message: 'Arbol eliminado correctamente.',
    });
  } catch (error) {
    next(error);
  }
}

export async function createTreeLog(req, res, next) {
  try {
    const { action, operator_name, equipment_used, cable_tension, destination } = req.body;
    const tree_id = req.params.treeId;

    // Validate tree exists
    const treeResult = await db.query(treesQueries.getById, [tree_id]);
    if (treeResult.rows.length === 0) {
      throw new ApiError('Arbol no encontrado.', 404);
    }
    
    const tree = treeResult.rows[0];

    // Geographic + legal validation for "despacho"
    if (action === 'despacho') {
       if (!tree.legal_permit) {
         throw new ApiError('No se puede despachar un arbol sin permiso legal validado.', 400);
       }

       // Spatial validation: confirm tree is still within its subzone/zone
       const treeGeom = parseJsonField(tree.geometry_geojson, null);
       if (treeGeom && treeGeom.coordinates) {
         try {
           const { boundary, label } = await loadBoundaryForSubzone(tree.subzone_id);
           assertPointInsideBoundary(treeGeom.coordinates, boundary, label);
         } catch (spatialError) {
           if (spatialError instanceof ApiError && spatialError.statusCode === 400) {
             throw new ApiError(
               `No se puede despachar: las coordenadas del arbol estan fuera de la ${label || 'zona'}.`,
               400
             );
           }
           // Non-spatial errors (e.g. subzone not found) are non-blocking for dispatch
         }
       }
    }

    const logResult = await db.query(treeLogsQueries.create, [
      tree_id,
      action,
      operator_name,
      equipment_used || null,
      cable_tension || null,
      destination || null
    ]);

    // Also update tree status automatically if action matches one of the lifecycle states
    let newStatus = tree.status;
    if (action === 'tala') newStatus = 'Derribado';
    if (action === 'movimiento') newStatus = 'Troceado'; // Or keep it as Derribado if just moving
    if (action === 'despacho') newStatus = 'Despachado';
    
    if (newStatus !== tree.status) {
      await db.query(treesQueries.updateStatus, [tree_id, newStatus]);
    }

    res.status(201).json({
      success: true,
      message: 'Registro de trazabilidad guardado.',
      data: logResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function getTreeLogs(req, res, next) {
  try {
    const result = await db.query(treeLogsQueries.getByTreeId, [req.params.treeId]);
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}
