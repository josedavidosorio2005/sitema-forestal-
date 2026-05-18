import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { formatNumber } from '../utils/helpers';
import './CableLoggingPage.css';

const CABLE_CATALOG = [
  { id: 'custom', name: '— Personalizado —', mbl: 0, weight: 0, diameter: '', material: '' },
  { id: 'iwrc-12', name: '6×19 IWRC Ø12mm', mbl: 89, weight: 0.63, diameter: '12mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-16', name: '6×19 IWRC Ø16mm', mbl: 156, weight: 1.12, diameter: '16mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-19', name: '6×19 IWRC Ø19mm', mbl: 218, weight: 1.58, diameter: '19mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-22', name: '6×19 IWRC Ø22mm', mbl: 293, weight: 2.14, diameter: '22mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-25', name: '6×19 IWRC Ø25mm', mbl: 378, weight: 2.75, diameter: '25mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-28', name: '6×19 IWRC Ø28mm', mbl: 475, weight: 3.45, diameter: '28mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-32', name: '6×19 IWRC Ø32mm', mbl: 620, weight: 4.50, diameter: '32mm', material: 'Acero galvanizado 6×19 IWRC' },
  { id: 'iwrc-35', name: '6×37 IWRC Ø35mm', mbl: 730, weight: 5.38, diameter: '35mm', material: 'Acero 6×37 IWRC (Flexible)' },
  { id: 'iwrc-38', name: '6×37 IWRC Ø38mm', mbl: 870, weight: 6.35, diameter: '38mm', material: 'Acero 6×37 IWRC (Flexible)' },
  { id: 'compactado-25', name: 'Compactado Ø25mm', mbl: 450, weight: 3.20, diameter: '25mm', material: 'Acero compactado alta resistencia' },
  { id: 'compactado-32', name: 'Compactado Ø32mm', mbl: 740, weight: 5.10, diameter: '32mm', material: 'Acero compactado alta resistencia' },
];

function getRecommendations(inputs, results) {
  if (!results) return [];
  const recs = [];
  // eslint-disable-next-line no-unused-vars
  const { FS, Tw, netCapacityKg, clearance, isDangerTight, Fw_kN, T_dead, T_live } = results;
  const L = Number(inputs.L);
  const f = Number(inputs.f);
  const wl = Number(inputs.wl);
  const slope = Number(inputs.slope);

  if (FS < 2.0) {
    recs.push({ type: 'critical', icon: '🚨', title: 'Cable subdimensionado', text: `FS=${formatNumber(FS)} es extremadamente peligroso. Se necesita un cable con MBL mínimo de ${formatNumber(Tw * 3)} kN para FS=3.` });
  } else if (FS < 3.0) {
    const mblNeeded = Tw * 3;
    const match = CABLE_CATALOG.find(c => c.id !== 'custom' && c.mbl >= mblNeeded);
    recs.push({ type: 'warning', icon: '⚠️', title: 'Subir calibre de cable', text: `Para alcanzar FS≥3 necesitas MBL≥${formatNumber(mblNeeded)} kN.${match ? ` Recomendación: ${match.name} (${match.mbl} kN).` : ''}` });
  } else if (FS > 6.0) {
    recs.push({ type: 'info', icon: '💡', title: 'Cable sobredimensionado', text: `FS=${formatNumber(FS)} es mayor al necesario. Podrías usar un cable más liviano para reducir costos y peso muerto.` });
  }

  const sagRatio = f / L;
  if (sagRatio < 0.03) {
    recs.push({ type: 'critical', icon: '🎸', title: 'Flecha insuficiente', text: `Relación f/L = ${(sagRatio * 100).toFixed(1)}%. Aumenta la flecha a mínimo ${formatNumber(L * 0.04)}m (4% del vano) para evitar sobretensión.` });
  } else if (sagRatio < 0.04) {
    recs.push({ type: 'warning', icon: '📏', title: 'Flecha ajustada', text: `f/L = ${(sagRatio * 100).toFixed(1)}%. Ideal entre 4-6%. Flecha recomendada: ${formatNumber(L * 0.05)}m.` });
  } else if (sagRatio > 0.08) {
    recs.push({ type: 'info', icon: '📐', title: 'Flecha excesiva', text: `f/L = ${(sagRatio * 100).toFixed(1)}% reduce el despeje vertical. Considera reducir a ${formatNumber(L * 0.06)}m.` });
  }

  if (clearance < 0) {
    recs.push({ type: 'critical', icon: '🌍', title: 'Carga arrastra por suelo', text: `Despeje negativo (${formatNumber(clearance)}m). Aumenta h de torres o reduce la flecha.` });
  } else if (clearance < 3) {
    recs.push({ type: 'warning', icon: '🌲', title: 'Despeje mínimo', text: `Solo ${formatNumber(clearance)}m libres. En terreno irregular la carga puede golpear obstáculos. Se recomiendan mínimo 3m.` });
  }

  if (Fw_kN > 2.0) {
    recs.push({ type: 'critical', icon: '🌪️', title: 'Viento extremo', text: `Carga eólica de ${formatNumber(Fw_kN)} kN. Suspender operaciones hasta que el viento baje de 10 m/s.` });
  } else if (Fw_kN > 1.0) {
    recs.push({ type: 'warning', icon: '🌬️', title: 'Riesgo eólico', text: `Fuerza de viento ${formatNumber(Fw_kN)} kN puede causar oscilación lateral. Reducir carga un 20%.` });
  }

  if (slope > 60) {
    recs.push({ type: 'warning', icon: '⛰️', title: 'Pendiente pronunciada', text: `Pendiente del ${slope}%. Asegurar anclajes reforzados en la torre superior y utilizar frenos de descenso.` });
  }

  if (netCapacityKg > 0 && wl > netCapacityKg * 0.85) {
    recs.push({ type: 'warning', icon: '📦', title: 'Carga cercana al límite', text: `Estás usando ${formatNumber((wl / netCapacityKg) * 100)}% de la capacidad máxima. Mantén un margen mínimo del 15%.` });
  }

  if (T_dead > T_live * 2) {
    recs.push({ type: 'info', icon: '⚖️', title: 'Peso propio dominante', text: `La tensión por peso del cable (${formatNumber(T_dead)} kN) supera ampliamente la carga útil. Considera un cable más liviano.` });
  }

  if (recs.length === 0) {
    recs.push({ type: 'success', icon: '✅', title: 'Configuración óptima', text: 'Todos los parámetros están dentro de rangos seguros y eficientes.' });
  }

  return recs;
}

