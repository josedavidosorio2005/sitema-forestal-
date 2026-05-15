import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { formatNumber } from '../utils/helpers';
import './CableLoggingPage.css';

function CableLoggingPage() {
  const [inputs, setInputs] = useState({
    L: 300,
    f: 15,
    h: 20,
    mbl: 450,
    cableWeight: 3.2,
    wl: 2500,
    v: 12,
    A: 3.5,
    slope: 15,
  });

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
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
    const slope = Number(inputs.slope);

    if (f <= 0 || L <= 0 || mbl <= 0) {
      alert('Valores invalidos. Revisa la flecha, longitud y carga de ruptura.');
      return;
    }

    const q = (cableWeight * g) / 1000;
    const T_dead = (q * Math.pow(L, 2)) / (8 * f);
    const P = (wl * g) / 1000;
    const T_live = (P * L) / (4 * f);
    
    // Tensión de Trabajo (Tw)
    const Tw = T_dead + T_live;

    // Factor de Seguridad
    const FS = mbl / Tw;

    // Carga de Viento
    const rho = 1.225;
    const Cd = 1.1;
    const Fw = 0.5 * rho * Math.pow(v, 2) * A * Cd;
    const Fw_kN = Fw / 1000;

    // Capacidad de Carga Neta (FS = 3.0)
    const T_max_allowed = mbl / 3.0;
    const T_net_live = T_max_allowed - T_dead;
    let netCapacityKg = 0;
    if (T_net_live > 0) {
      const P_max = (T_net_live * 4 * f) / L;
      netCapacityKg = (P_max * 1000) / g;
    }

    // Cálculo de Clearance asumiendo catenaria y pendiente constante
    // Para simplificar, asumimos que el punto de máxima flecha está en el centro.
    // Altura del cable en el centro = h - f. Si el terreno tiene pendiente, la distancia relativa puede variar, 
    // pero tomamos la referencia desde los apoyos hasta el suelo paralelo.
    const clearance = h - f;

    setResults({
      Tw,
      FS,
      Fw_kN,
      netCapacityKg,
      clearance,
      T_dead,
      T_live,
      isDangerTight: f / L < 0.03, // Flecha menor al 3% es muy riesgosa
    });
  };

  // Generación de coordenadas para el diagrama SVG
  const generateDiagram = () => {
    // Dimensiones fijas del viewBox
    const vw = 800;
    const vh = 300;
    const padding = 60;
    
    // Puntos fijos
    const t1x = padding;
    const t2x = vw - padding;
    const spanWidth = t2x - t1x;
    
    // Terreno y pendiente
    const slopeValue = Number(inputs.slope) || 0;
    const groundY1 = vh - 40;
    // Si la pendiente es muy pronunciada la limitamos visualmente
    const visualSlope = Math.min(Math.max(slopeValue, -40), 40); 
    const groundY2 = groundY1 - (spanWidth * (visualSlope / 100));

    // Alturas de las torres (relativas al suelo)
    const towerHeightVis = 80; // altura visual base
    const topY1 = groundY1 - towerHeightVis;
    const topY2 = groundY2 - towerHeightVis;

    // Flecha (Sagr)
    // Escalar la flecha visualmente para que se note pero no rompa el SVG
    const L_val = Number(inputs.L) || 100;
    const f_val = Number(inputs.f) || 10;
    const sagRatio = Math.min(f_val / L_val, 0.4); 
    const visualSag = spanWidth * sagRatio;
    
    const midX = (t1x + t2x) / 2;
    const midY = ((topY1 + topY2) / 2) + visualSag;

    return (
      <div className="diagram-container">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="cable-diagram">
          {/* Cielo/Fondo */}
          <rect x="0" y="0" width={vw} height={vh} fill="#f0f9ff" rx="12" />
          
          {/* Terreno */}
          <polygon 
            points={`0,${groundY1 + 20} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 20} ${vw},${vh} 0,${vh}`} 
            fill="#dcfce7" 
          />
          <polyline 
            points={`0,${groundY1 + 20} ${t1x},${groundY1} ${t2x},${groundY2} ${vw},${groundY2 - 20}`} 
            fill="none" stroke="#22c55e" strokeWidth="4" 
          />

          {/* Torres (Líneas gruesas) */}
          <line x1={t1x} y1={groundY1} x2={t1x} y2={topY1} stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          <line x1={t2x} y1={groundY2} x2={t2x} y2={topY2} stroke="#475569" strokeWidth="8" strokeLinecap="round" />

          {/* Soportes de las torres */}
          <line x1={t1x} y1={topY1} x2={t1x - 20} y2={groundY1} stroke="#94a3b8" strokeWidth="3" />
          <line x1={t2x} y1={topY2} x2={t2x + 20} y2={groundY2} stroke="#94a3b8" strokeWidth="3" />

          {/* Cable Principal (Forma de V por la carga) */}
          <polyline points={`${t1x},${topY1} ${midX},${midY} ${t2x},${topY2}`} fill="none" stroke="#1e293b" strokeWidth="3" />

          {/* Carro y Carga */}
          <circle cx={midX} cy={midY} r="6" fill="#ef4444" />
          <line x1={midX} y1={midY} x2={midX} y2={midY + 30} stroke="#64748b" strokeWidth="2" />
          <rect x={midX - 25} y={midY + 30} width="50" height="14" fill="#854d0e" rx="4" />
          
          {/* Textos Informativos */}
          <text x={midX} y={midY - 15} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="bold">
            Flecha (f): {inputs.f}m
          </text>
          <text x={midX} y={groundY1 + ((groundY2-groundY1)/2) + 20} textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">
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
            <span className="eyebrow">Simulador Físico</span>
            <h1>Ingeniería de Cable Vía</h1>
            <p>Calcula tensiones, factores de seguridad y capacidades de carga paramétricas para sistemas de extracción forestal suspendida.</p>
          </div>
        </div>

        {generateDiagram()}

        <div className="cable-calculator-grid mt-2">
          <form className="cable-form" onSubmit={calculate}>
            <div className="form-sections-wrapper">
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
                <h3><span className="icon">⚙️</span> Especificaciones Técnicas</h3>
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
            <p>Ingresa los parámetros y ejecuta la simulación para visualizar el comportamiento estructural.</p>
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
              <h3 className="sidebar-section-title">Alertas del Sistema</h3>
              <div className="alerts-container">
                {results.FS < 3.0 && (
                  <div className="alert alert-error">
                    <strong>⚠️ Peligro de Ruptura:</strong> Factor de seguridad muy bajo. Reduzca la carga útil o aumente la flecha inmediatamente.
                  </div>
                )}

                {results.isDangerTight && (
                  <div className="alert alert-error">
                    <strong>⚠️ Sobretensión por Geometría:</strong> La flecha es excesivamente pequeña (&lt;3% del vano). El cable actuará como una cuerda de guitarra, multiplicando la tensión exponencialmente ante cualquier perturbación.
                  </div>
                )}

                {results.clearance < 0 && (
                  <div className="alert alert-error">
                    <strong>⚠️ Impacto en Terreno:</strong> El clearance es negativo. La carga arrastrará por el suelo, anulando el propósito del cable vía. Aumente la altura de las torres o tense más el cable (reduzca la flecha).
                  </div>
                )}

                {results.Fw_kN > 1.0 && (
                  <div className="alert alert-warning">
                    <strong>🌬️ Riesgo Eólico:</strong> Viento fuerte detectado ({formatNumber(results.Fw_kN)} kN). Probabilidad de galope del cable.
                  </div>
                )}

                {results.FS >= 3.0 && !results.isDangerTight && results.clearance > 0 && results.Fw_kN <= 1.0 && (
                  <div className="alert alert-success">
                    <strong>✅ Operación Segura:</strong> Todos los parámetros estructurales se encuentran dentro de los márgenes teóricos permitidos.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default CableLoggingPage;
