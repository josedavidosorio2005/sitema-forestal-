import { getPolygonCentroid } from '../utils/geojson.js';

function hashNumber(value) {
  const source = String(value);
  let hash = 0;

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }

  return hash;
}

export async function analyzeVegetation({ geometry, areaM2 }) {
  const centroid = getPolygonCentroid(geometry);
  const seed = hashNumber(`${centroid.lat.toFixed(5)}:${centroid.lng.toFixed(5)}:${areaM2}`);

  // Simulated MVP result. Replace this function later with Sentinel-2/Copernicus
  // NDVI processing while keeping the controller contract unchanged.
  const baseCoverage = 35 + (seed % 58);
  const areaBoost = areaM2 > 50000 ? 4 : areaM2 > 10000 ? 2 : 0;
  const vegetationCoverage = Math.min(96, Math.round(baseCoverage + areaBoost));

  let forestDensity = 'bajo';
  if (vegetationCoverage >= 70) {
    forestDensity = 'alto';
  } else if (vegetationCoverage >= 45) {
    forestDensity = 'medio';
  }

  return {
    vegetationCoverage,
    forestDensity,
    source: 'simulated-ndvi-v1',
    integrationReady: {
      sentinel2: true,
      copernicus: true,
      ndviPipeline: 'pending-real-provider',
    },
  };
}
