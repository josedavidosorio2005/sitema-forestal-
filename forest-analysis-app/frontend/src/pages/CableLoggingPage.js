import React, { useState } from 'react';
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
  const { FS, Tw, netCapacityKg, clearance, isDangerTight, Fw_kN, T_dead, T_live } = results;
  const L = Number(inputs.L);
  const f = Number(inputs.f);
  const wl = Number(inputs.wl);
  const slope = Number(inputs.slope);

  // FS recommendations
  if (FS < 2.0) {
    recs.push({ type: 'critical', icon: '🚨', title: 'Cable subdimensionado', text: `FS=${formatNumber(FS)} es extremadamente peligroso. Se necesita un cable con MBL mínimo de ${formatNumber(Tw * 3)} kN para FS=3.` });
  } else if (FS < 3.0) {
    const mblNeeded = Tw * 3;
    const match = CABLE_CATALOG.find(c => c.id !== 'custom' && c.mbl >= mblNeeded);
    recs.push({ type: 'warning', icon: '⚠️', title: 'Subir calibre de cable', text: `Para alcanzar FS≥3 necesitas MBL≥${formatNumber(mblNeeded)} kN.${match ? ` Recomendación: ${match.name} (${match.mbl} kN).` : ''}` });
  } else if (FS > 6.0) {
    recs.push({ type: 'info', icon: '💡', title: 'Cable sobredimensionado', text: `FS=${formatNumber(FS)} es mayor al necesario. Podrías usar un cable más liviano para reducir costos y peso muerto.` });
  }

  // Sag ratio
  const sagRatio = f / L;
  if (sagRatio < 0.03) {
    recs.push({ type: 'critical', icon: '🎸', title: 'Flecha insuficiente', text: `Relación f/L = ${(sagRatio * 100).toFixed(1)}%. Aumenta la flecha a mínimo ${formatNumber(L * 0.04)}m (4% del vano) para evitar sobretensión.` });
  } else if (sagRatio < 0.04) {
    recs.push({ type: 'warning', icon: '📏', title: 'Flecha ajustada', text: `f/L = ${(sagRatio * 100).toFixed(1)}%. Ideal entre 4-6%. Flecha recomendada: ${formatNumber(L * 0.05)}m.` });
  } else if (sagRatio > 0.08) {
    recs.push({ type: 'info', icon: '📐', title: 'Flecha excesiva', text: `f/L = ${(sagRatio * 100).toFixed(1)}% reduce el despeje vertical. Considera reducir a ${formatNumber(L * 0.06)}m.` });
  }

  // Clearance
  if (clearance < 0) {
    recs.push({ type: 'critical', icon: '🌍', title: 'Carga arrastra por suelo', text: `Despeje negativo (${formatNumber(clearance)}m). Aumenta h de torres o reduce la flecha.` });
  } else if (clearance < 3) {
    recs.push({ type: 'warning', icon: '🌲', title: 'Despeje mínimo', text: `Solo ${formatNumber(clearance)}m libres. En terreno irregular la carga puede golpear obstáculos. Se recomiendan mínimo 3m.` });
  }

  // Wind
  if (Fw_kN > 2.0) {
    recs.push({ type: 'critical', icon: '🌪️', title: 'Viento extremo', text: `Carga eólica de ${formatNumber(Fw_kN)} kN. Suspender operaciones hasta que el viento baje de 10 m/s.` });
  } else if (Fw_kN > 1.0) {
    recs.push({ type: 'warning', icon: '🌬️', title: 'Riesgo eólico', text: `Fuerza de viento ${formatNumber(Fw_kN)} kN puede causar oscilación lateral. Reducir carga un 20%.` });
  }

  // Slope
  if (slope > 60) {
    recs.push({ type: 'warning', icon: '⛰️', title: 'Pendiente pronunciada', text: `Pendiente del ${slope}%. Asegurar anclajes reforzados en la torre superior y utilizar frenos de descenso.` });
  }

  // Capacity vs load
  if (netCapacityKg > 0 && wl > netCapacityKg * 0.85) {
    recs.push({ type: 'warning', icon: '📦', title: 'Carga cercana al límite', text: `Estás usando ${formatNumber((wl / netCapacityKg) * 100)}% de la capacidad máxima. Mantén un margen mínimo del 15%.` });
  }

  // Dead load vs live load
  if (T_dead > T_live * 2) {
    recs.push({ type: 'info', icon: '⚖️', title: 'Peso propio dominante', text: `La tensión por peso del cable (${formatNumber(T_dead)} kN) supera ampliamente la carga útil. Considera un cable más liviano.` });
  }

  // All good
  if (recs.length === 0) {
    recs.push({ type: 'success', icon: '✅', title: 'Configuración óptima', text: 'Todos los parámetros están dentro de rangos seguros y eficientes.' });
  }

  return recs;
}

