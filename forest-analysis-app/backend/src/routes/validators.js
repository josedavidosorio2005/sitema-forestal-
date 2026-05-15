import { body, check, param, query } from 'express-validator';
import { normalizePolygonGeometry } from '../utils/geojson.js';

const SPECIES_TYPES = ['nativa', 'introducida', 'invasora', 'ornamental', 'comercial'];
const SUBZONE_USE_TYPES = ['plantacion', 'recoleccion', 'conservacion', 'mixto'];
const SUBZONE_OPERATION_TYPES = ['sembrar', 'recolectar', 'monitorear'];

function optionalText(field, max = 1000) {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage(`${field} debe ser texto.`)
    .trim()
    .isLength({ max })
    .withMessage(`${field} no puede superar ${max} caracteres.`);
}

export function idParam(field = 'id') {
  return param(field)
    .isInt({ min: 1 })
    .withMessage(`${field} debe ser un identificador numerico valido.`)
    .toInt();
}

export const zoneCreateValidators = [
  body('name')
    .isString()
    .withMessage('El nombre de la zona es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la zona es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre de la zona no puede superar 255 caracteres.'),
  optionalText('description', 2000),
  optionalText('region', 255),
  body('geometry').custom((geometry) => {
    normalizePolygonGeometry(geometry);
    return true;
  }),
];

export const zoneUpdateValidators = [
  idParam('id'),
  body('name')
    .isString()
    .withMessage('El nombre de la zona es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la zona es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre de la zona no puede superar 255 caracteres.'),
  optionalText('description', 2000),
  optionalText('region', 255),
];

export const speciesCreateOrUpdateValidators = [
  body('common_name')
    .isString()
    .withMessage('El nombre comun es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El nombre comun es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre comun no puede superar 255 caracteres.'),
  body('scientific_name')
    .isString()
    .withMessage('El nombre cientifico es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El nombre cientifico es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre cientifico no puede superar 255 caracteres.'),
  body('type')
    .isIn(SPECIES_TYPES)
    .withMessage(`Tipo invalido. Usa uno de: ${SPECIES_TYPES.join(', ')}.`),
  optionalText('description', 2000),
  optionalText('region', 255),
  body('image_url')
    .optional({ nullable: true, checkFalsy: true })
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('image_url debe ser una URL http o https valida.')
    .isLength({ max: 500 })
    .withMessage('image_url no puede superar 500 caracteres.'),
  optionalText('observations', 2000),
];

export const speciesQueryValidators = [
  query('type')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(SPECIES_TYPES)
    .withMessage(`Tipo invalido. Usa uno de: ${SPECIES_TYPES.join(', ')}.`),
];

export const reportCreateValidators = [
  check('zone_id').custom((value, { req }) => {
    const zoneId = req.params.zoneId || req.body.zone_id || req.body.zoneId;
    if (!zoneId) {
      throw new Error('zone_id es requerido para generar el reporte.');
    }
    if (!Number.isInteger(Number(zoneId)) || Number(zoneId) < 1) {
      throw new Error('zone_id debe ser un identificador numerico valido.');
    }
    return true;
  }),
  body('confirmed_species_ids')
    .optional({ nullable: true })
    .isArray()
    .withMessage('confirmed_species_ids debe ser una lista.'),
  body('confirmed_species')
    .optional({ nullable: true })
    .isArray()
    .withMessage('confirmed_species debe ser una lista.'),
  optionalText('region', 255),
  optionalText('observations', 2000),
];

export const reportUpdateValidators = [
  idParam('id'),
  body('confirmed_species_ids')
    .optional({ nullable: true })
    .isArray()
    .withMessage('confirmed_species_ids debe ser una lista.'),
  body('confirmed_species')
    .optional({ nullable: true })
    .isArray()
    .withMessage('confirmed_species debe ser una lista.'),
  optionalText('observations', 2000),
];

