export const SOIL_OPTIONS = {
  pasto: {
    label: 'Pasto',
    frictionCoefficient: 0.35,
  },
  tierra_seca: {
    label: 'Tierra seca',
    frictionCoefficient: 0.4,
  },
  lodo: {
    label: 'Lodo',
    frictionCoefficient: 0.6,
  },
  grava: {
    label: 'Grava',
    frictionCoefficient: 0.5,
  },
};

const LEGACY_SOIL_ALIASES = {
  tierra: 'tierra_seca',
};

function normalizeSoil(value) {
  const soil = String(value || 'tierra_seca').toLowerCase().trim();
  return LEGACY_SOIL_ALIASES[soil] || soil;
}

export function resolveExtractionInput(payload = {}) {
  const soil = normalizeSoil(payload.tipo_suelo || payload.surface);
  const soilConfig = SOIL_OPTIONS[soil] || SOIL_OPTIONS.tierra_seca;
  const friction = Number(payload.frictionCoefficient ?? soilConfig.frictionCoefficient);

  return {
    peso_tronco: Number(payload.peso_tronco ?? payload.weightKg),
    angulo_pendiente: Number(payload.angulo_pendiente ?? payload.slopeDegrees),
    tipo_suelo: SOIL_OPTIONS[soil] ? soil : 'tierra_seca',
    distancia_arrastre: Number(payload.distancia_arrastre ?? payload.dragDistanceMeters ?? 0),
    coeficiente_friccion: friction,
    factor_seguridad: Number(payload.factor_seguridad ?? payload.safetyFactor ?? 5),
  };
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildAlerts({ slope, soil, distance, baseTensionKn, safetyTensionKn }) {
  const alerts = [];

  if (slope >= 25) {
    alerts.push('Pendiente alta: riesgo de deslizamiento y perdida de control del tronco.');
  }

  if (slope >= 15 || distance >= 30) {
    alerts.push('Carga de choque: evita tirones bruscos y usa arranque progresivo.');
  }

  if (soil === 'lodo') {
    alerts.push('Lodo: alta friccion, atascamiento y variacion rapida de carga.');
  }

  if (soil === 'grava') {
    alerts.push('Grava: abrasion elevada en cuerda, eslinga y puntos de contacto.');
  }

  if (distance >= 50) {
    alerts.push('Arrastre largo: aumenta desgaste, calentamiento y probabilidad de enganche.');
  }

  if (baseTensionKn >= 15 || safetyTensionKn >= 75) {
    alerts.push('Carga elevada: revisa anclajes, poleas, grilletes y capacidad del winche.');
  }

  if (alerts.length === 0) {
    alerts.push('Riesgo moderado: verifica anclajes, trayectoria libre y comunicacion del equipo.');
  }

  return alerts;
}

function chooseMaterial({ soil, distance, safetyTensionKn }) {
  if (safetyTensionKn >= 60) {
    return 'Dyneema/HMPE con funda antiabrasion y herrajes certificados.';
  }

  if (soil === 'grava' || distance >= 50) {
    return 'Poliester de alta tenacidad con funda antiabrasion.';
  }

  if (soil === 'lodo') {
    return 'Dyneema/HMPE o poliester trenzado con funda lavable.';
  }

  return 'Poliester trenzado de baja elongacion.';
}

export function calculateLogDragTension(payload) {
  const {
    peso_tronco: massKg,
    angulo_pendiente: slope,
    tipo_suelo: soil,
    distancia_arrastre: distance,
    coeficiente_friccion: friction,
    factor_seguridad: safety,
  } = resolveExtractionInput(payload);
  const gravity = 9.81;

  if (!Number.isFinite(massKg) || massKg <= 0) {
    throw new Error('peso_tronco debe ser mayor que cero.');
  }

  if (!Number.isFinite(slope) || slope < 0 || slope > 90) {
    throw new Error('angulo_pendiente debe estar entre 0 y 90 grados.');
  }

  if (!Number.isFinite(friction) || friction < 0 || friction > 2) {
    throw new Error('coeficiente_friccion debe estar entre 0 y 2.');
  }

  if (!Number.isFinite(safety) || safety < 1 || safety > 20) {
    throw new Error('factor_seguridad debe estar entre 1 y 20.');
  }

  if (!Number.isFinite(distance) || distance < 0 || distance > 10000) {
    throw new Error('distancia_arrastre debe ser un numero positivo.');
  }

  const angleRadians = (slope * Math.PI) / 180;
  const weightForceN = massKg * gravity;
  const slopeComponentN = weightForceN * Math.sin(angleRadians);
  const normalForceN = weightForceN * Math.cos(angleRadians);
  const frictionForceN = friction * normalForceN;
  const baseTensionN = slopeComponentN + frictionForceN;
  const ropeMinimumN = baseTensionN * safety;
  const baseTensionKn = baseTensionN / 1000;
  const ropeMinimumKn = ropeMinimumN / 1000;
  const mbsRecommendedKg = ropeMinimumN / gravity;
  const alertas = buildAlerts({
    slope,
    soil,
    distance,
    baseTensionKn,
    safetyTensionKn: ropeMinimumKn,
  });

  return {
    json: {
      tension_estatica_kN: round(baseTensionKn, 2),
      tension_con_seguridad_kN: round(ropeMinimumKn, 2),
      mbs_recomendado_kg: Math.ceil(mbsRecommendedKg),
      coeficiente_friccion_usado: friction,
      alertas,
      material_sugerido: chooseMaterial({
        soil,
        distance,
        safetyTensionKn: ropeMinimumKn,
      }),
    },
    technical: {
      peso_tronco: massKg,
      angulo_pendiente: slope,
      tipo_suelo: soil,
      distancia_arrastre: distance,
      factor_seguridad: safety,
      gravity,
      angleRadians,
      weightForceN,
      slopeComponentN,
      normalForceN,
      frictionForceN,
      baseTensionN,
      baseTensionKn,
      ropeMinimumN,
      ropeMinimumKn,
      mbsRecommendedKg,
      formula: 'T = m*g*(sin(theta)+mu*cos(theta)); cuerda_minima = T*FS',
    },
  };
}
