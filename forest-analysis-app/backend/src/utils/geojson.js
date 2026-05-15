const EARTH_RADIUS_M = 6378137;

export function parseJsonField(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizePolygonGeometry(input) {
  const geometry = input?.type === 'Feature' ? input.geometry : input;

  if (!geometry || geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) {
    throw new Error('La geometria debe ser un GeoJSON Polygon valido.');
  }

  const ring = geometry.coordinates[0];
  if (!Array.isArray(ring) || ring.length < 3) {
    throw new Error('El poligono debe tener al menos 3 vertices.');
  }

  const normalizedRing = ring.map((point) => {
    if (!Array.isArray(point) || point.length < 2) {
      throw new Error('Cada vertice debe tener formato [lng, lat].');
    }

    const lng = Number(point[0]);
    const lat = Number(point[1]);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      throw new Error('Las coordenadas deben ser numeros validos.');
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error('Las coordenadas estan fuera del rango geografico permitido.');
    }

    return [lng, lat];
  });

  const first = normalizedRing[0];
  const last = normalizedRing[normalizedRing.length - 1];
  const closedRing =
    first[0] === last[0] && first[1] === last[1]
      ? normalizedRing
      : [...normalizedRing, first];

  if (closedRing.length < 4) {
    throw new Error('El poligono debe tener al menos 3 vertices y estar cerrado.');
  }

  return {
    ...geometry,
    type: 'Polygon',
    coordinates: [closedRing],
  };
}

export function normalizePointGeometry(input) {
  const geometry = input?.type === 'Feature' ? input.geometry : input;

  if (!geometry || geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) {
    throw new Error('La geometria debe ser un GeoJSON Point valido.');
  }

  const [lng, lat] = geometry.coordinates;

  if (!Number.isFinite(Number(lng)) || !Number.isFinite(Number(lat))) {
    throw new Error('Las coordenadas deben ser numeros validos.');
  }

  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    throw new Error('Las coordenadas estan fuera del rango geografico permitido.');
  }

  return {
    ...geometry,
    type: 'Point',
    coordinates: [Number(lng), Number(lat)],
  };
}


export function calculatePolygonArea(geometryOrCoordinates) {
  const coordinates = Array.isArray(geometryOrCoordinates)
    ? geometryOrCoordinates
    : normalizePolygonGeometry(geometryOrCoordinates).coordinates[0];

  const ring =
    coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
    coordinates[0][1] === coordinates[coordinates.length - 1][1]
      ? coordinates
      : [...coordinates, coordinates[0]];

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

export function getPolygonCentroid(geometry) {
  const polygon = normalizePolygonGeometry(geometry);
  const ring = polygon.coordinates[0].slice(0, -1);

  const totals = ring.reduce(
    (acc, [lng, lat]) => ({
      lng: acc.lng + lng,
      lat: acc.lat + lat,
    }),
    { lng: 0, lat: 0 }
  );

  return {
    lng: totals.lng / ring.length,
    lat: totals.lat / ring.length,
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

    const intersects =
      current[1] > point[1] !== previous[1] > point[1] &&
      point[0] <
        ((previous[0] - current[0]) * (point[1] - current[1])) /
          (previous[1] - current[1]) +
          current[0];

    if (intersects) inside = !inside;
  }

  return inside;
}

export function polygonIsInsidePolygon(childGeometry, parentGeometry) {
  const child = normalizePolygonGeometry(childGeometry);
  const parent = normalizePolygonGeometry(parentGeometry);
  const parentRing = parent.coordinates[0];

  return child.coordinates[0].slice(0, -1).every((point) => pointInRing(point, parentRing));
}
