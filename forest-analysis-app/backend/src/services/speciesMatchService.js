function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function scoreSpeciesByRegion(species, region) {
  const cleanRegion = normalizeText(region);
  const speciesRegion = normalizeText(species.region);

  if (!cleanRegion || !speciesRegion) return 0.58;
  if (speciesRegion.includes(cleanRegion) || cleanRegion.includes(speciesRegion)) return 0.86;

  const regionTokens = cleanRegion.split(/\s+/).filter(Boolean);
  const speciesTokens = speciesRegion.split(/\s+/).filter(Boolean);
  const matches = regionTokens.filter((token) => speciesTokens.includes(token)).length;

  if (matches === 0) return 0.48;
  return Math.min(0.82, 0.55 + matches * 0.09);
}

export function findProbableSpecies(catalogSpecies, region) {
  return catalogSpecies
    .map((species) => ({
      id: species.id,
      common_name: species.common_name,
      scientific_name: species.scientific_name,
      type: species.type,
      category: species.category || 'maderable',
      region: species.region,
      probability: Number(scoreSpeciesByRegion(species, region).toFixed(2)),
      match_reason: region
        ? 'Coincidencia aproximada con la region indicada por el usuario.'
        : 'Catalogo del cliente sin filtro regional especifico.',
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);
}

export function normalizeConfirmedSpecies(input = [], catalogSpecies = []) {
  if (!Array.isArray(input)) return [];

  const catalogById = new Map(catalogSpecies.map((species) => [Number(species.id), species]));

  return input
    .map((item) => {
      if (typeof item === 'number' || typeof item === 'string') {
        const catalogItem = catalogById.get(Number(item));
        if (!catalogItem) return null;

        return {
          id: catalogItem.id,
          common_name: catalogItem.common_name,
          scientific_name: catalogItem.scientific_name,
          type: catalogItem.type,
          category: catalogItem.category || 'maderable',
          source: 'manual-catalog-selection',
        };
      }

      if (item && typeof item === 'object' && item.common_name) {
        return {
          id: item.id || null,
          common_name: item.common_name,
          scientific_name: item.scientific_name || '',
          type: item.type || '',
          category: item.category || 'otro',
          source: 'manual-entry',
        };
      }

      return null;
    })
    .filter(Boolean);
}
