const EARTH_RADIUS_M = 6378137;

export function closeRing(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return [];

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  return first[0] === last[0] && first[1] === last[1]
    ? coordinates
    : [...coordinates, first];
}

export function calculatePolygonArea(coordinates) {
  const ring = closeRing(coordinates);
  let areaM2 = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    const lambda1 = (lon1 * Math.PI) / 180;
    const lambda2 = (lon2 * Math.PI) / 180;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;

    areaM2 +=
      (lambda2 - lambda1) *
      (2 + Math.sin(phi1) + Math.sin(phi2)) *
      (EARTH_RADIUS_M * EARTH_RADIUS_M) /
      2;
  }

  const absoluteArea = Math.abs(areaM2);

  return {
    areaM2: Math.round(absoluteArea * 100) / 100,
    areaHa: Math.round((absoluteArea / 10000) * 100) / 100,
  };
}

function pointOnSegment(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const epsilon = 1e-10;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);

  if (Math.abs(cross) > epsilon) return false;

  return (
    x >= Math.min(x1, x2) - epsilon &&
    x <= Math.max(x1, x2) + epsilon &&
    y >= Math.min(y1, y2) - epsilon &&
    y <= Math.max(y1, y2) + epsilon
  );
}

function pointInRing(point, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const current = ring[i];
    const previous = ring[j];

    if (pointOnSegment(point, previous, current)) return true;

    const crossesLatitude =
      (current[1] > point[1]) !== (previous[1] > point[1]);
    const intersects =
      crossesLatitude &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) /
          (previous[1] - current[1]) +
          current[0];

    if (intersects) inside = !inside;
  }

  return inside;
}

export function polygonIsInsidePolygon(childGeometry, parentGeometry) {
  const childRing = childGeometry?.coordinates?.[0];
  const parentRing = parentGeometry?.coordinates?.[0];

  if (!Array.isArray(childRing) || !Array.isArray(parentRing)) return false;

  return closeRing(childRing)
    .slice(0, -1)
    .every((point) => pointInRing(point, closeRing(parentRing)));
}

export function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits,
  }).format(number);
}

export function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getForestDensityColor(density) {
  const colors = {
    bajo: '#d97706',
    medio: '#3f8f46',
    alto: '#116b3b',
  };

  return colors[density] || '#64748b';
}

export const ZONE_STATUSES = [
  { value: 'planeacion', label: 'Planeacion', tone: 'neutral' },
  { value: 'listo_siembra', label: 'Listo para sembrar', tone: 'info' },
  { value: 'en_siembra', label: 'En siembra', tone: 'info' },
  { value: 'mantenimiento', label: 'Mantenimiento', tone: 'warning' },
  { value: 'alerta_plaga', label: 'Alerta por plaga', tone: 'danger' },
  { value: 'alerta_operativa', label: 'Problema operativo', tone: 'danger' },
  { value: 'listo_cosecha', label: 'Listo para cosechar', tone: 'success' },
  { value: 'cosechado', label: 'Cosechado', tone: 'neutral' },
  { value: 'descanso', label: 'En descanso', tone: 'neutral' },
  { value: 'conservacion', label: 'Conservacion', tone: 'success' },
];

export const TRACE_SEVERITIES = [
  { value: 'informativo', label: 'Informativo' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
  { value: 'critico', label: 'Critico' },
];

export const DEFAULT_SPECIES_CATEGORIES = [
  { value: 'maderable', label: 'Maderable' },
  { value: 'frutal', label: 'Frutal' },
  { value: 'restauracion', label: 'Restauracion' },
  { value: 'proteccion', label: 'Proteccion de suelo' },
  { value: 'ornamental', label: 'Ornamental' },
  { value: 'medicinal', label: 'Medicinal' },
  { value: 'otro', label: 'Otro' },
];

export function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_/-]/g, '');
}

export function getZoneStatusLabel(status) {
  return ZONE_STATUSES.find((item) => item.value === status)?.label || status || 'Sin estado';
}

export function getZoneStatusTone(status) {
  return ZONE_STATUSES.find((item) => item.value === status)?.tone || 'neutral';
}

export function getSpeciesTypeLabel(type) {
  const labels = {
    nativa: 'Nativa',
    introducida: 'Introducida',
    invasora: 'Invasora',
    ornamental: 'Ornamental',
    comercial: 'Comercial',
  };

  return labels[type] || type || 'Sin tipo';
}

export function getSpeciesTypeClass(type) {
  return `species-type species-type-${type || 'default'}`;
}

export function getSpeciesCategoryLabel(category) {
  const defaultLabel = DEFAULT_SPECIES_CATEGORIES.find((item) => item.value === category)?.label;
  return defaultLabel || String(category || 'Sin categoria').replace(/[_-]/g, ' ');
}

export function getSubzoneUseLabel(useType) {
  const labels = {
    plantacion: 'Plantacion',
    recoleccion: 'Recoleccion',
    conservacion: 'Conservacion',
    mixto: 'Mixto',
  };

  return labels[useType] || useType || 'Sin uso';
}

export function getSubzoneOperationLabel(operationType) {
  const labels = {
    sembrar: 'Sembrar',
    recolectar: 'Recolectar',
    monitorear: 'Monitorear',
  };

  return labels[operationType] || operationType || 'Sin operacion';
}

export function getSubzoneTreeName(subzone = {}) {
  return (
    subzone.species_common_name ||
    subzone.tree_common_name ||
    subzone.scientific_name ||
    'Sin especie'
  );
}

function hashText(value) {
  return String(value || '')
    .toLowerCase()
    .split('')
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export function getTreeColor(treeName) {
  const cleanName = String(treeName || '').trim().toLowerCase();

  if (!cleanName || cleanName === 'sin especie') return '#64748b';
  if (cleanName.includes('pino') || cleanName.includes('pinus')) return '#2563eb';
  if (cleanName.includes('cedro')) return '#b45309';
  if (cleanName.includes('eucalipto') || cleanName.includes('eucalyptus')) return '#0f766e';
  if (cleanName.includes('acacia')) return '#7c3aed';
  if (cleanName.includes('guayacan')) return '#d97706';
  if (cleanName.includes('nogal')) return '#be123c';

  const palette = [
    '#16a34a',
    '#0891b2',
    '#c026d3',
    '#ea580c',
    '#4f46e5',
    '#65a30d',
    '#dc2626',
  ];

  return palette[hashText(cleanName) % palette.length];
}

export function getSubzoneTreeColor(subzone = {}) {
  return getTreeColor(getSubzoneTreeName(subzone));
}

export function getErrorMessage(error) {
  return error?.friendlyMessage || error?.response?.data?.message || error?.message || 'Error inesperado.';
}
