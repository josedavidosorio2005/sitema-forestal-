export const SOIL_OPTIONS = [
  {
    value: 'pasto',
    label: 'Pasto',
    frictionCoefficient: 0.35,
  },
  {
    value: 'tierra_seca',
    label: 'Tierra seca',
    frictionCoefficient: 0.4,
  },
  {
    value: 'lodo',
    label: 'Lodo',
    frictionCoefficient: 0.6,
  },
  {
    value: 'grava',
    label: 'Grava',
    frictionCoefficient: 0.5,
  },
];

const SOIL_BY_VALUE = SOIL_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option;
  return acc;
}, {});

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

export function getSoilOption(value) {
  return SOIL_BY_VALUE[value] || SOIL_BY_VALUE.tierra_seca;
}

export function calculateLogDragTension({
  peso_tronco,
  angulo_pendiente,
  tipo_suelo = 'tierra_seca',
  distancia_arrastre,
  factor_seguridad = 5,
}) {
  const selectedSoil = getSoilOption(tipo_suelo);
  const massKg = Number(peso_tronco);
  const slope = Number(angulo_pendiente);
  const distance = Number(distancia_arrastre);
  const friction = selectedSoil.frictionCoefficient;
  const safety = Number(factor_seguridad || 5);
  const gravity = 9.81;

  if (!Number.isFinite(massKg) || massKg <= 0) {
    return null;
  }

  if (!Number.isFinite(slope) || slope < 0 || slope > 90) {
    return null;
  }

  if (!Number.isFinite(friction) || friction < 0 || friction > 2) {
    return null;
  }

  if (!Number.isFinite(distance) || distance < 0 || distance > 10000) {
    return null;
  }

  if (!Number.isFinite(safety) || safety < 1 || safety > 20) {
    return null;
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
    soil: selectedSoil.value,
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
        soil: selectedSoil.value,
        distance,
        safetyTensionKn: ropeMinimumKn,
      }),
    },
    technical: {
      peso_tronco: massKg,
      angulo_pendiente: slope,
      tipo_suelo: selectedSoil.value,
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
    },
  };
}