export const subzoneCreateOrUpdateValidators = [
  body('name')
    .isString()
    .withMessage('El nombre de la subzona es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la subzona es requerido.')
    .isLength({ max: 255 })
    .withMessage('El nombre de la subzona no puede superar 255 caracteres.'),
  body('use_type')
    .isIn(SUBZONE_USE_TYPES)
    .withMessage(`Uso invalido. Usa uno de: ${SUBZONE_USE_TYPES.join(', ')}.`),
  body('operation_type')
    .isIn(SUBZONE_OPERATION_TYPES)
    .withMessage(`Operacion invalida. Usa una de: ${SUBZONE_OPERATION_TYPES.join(', ')}.`),
  body('slope_degrees')
    .isFloat({ min: 0, max: 90 })
    .withMessage('La inclinacion debe estar entre 0 y 90 grados.')
    .toFloat(),
  body('soil_type')
    .isString()
    .withMessage('El tipo de suelo es requerido.')
    .trim()
    .notEmpty()
    .withMessage('El tipo de suelo es requerido.')
    .isLength({ max: 255 })
    .withMessage('El tipo de suelo no puede superar 255 caracteres.'),
  body('tree_species_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('tree_species_id debe ser un identificador numerico valido.')
    .toInt(),
  body('tree_common_name')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('tree_common_name debe ser texto.')
    .trim()
    .isLength({ max: 255 })
    .withMessage('tree_common_name no puede superar 255 caracteres.'),
  body('tree_count')
    .isInt({ min: 0 })
    .withMessage('La cantidad de arboles debe ser un numero entero positivo.')
    .toInt(),
  body().custom((payload) => {
    if (!payload.tree_species_id && !String(payload.tree_common_name || '').trim()) {
      throw new Error('Selecciona una especie del catalogo o escribe el arbol manualmente.');
    }
    return true;
  }),
  body('geometry')
    .optional({ nullable: true })
    .custom((geometry) => {
      normalizePolygonGeometry(geometry);
      return true;
    }),
  optionalText('notes', 2000),
];

export const treeCreateValidators = [
  body('subzone_id').isInt({ min: 1 }).withMessage('subzone_id debe ser un entero valido.'),
  body('qr_tag').isString().trim().notEmpty().withMessage('qr_tag es requerido.'),
  body('species_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('species_id debe ser entero.'),
  body('dap').isFloat({ min: 0 }).withMessage('dap debe ser un numero positivo.'),
  body('commercial_height').isFloat({ min: 0 }).withMessage('commercial_height debe ser un numero positivo.'),
  body('estimated_volume').isFloat({ min: 0 }).withMessage('estimated_volume debe ser un numero positivo.'),
  body('status').optional().isIn(['Marcado', 'Derribado', 'Troceado', 'Despachado']).withMessage('status invalido.'),
  body('legal_permit').optional().isBoolean(),
  body('health_condition').optional({ nullable: true }).isString().trim(),
  body('fall_direction').optional({ nullable: true }).isFloat({ min: 0, max: 360 }),
  body('geometry').custom((geometry) => {
    // Normalization check will be done in controller for point
    return true;
  }),
];

export const treeUpdateValidators = [
  idParam('id'),
  body('qr_tag').isString().trim().notEmpty().withMessage('qr_tag es requerido.'),
  body('species_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('species_id debe ser entero.'),
  body('dap').isFloat({ min: 0 }).withMessage('dap debe ser un numero positivo.'),
  body('commercial_height').isFloat({ min: 0 }).withMessage('commercial_height debe ser un numero positivo.'),
  body('estimated_volume').isFloat({ min: 0 }).withMessage('estimated_volume debe ser un numero positivo.'),
  body('status').optional().isIn(['Marcado', 'Derribado', 'Troceado', 'Despachado']).withMessage('status invalido.'),
  body('legal_permit').optional().isBoolean(),
  body('health_condition').optional({ nullable: true }).isString().trim(),
  body('fall_direction').optional({ nullable: true }).isFloat({ min: 0, max: 360 }),
  body('geometry').custom((geometry) => {
    return true;
  }),
];

export const treeLogCreateValidators = [
  body('action').isIn(['tala', 'movimiento', 'despacho']).withMessage('Accion invalida.'),
  body('operator_name').isString().trim().notEmpty().withMessage('El operador es requerido.'),
  body('equipment_used').optional({ nullable: true }).isString().trim(),
  body('cable_tension').optional({ nullable: true }).isFloat({ min: 0 }),
  body('destination').optional({ nullable: true }).isString().trim(),
];