function CableLoggingPage() {
  const [selectedCableId, setSelectedCableId] = useState('compactado-25');
  const [savedCables, setSavedCables] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [customCableName, setCustomCableName] = useState('');
  const [customCableParams, setCustomCableParams] = useState({ mbl: '', weight: '', diameter: '', material: '' });

  const defaultCable = CABLE_CATALOG.find(c => c.id === 'compactado-25');

  const [inputs, setInputs] = useState({
    L: 300,
    f: 15,
    h: 20,
    mbl: defaultCable.mbl,
    cableWeight: defaultCable.weight,
    wl: 2500,
    v: 12,
    A: 3.5,
    slope: 15,
  });

  const [results, setResults] = useState(null);

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
    const h = Number(inputs.h);
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

    const clearance = h - f;

    setResults({
      Tw, FS, Fw_kN, netCapacityKg, clearance, T_dead, T_live,
      isDangerTight: f / L < 0.03,
    });
  };

  const selectedCable = allCables.find(c => c.id === selectedCableId);
  const recommendations = getRecommendations(inputs, results);

  const generateDiagram = () => {
    const vw = 800;
    const vh = 300;
    const padding = 60;
    const t1x = padding;
    const t2x = vw - padding;
    const spanWidth = t2x - t1x;
    const slopeValue = Number(inputs.slope) || 0;
    const groundY1 = vh - 40;
    const visualSlope = Math.min(Math.max(slopeValue, -40), 40);
    const groundY2 = groundY1 - (spanWidth * (visualSlope / 100));
    const towerHeightVis = 80;
    const topY1 = groundY1 - towerHeightVis;
    const topY2 = groundY2 - towerHeightVis;
    const L_val = Number(inputs.L) || 100;
    const f_val = Number(inputs.f) || 10;
    const sagRatio = Math.min(f_val / L_val, 0.4);
    const visualSag = spanWidth * sagRatio;
    const midX = (t1x + t2x) / 2;
    const midY = ((topY1 + topY2) / 2) + visualSag;

    return (
      <div className="diagram-container">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="cable-diagram">
          <rect x="0" y="0" width={vw} height={vh} fill="#f0f9ff" rx="12" />
          <polygon
            points={`0,${groundY1 + 20} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 20} ${vw},${vh} 0,${vh}`}
            fill="#dcfce7"
          />
          <polyline
            points={`0,${groundY1 + 20} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 20}`}
            fill="none" stroke="#22c55e" strokeWidth="4"
          />
          <line x1={t1x} y1={groundY1} x2={t1x} y2={topY1} stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          <line x1={t2x} y1={groundY2} x2={t2x} y2={topY2} stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          <line x1={t1x} y1={topY1} x2={t1x - 20} y2={groundY1} stroke="#94a3b8" strokeWidth="3" />
          <line x1={t2x} y1={topY2} x2={t2x + 20} y2={groundY2} stroke="#94a3b8" strokeWidth="3" />
          <polyline points={`${t1x},${topY1} ${midX},${midY} ${t2x},${topY2}`} fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx={midX} cy={midY} r="6" fill="#ef4444" />
          <line x1={midX} y1={midY} x2={midX} y2={midY + 30} stroke="#64748b" strokeWidth="2" />
          <rect x={midX - 25} y={midY + 30} width="50" height="14" fill="#854d0e" rx="4" />
          <text x={midX} y={midY - 15} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="bold">
            Flecha (f): {inputs.f}m
          </text>
          <text x={midX} y={groundY1 + ((groundY2 - groundY1) / 2) + 20} textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">
            Vano (L): {inputs.L}m
          </text>
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
                    <label>Altura de torres (h) [m]</label>
                    <input type="number" step="0.1" name="h" value={inputs.h} onChange={handleChange} required />
                  </div>
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