const STORAGE_KEY = 'cable_via_state';

const DEFAULT_INPUTS = {
  L: 300, f: 15, hA: 20, hB: 18,
  mbl: 450, cableWeight: 3.20,
  wl: 2500, v: 12, A: 3.5, slope: 15,
};

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function CableLoggingPage() {
  const saved = loadSaved();

  const [selectedCableId, setSelectedCableId] = useState(saved?.selectedCableId || 'compactado-25');
  const [savedCables, setSavedCables] = useState(saved?.savedCables || []);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [customCableName, setCustomCableName] = useState('');
  const [customCableParams, setCustomCableParams] = useState({ mbl: '', weight: '', diameter: '', material: '' });

  const defaultCable = CABLE_CATALOG.find(c => c.id === 'compactado-25');

  const [inputs, setInputs] = useState(saved?.inputs || {
    L: 300,
    f: 15,
    hA: 20,
    hB: 18,
    mbl: defaultCable.mbl,
    cableWeight: defaultCable.weight,
    wl: 2500,
    v: 12,
    A: 3.5,
    slope: 15,
  });

  const [results, setResults] = useState(saved?.results || null);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      inputs, results, selectedCableId, savedCables,
    }));
  }, [inputs, results, selectedCableId, savedCables]);

  const allCables = [...CABLE_CATALOG, ...savedCables];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleCableSelect = (e) => {
    const id = e.target.value;
    setSelectedCableId(id);
    const cable = allCables.find(c => c.id === id);
    if (cable && cable.id !== 'custom') {
      setInputs(prev => ({ ...prev, mbl: cable.mbl, cableWeight: cable.weight }));
    }
  };

  const handleSaveCustomCable = () => {
    if (!customCableName.trim() || !Number(customCableParams.mbl) || !Number(customCableParams.weight)) return;
    const newCable = {
      id: `custom-${Date.now()}`,
      name: customCableName.trim(),
      mbl: Number(customCableParams.mbl),
      weight: Number(customCableParams.weight),
      diameter: customCableParams.diameter || 'N/A',
      material: customCableParams.material || 'Personalizado'
    };
    setSavedCables(prev => [...prev, newCable]);
    setSelectedCableId(newCable.id);
    setInputs(prev => ({ ...prev, mbl: newCable.mbl, cableWeight: newCable.weight }));
    setShowSaveForm(false);
    setCustomCableName('');
    setCustomCableParams({ mbl: '', weight: '', diameter: '', material: '' });
  };

  const handleCustomParamChange = (e) => {
    const { name, value } = e.target;
    setCustomCableParams(prev => ({ ...prev, [name]: value }));
  };

  const calculate = (e) => {
    e?.preventDefault();
    const g = 9.81;

    const L = Number(inputs.L);
    const f = Number(inputs.f);
    const hA = Number(inputs.hA);
    const hB = Number(inputs.hB);
    const mbl = Number(inputs.mbl);
    const cableWeight = Number(inputs.cableWeight);
    const wl = Number(inputs.wl);
    const v = Number(inputs.v);
    const A = Number(inputs.A);

    if (f <= 0 || L <= 0 || mbl <= 0) {
      alert('Valores invalidos. Revisa la flecha, longitud y carga de ruptura.');
      return;
    }

    const q = (cableWeight * g) / 1000;
    const T_dead = (q * Math.pow(L, 2)) / (8 * f);
    const P = (wl * g) / 1000;
    const T_live = (P * L) / (4 * f);
    const Tw = T_dead + T_live;
    const FS = mbl / Tw;

    const rho = 1.225;
    const Cd = 1.1;
    const Fw = 0.5 * rho * Math.pow(v, 2) * A * Cd;
    const Fw_kN = Fw / 1000;

    const T_max_allowed = mbl / 3.0;
    const T_net_live = T_max_allowed - T_dead;
    let netCapacityKg = 0;
    if (T_net_live > 0) {
      const P_max = (T_net_live * 4 * f) / L;
      netCapacityKg = (P_max * 1000) / g;
    }

    // Clearance uses the lowest effective point (min tower height minus sag)
    const hMid = (hA + hB) / 2;
    const clearance = hMid - f;

    setResults({
      Tw, FS, Fw_kN, netCapacityKg, clearance, T_dead, T_live,
      isDangerTight: f / L < 0.03,
    });
  };

  const selectedCable = allCables.find(c => c.id === selectedCableId);
  const recommendations = getRecommendations(inputs, results);

  const generateDiagram = () => {
    const vw = 900;
    const vh = 420;
    const padL = 80;
    const padR = 80;
    const padTop = 35;
    const padBot = 50;

    const f_val = Number(inputs.f) || 10;
    const hA_val = Number(inputs.hA) || 20;
    const hB_val = Number(inputs.hB) || 18;
    const slopeVal = Number(inputs.slope) || 0;

    const t1x = padL;
    const t2x = vw - padR;
    const spanPx = t2x - t1x;

    // Ground line with slope
    const groundBaseY = vh - padBot;
    const clampedSlope = Math.min(Math.max(slopeVal, -50), 50);
    const slopeRise = spanPx * (clampedSlope / 100);
    const groundY1 = groundBaseY;
    const groundY2 = groundBaseY - slopeRise;

    // Tower heights – scaled independently
    const maxTowerPx = vh - padTop - padBot - 30;
    const towerPxA = Math.min(Math.max(hA_val * 3.5, 40), maxTowerPx);
    const towerPxB = Math.min(Math.max(hB_val * 3.5, 40), maxTowerPx);
    const topY1 = groundY1 - towerPxA;
    const topY2 = groundY2 - towerPxB;

    // Catenary curve (parabolic approximation sampled at N points)
    const N = 50;
    const cablePoints = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = t1x + t * spanPx;
      // Linear interpolation of tower tops + parabolic sag
      const baseY = topY1 + t * (topY2 - topY1);
      const sagPx = 4 * f_val * 3.5 * t * (1 - t); // max sag at center, scaled
      const clampedSag = Math.min(sagPx, maxTowerPx * 0.8);
      cablePoints.push([x, baseY + clampedSag]);
    }
    const cablePath = cablePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

    // Load position (center of span)
    const loadIdx = Math.floor(N / 2);
    const loadX = cablePoints[loadIdx][0];
    const loadY = cablePoints[loadIdx][1];

    // Clearance
    const groundAtMid = groundY1 + 0.5 * (groundY2 - groundY1);
    const clearancePx = groundAtMid - (loadY + 40);

    // Safety coloring
    const fsVal = results?.FS || 0;
    const cableColor = !results ? '#334155' : fsVal >= 3 ? '#16a34a' : fsVal >= 2 ? '#d97706' : '#dc2626';
    const cableStroke = !results ? 3 : fsVal >= 3 ? 3 : 4;

    // Slope angle label
    const slopeAngleDeg = Math.atan(slopeVal / 100) * (180 / Math.PI);

    return (
      <div className="diagram-container">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="cable-diagram" style={{ maxHeight: '420px' }}>
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f0f9ff" />
            </linearGradient>
            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>
            <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#dc2626" />
            </marker>
            <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#2563eb" />
            </marker>
          </defs>

          {/* Sky */}
          <rect x="0" y="0" width={vw} height={vh} fill="url(#skyGrad)" rx="12" />

          {/* Ground fill */}
          <polygon
            points={`0,${groundY1 + 15} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 15} ${vw},${vh} 0,${vh}`}
            fill="url(#groundGrad)" opacity="0.7"
          />
          {/* Ground surface line */}
          <polyline
            points={`0,${groundY1 + 15} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 15}`}
            fill="none" stroke="#22c55e" strokeWidth="3"
          />
          {/* Ground texture lines */}
          {[0.15, 0.35, 0.55, 0.75, 0.9].map((t, i) => {
            const gx = t1x + t * spanPx;
            const gy = groundY1 + t * (groundY2 - groundY1);
            return <line key={i} x1={gx - 8} y1={gy + 6} x2={gx + 8} y2={gy + 3} stroke="#4ade80" strokeWidth="1.5" opacity="0.5" />;
          })}

          {/* ─── Tower 1 (left) ─── */}
          {/* Main post */}
          <line x1={t1x} y1={groundY1} x2={t1x} y2={topY1} stroke="#334155" strokeWidth="7" strokeLinecap="round" />
          {/* Guy wires */}
          <line x1={t1x} y1={topY1} x2={t1x - 25} y2={groundY1} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
          <line x1={t1x} y1={topY1} x2={t1x + 15} y2={groundY1} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
          {/* Tower cap */}
          <circle cx={t1x} cy={topY1} r="5" fill="#475569" />
          {/* Cross beams */}
          {[0.3, 0.6].map((ratio, i) => {
            const by = groundY1 - ratio * towerPxA;
            return <line key={i} x1={t1x - 6} y1={by} x2={t1x + 6} y2={by} stroke="#475569" strokeWidth="2" />;
          })}
          {/* Base plate */}
          <rect x={t1x - 12} y={groundY1 - 2} width="24" height="4" fill="#475569" rx="1" />

          {/* ─── Tower 2 (right) ─── */}
          <line x1={t2x} y1={groundY2} x2={t2x} y2={topY2} stroke="#334155" strokeWidth="7" strokeLinecap="round" />
          <line x1={t2x} y1={topY2} x2={t2x + 25} y2={groundY2} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 3" />
          <line x1={t2x} y1={topY2} x2={t2x - 15} y2={groundY2} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx={t2x} cy={topY2} r="5" fill="#475569" />
          {[0.3, 0.6].map((ratio, i) => {
            const by = groundY2 - ratio * towerPxB;
            return <line key={i} x1={t2x - 6} y1={by} x2={t2x + 6} y2={by} stroke="#475569" strokeWidth="2" />;
          })}
          <rect x={t2x - 12} y={groundY2 - 2} width="24" height="4" fill="#475569" rx="1" />

          {/* ─── Cable (catenary curve) ─── */}
          <path d={cablePath} fill="none" stroke={cableColor} strokeWidth={cableStroke} strokeLinecap="round" />

          {/* ─── Trolley / Carriage ─── */}
          {/* Pulley wheels on cable */}
          <circle cx={loadX - 8} cy={loadY} r="4" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <circle cx={loadX + 8} cy={loadY} r="4" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          {/* Hoist line */}
          <line x1={loadX} y1={loadY + 4} x2={loadX} y2={loadY + 30} stroke="#475569" strokeWidth="2" />
          {/* Hook */}
          <circle cx={loadX} cy={loadY + 32} r="3" fill="none" stroke="#475569" strokeWidth="2" />
          {/* Log/Load */}
          <rect x={loadX - 22} y={loadY + 36} width="44" height="10" rx="4" fill="#92400e" stroke="#78350f" strokeWidth="1" />
          <rect x={loadX - 18} y={loadY + 38} width="36" height="6" rx="2" fill="#a16207" opacity="0.5" />
          {/* Load weight label */}
          <text x={loadX} y={loadY + 60} textAnchor="middle" fontSize="10" fill="#78350f" fontWeight="700">
            {formatNumber(inputs.wl)} kg
          </text>

          {/* ─── Dimension: Sag (f) ─── */}
          {(() => {
            const chordMidY = (topY1 + topY2) / 2;
            // Place sag dimension to the right of center, offset enough to clear the trolley
            const sagDimX = loadX + 55;
            return (
              <>
                <line x1={sagDimX} y1={chordMidY} x2={sagDimX} y2={loadY} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1={sagDimX - 5} y1={chordMidY} x2={sagDimX + 5} y2={chordMidY} stroke="#dc2626" strokeWidth="1.5" />
                <line x1={sagDimX - 5} y1={loadY} x2={sagDimX + 5} y2={loadY} stroke="#dc2626" strokeWidth="1.5" />
                <text x={sagDimX + 8} y={(chordMidY + loadY) / 2 + 4} fontSize="11" fill="#dc2626" fontWeight="700">
                  f={inputs.f}m
                </text>
              </>
            );
          })()}

          {/* ─── Dimension: Tower height - left tower (hA) ─── */}
          {/* Placed outside the left tower, offset left */}
          <line x1={t1x - 30} y1={groundY1} x2={t1x - 30} y2={topY1} stroke="#2563eb" strokeWidth="1.5" />
          <line x1={t1x - 35} y1={groundY1} x2={t1x - 25} y2={groundY1} stroke="#2563eb" strokeWidth="1" />
          <line x1={t1x - 35} y1={topY1} x2={t1x - 25} y2={topY1} stroke="#2563eb" strokeWidth="1" />
          <text x={t1x - 33} y={(groundY1 + topY1) / 2 + 4} textAnchor="end" fontSize="10" fill="#2563eb" fontWeight="700">
            hA={inputs.hA}m
          </text>

          {/* ─── Dimension: Tower height - right tower (hB) ─── */}
          {/* Placed outside the right tower, offset right but clamped to viewBox */}
          {(() => {
            const dimX = Math.min(t2x + 30, vw - 65);
            return (
              <>
                <line x1={dimX} y1={groundY2} x2={dimX} y2={topY2} stroke="#7c3aed" strokeWidth="1.5" />
                <line x1={dimX - 5} y1={groundY2} x2={dimX + 5} y2={groundY2} stroke="#7c3aed" strokeWidth="1" />
                <line x1={dimX - 5} y1={topY2} x2={dimX + 5} y2={topY2} stroke="#7c3aed" strokeWidth="1" />
                <text x={dimX + 8} y={(groundY2 + topY2) / 2 + 4} fontSize="10" fill="#7c3aed" fontWeight="700">
                  hB={inputs.hB}m
                </text>
              </>
            );
          })()}

          {/* ─── Dimension: Vano (L) ─── */}
          {/* Always at the very bottom of the SVG, safe from overlaps */}
          <line x1={t1x} y1={vh - 18} x2={t2x} y2={vh - 18} stroke="#15803d" strokeWidth="1.5" />
          <line x1={t1x} y1={vh - 23} x2={t1x} y2={vh - 13} stroke="#15803d" strokeWidth="1.5" />
          <line x1={t2x} y1={vh - 23} x2={t2x} y2={vh - 13} stroke="#15803d" strokeWidth="1.5" />
          <text x={(t1x + t2x) / 2} y={vh - 5} textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="700">
            Vano (L) = {inputs.L}m
          </text>

          {/* ─── Clearance indicator ─── */}
          {(() => {
            const clrTopY = loadY + 55;
            const clrBotY = groundAtMid;
            if (clrBotY - clrTopY < 15) return null;
            const clrColor = clearancePx < 0 ? '#dc2626' : clearancePx < 60 ? '#d97706' : '#0891b2';
            // Place clearance line further left of center to avoid trolley
            const clrX = loadX - 50;
            return (
              <>
                <line x1={clrX} y1={clrTopY} x2={clrX} y2={clrBotY} stroke={clrColor} strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1={clrX - 5} y1={clrTopY} x2={clrX + 5} y2={clrTopY} stroke={clrColor} strokeWidth="1" />
                <line x1={clrX - 5} y1={clrBotY} x2={clrX + 5} y2={clrBotY} stroke={clrColor} strokeWidth="1" />
                <text x={clrX - 8} y={(clrTopY + clrBotY) / 2 + 4} textAnchor="end" fontSize="9" fill={clrColor} fontWeight="600">
                  Despeje
                </text>
              </>
            );
          })()}

          {/* ─── Tower names: placed ABOVE each tower top to avoid ground/slope collisions ─── */}
          <text x={t1x} y={topY1 - 12} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700">Torre A</text>
          <text x={t2x} y={topY2 - 12} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="700">Torre B</text>

          {/* ─── Slope indicator: badge on the mid-terrain, placed adaptively ─── */}
          {slopeVal !== 0 && (() => {
            // Position along the terrain line at 75% of the span
            const slopeT = 0.75;
            const slopeLabelX = t1x + slopeT * spanPx;
            const slopeLabelY = groundY1 + slopeT * (groundY2 - groundY1);
            // Offset below ground, but clamp to stay in viewBox
            const labelY = Math.min(slopeLabelY + 16, vh - 28);
            return (
              <>
                <rect x={slopeLabelX - 55} y={labelY - 10} width="110" height="16" rx="8"
                  fill="rgba(71,85,105,0.12)" stroke="#94a3b8" strokeWidth="0.5" />
                <text x={slopeLabelX} y={labelY + 2} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
                  {slopeAngleDeg > 0 ? '↗' : '↘'} Pend: {Math.abs(slopeVal)}% ({Math.abs(slopeAngleDeg).toFixed(1)}°)
                </text>
              </>
            );
          })()}

          {/* ─── Tension forces arrows ─── */}
          {results && (
            <>
              {/* Left tower tension arrow - placed to the right of tower top */}
              <line x1={t1x + 5} y1={topY1 - 2} x2={t1x + 30} y2={topY1 + 12} stroke="#dc2626" strokeWidth="2" markerEnd="url(#arrowRed)" />
              <text x={t1x + 35} y={topY1 + 10} fontSize="9" fill="#dc2626" fontWeight="600">
                T={formatNumber(results.Tw)}kN
              </text>
              {/* Safety badge - top-left corner, always safe */}
              <rect x={padL - 5} y={8} width="72" height="22" rx="6"
                fill={fsVal >= 3 ? '#dcfce7' : fsVal >= 2 ? '#fef9c3' : '#fee2e2'}
                stroke={fsVal >= 3 ? '#22c55e' : fsVal >= 2 ? '#eab308' : '#ef4444'}
                strokeWidth="1.5"
              />
              <text x={padL + 31} y={23} textAnchor="middle" fontSize="10"
                fill={fsVal >= 3 ? '#15803d' : fsVal >= 2 ? '#a16207' : '#dc2626'}
                fontWeight="800"
              >
                FS = {formatNumber(fsVal)}
              </text>
            </>
          )}

          {/* ─── Wind indicator (top-right corner, always safe) ─── */}
          {results && results.Fw_kN > 0.1 && (
            <>
              <text x={vw - 12} y={18} textAnchor="end" fontSize="9" fill="#64748b" fontWeight="600">🌬️ {formatNumber(results.Fw_kN)} kN</text>
              {[0, 10, 20].map((dy, i) => (
                <line key={i} x1={vw - 55} y1={22 + dy} x2={vw - 25} y2={20 + dy} stroke="#94a3b8" strokeWidth="1.5" opacity={0.4 + i * 0.2} />
              ))}
            </>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">🚠 Simulador Físico</span>
            <h1>Ingeniería de Cable Vía</h1>
            <p>Calcula tensiones, factores de seguridad y capacidades de carga paramétricas para sistemas de extracción forestal suspendida.</p>
          </div>
        </div>

        {generateDiagram()}

        <div className="cable-calculator-grid mt-2">
          <form className="cable-form" onSubmit={calculate}>
            <div className="form-sections-wrapper">

              {/* Cable Catalog Section */}
              <div className="form-section cable-catalog-section">
                <h3><span className="icon">🔗</span> Catálogo de Cables</h3>
                <div className="form-group">
                  <label>Cable pre-configurado</label>
                  <select
                    value={selectedCableId}
                    onChange={handleCableSelect}
                    className="cable-select"
                  >
                    <optgroup label="Cables Estándar">
                      {CABLE_CATALOG.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.mbl ? ` — ${c.mbl} kN / ${c.weight} kg/m` : ''}
                        </option>
                      ))}
                    </optgroup>
                    {savedCables.length > 0 && (
                      <optgroup label="Mis Cables Guardados">
                        {savedCables.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {c.mbl} kN / {c.weight} kg/m
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                {selectedCable && selectedCable.id !== 'custom' && !showSaveForm && (
                  <div className="cable-spec-card">
                    <div className="cable-spec-header">
                      <strong>{selectedCable.name}</strong>
                      <span className="cable-badge">{selectedCable.diameter}</span>
                    </div>
                    <div className="cable-spec-grid">
                      <div><small>MBL</small><span>{selectedCable.mbl} kN</span></div>
                      <div><small>Peso</small><span>{selectedCable.weight} kg/m</span></div>
                    </div>
                    <small className="cable-material">{selectedCable.material}</small>
                  </div>
                )}
                {selectedCableId === 'custom' && !showSaveForm && (
                  <button type="button" className="btn btn-secondary btn-small mt-2" onClick={() => setShowSaveForm(true)}>
                    ➕ Crear cable personalizado
                  </button>
                )}
                {showSaveForm && (
                  <div className="save-cable-form mt-2">
                    <h4 style={{margin:'0 0 12px 0',fontSize:'0.9rem',color:'#1a3d2c'}}>Definir Cable Personalizado</h4>
                    <div className="form-group" style={{marginBottom:'10px'}}>
                      <label>Nombre del cable *</label>
                      <input type="text" placeholder="Ej: Cable mina norte 28mm" value={customCableName} onChange={e => setCustomCableName(e.target.value)} />
                    </div>
                    <div style={{display:'flex',gap:'10px'}}>
                      <div className="form-group" style={{flex:1,marginBottom:'10px'}}>
                        <label>MBL (kN) *</label>
                        <input type="number" step="0.1" name="mbl" placeholder="Ej: 450" value={customCableParams.mbl} onChange={handleCustomParamChange} />
                      </div>
                      <div className="form-group" style={{flex:1,marginBottom:'10px'}}>
                        <label>Peso (kg/m) *</label>
                        <input type="number" step="0.01" name="weight" placeholder="Ej: 3.2" value={customCableParams.weight} onChange={handleCustomParamChange} />
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'10px'}}>
                      <div className="form-group" style={{flex:1,marginBottom:'10px'}}>
                        <label>Diámetro</label>
                        <input type="text" name="diameter" placeholder="Ej: 28mm" value={customCableParams.diameter} onChange={handleCustomParamChange} />
                      </div>
                      <div className="form-group" style={{flex:1,marginBottom:'10px'}}>
                        <label>Material</label>
                        <input type="text" name="material" placeholder="Ej: Acero galvanizado" value={customCableParams.material} onChange={handleCustomParamChange} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button type="button" className="btn btn-primary btn-small" onClick={handleSaveCustomCable} disabled={!customCableName.trim() || !customCableParams.mbl || !customCableParams.weight}>💾 Guardar Cable</button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => { setShowSaveForm(false); setCustomCableParams({ mbl: '', weight: '', diameter: '', material: '' }); setCustomCableName(''); }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3><span className="icon">📐</span> Geometría del Vano</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Vano horizontal (L) [m]</label>
                    <input type="number" step="0.1" name="L" value={inputs.L} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Flecha central (f) [m]</label>
                    <input type="number" step="0.1" name="f" value={inputs.f} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Altura Torre A (hA) [m]</label>
                    <input type="number" step="0.1" name="hA" value={inputs.hA} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Altura Torre B (hB) [m]</label>
                    <input type="number" step="0.1" name="hB" value={inputs.hB} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Pendiente [%]</label>
                    <input type="number" step="0.1" name="slope" value={inputs.slope} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3><span className="icon">⚙️</span> Resistencia y Carga</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Carga Ruptura (MBL) [kN]</label>
                    <input type="number" step="0.1" name="mbl" value={inputs.mbl} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Peso cable [kg/m]</label>
                    <input type="number" step="0.1" name="cableWeight" value={inputs.cableWeight} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Carga útil (Madera) [kg]</label>
                  <input type="number" step="1" name="wl" value={inputs.wl} onChange={handleChange} required className="highlight-input" />
                </div>
              </div>

              <div className="form-section">
                <h3><span className="icon">🌬️</span> Condiciones Ambientales</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Viento (v) [m/s]</label>
                    <input type="number" step="0.1" name="v" value={inputs.v} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Área expuesta [m²]</label>
                    <input type="number" step="0.1" name="A" value={inputs.A} onChange={handleChange} required />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-large"
                onClick={() => {
                  setInputs({
                    L: '', f: '', hA: '', hB: '',
                    mbl: '', cableWeight: '',
                    wl: '', v: '', A: '', slope: '',
                  });
                  setResults(null);
                  setSelectedCableId('custom');
                  setShowSaveForm(false);
                }}
              >
                🗑️ Limpiar Datos
              </button>
              <button type="submit" className="btn btn-primary btn-large">
                Ejecutar Simulación Física
              </button>
            </div>
          </form>
        </div>
      </main>

      <Sidebar title="Tablero de Resultados">
        {!results ? (
          <div className="state-box">
            <p>Selecciona un cable del catálogo, ajusta los parámetros y ejecuta la simulación para visualizar el comportamiento estructural.</p>
          </div>
        ) : (
          <>
            <section className="sidebar-section">
              <h3 className="sidebar-section-title">Análisis de Integridad</h3>

              <div className={`metric-box ${results.FS < 3 ? 'danger' : 'success'}`}>
                <span>Factor de Seguridad (FS)</span>
                <div className="fs-display">
                  <strong>{formatNumber(results.FS)}</strong>
                  <div className="fs-gauge">
                    <div
                      className="fs-gauge-fill"
                      style={{ width: `${Math.min((results.FS / 6) * 100, 100)}%`, background: results.FS < 3 ? '#ef4444' : '#22c55e' }}
                    ></div>
                  </div>
                </div>
                <small>El estándar operativo exige FS ≥ 3.0</small>
              </div>

              <div className="metric-box">
                <span>Tensión de Trabajo Máxima</span>
                <strong>{formatNumber(results.Tw)} kN</strong>
                <small>Cable vacío: {formatNumber(results.T_dead)} kN | Carga: {formatNumber(results.T_live)} kN</small>
              </div>

              <div className="metric-box highlight">
                <span>Carga Máxima Permitida (Payload)</span>
                <strong>{formatNumber(results.netCapacityKg)} kg</strong>
                <small>Límite teórico para no bajar de FS=3.0</small>
              </div>

              <div className={`metric-box ${results.clearance < 2 ? 'warning' : 'neutral'}`}>
                <span>Despeje Vertical (Clearance)</span>
                <strong>{formatNumber(results.clearance)} m</strong>
                <small>Distancia libre estimada al suelo</small>
              </div>
            </section>

            <section className="sidebar-section">
              <h3 className="sidebar-section-title">Recomendaciones de Ingeniería</h3>
              <div className="recommendations-list">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`rec-card rec-${rec.type}`}>
                    <div className="rec-header">
                      <span className="rec-icon">{rec.icon}</span>
                      <strong>{rec.title}</strong>
                    </div>
                    <p>{rec.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="sidebar-section">
              <h3 className="sidebar-section-title">Cable Sugerido</h3>
              {(() => {
                const minMbl = results.Tw * 3;
                const suggested = CABLE_CATALOG.filter(c => c.id !== 'custom' && c.mbl >= minMbl).sort((a, b) => a.mbl - b.mbl)[0];
                if (!suggested) return <p className="sidebar-copy">Ningún cable del catálogo cumple con FS≥3 para esta configuración.</p>;
                const isCurrentBetter = selectedCable && selectedCable.id !== 'custom' && selectedCable.mbl >= minMbl && selectedCable.mbl <= suggested.mbl;
                return (
                  <div className="cable-suggestion">
                    <div className="cable-spec-card suggested">
                      <div className="cable-spec-header">
                        <strong>{suggested.name}</strong>
                        <span className="cable-badge">{suggested.diameter}</span>
                      </div>
                      <div className="cable-spec-grid">
                        <div><small>MBL</small><span>{suggested.mbl} kN</span></div>
                        <div><small>Peso</small><span>{suggested.weight} kg/m</span></div>
                      </div>
                      <small className="cable-material">{suggested.material}</small>
                    </div>
                    {isCurrentBetter ? (
                      <small className="text-success">✅ Tu cable actual ya cumple este requisito.</small>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-small btn-block mt-1"
                        onClick={() => {
                          setSelectedCableId(suggested.id);
                          setInputs(prev => ({ ...prev, mbl: suggested.mbl, cableWeight: suggested.weight }));
                        }}
                      >
                        Aplicar esta sugerencia
                      </button>
                    )}
                  </div>
                );
              })()}
            </section>
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default CableLoggingPage;
