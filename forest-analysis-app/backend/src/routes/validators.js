import { body, check, param, query } from 'express-validator';
import { normalizePolygonGeometry } from '../utils/geojson.js';

const SPECIES_TYPES = ['nativa', 'introducida', 'invasora', 'ornamental', 'comercial'];
const SUBZONE_USE_TYPES = ['plantacion', 'recoleccion', 'conservacion', 'mixto'];
const SUBZONE_OPERATION_TYPES = ['sembrar', 'recolectar', 'monitorear'];
const LOG_DRAG_SOILS = ['pasto', 'tierra_seca', 'tierra', 'lodo', 'grava'];

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

export const logDragTensionValidators = [
  body().custom((payload) => {
    const weight = Number(payload.peso_tronco ?? payload.weightKg);
    const slope = Number(payload.angulo_pendiente ?? payload.slopeDegrees);
    const distance = Number(payload.distancia_arrastre ?? payload.dragDistanceMeters ?? 0);
    const safety = Number(payload.factor_seguridad ?? payload.safetyFactor ?? 5);
    const soil = String(payload.tipo_suelo ?? payload.surface ?? 'tierra_seca').toLowerCase().trim();
    const friction = Number(payload.frictionCoefficient ?? 0.4);

    if (!Number.isFinite(weight) || weight <= 0 || weight > 500000) {
      throw new Error('peso_tronco debe ser un numero mayor que cero.');
    }

    if (!Number.isFinite(slope) || slope < 0 || slope > 90) {
      throw new Error('angulo_pendiente debe estar entre 0 y 90 grados.');
    }

    if (!LOG_DRAG_SOILS.includes(soil)) {
      throw new Error(`tipo_suelo invalido. Usa uno de: ${LOG_DRAG_SOILS.join(', ')}.`);
    }

    if (!Number.isFinite(distance) || distance < 0 || distance > 10000) {
      throw new Error('distancia_arrastre debe ser un numero positivo.');
    }

    if (payload.frictionCoefficient !== undefined && (!Number.isFinite(friction) || friction < 0 || friction > 2)) {
      throw new Error('frictionCoefficient debe estar entre 0 y 2.');
    }

    if (!Number.isFinite(safety) || safety < 1 || safety > 20) {
      throw new Error('factor_seguridad debe estar entre 1 y 20.');
    }

    return true;
  }),
];
