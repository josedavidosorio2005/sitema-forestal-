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

export function getErrorMessage(error) {
  return error?.friendlyMessage || error?.response?.data?.message || error?.message || 'Error inesperado.';
}
