import React, { useMemo, useState } from 'react';
import { calculateLogDragTension, getSoilOption, SOIL_OPTIONS } from '../utils/logDragTension';
import { formatNumber } from '../utils/helpers';
import './ExtractionCalculatorPage.css';

const initialForm = {
  peso_tronco: 1200,
  angulo_pendiente: 18,
  tipo_suelo: 'tierra_seca',
  distancia_arrastre: 35,
  factor_seguridad: 5,
};

function formatKn(value) {
  return formatNumber(value, 2);
}

function getSafetyProfile(factor) {
  const value = Number(factor || 0);
  if (value >= 5) {
    return {
      label: 'Operacion dentro del minimo 5:1',
      tone: 'success',
      explanation: 'La cuerda recomendada resiste al menos cinco veces la tension estatica calculada.',
    };
  }
  if (value >= 3) {
    return {
      label: 'Margen limitado',
      tone: 'warning',
      explanation: 'Puede funcionar solo con control estricto; para campo forestal se recomienda subir a 5:1.',
    };
  }
  return {
    label: 'Margen insuficiente',
    tone: 'danger',
    explanation: 'El factor es bajo para arrastre. Aumenta resistencia de cuerda, reduce carga o cambia el metodo.',
  };
}

function buildChartRows(result) {
  if (!result) return [];
  const staticKn = result.json.tension_estatica_kN;
  const safeKn = result.json.tension_con_seguridad_kN;
  const max = Math.max(safeKn, staticKn, 1);

  return [
    {
      label: 'Tension para iniciar movimiento',
      value: staticKn,
      width: Math.max(8, (staticKn / max) * 100),
      tone: 'base',
    },
    {
      label: 'Resistencia minima con seguridad',
      value: safeKn,
      width: Math.max(8, (safeKn / max) * 100),
      tone: 'safe',
    },
  ];
}

function ExtractionCalculatorPage() {
  const [form, setForm] = useState(initialForm);

  const selectedSoil = getSoilOption(form.tipo_suelo);
  const result = useMemo(() => {
    return calculateLogDragTension(form);
  }, [form]);
  const safetyProfile = getSafetyProfile(form.factor_seguridad);
  const chartRows = buildChartRows(result);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="extraction-page">
      <div className="page-header extraction-header">
        <div>
          <span className="eyebrow">Operaciones forestales</span>
          <h1>Motor de extraccion de troncos</h1>
          <p>
            Calcula tension, resistencia minima, riesgos y material de cuerda para arrastre
            forestal con resultados listos para operacion de campo.
          </p>
        </div>
      </div>

      <div className="extraction-grid">
        <section className="calculator-panel">
          <div className="field-grid">
            <label className="field">
              <span>Peso del tronco (kg)</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.peso_tronco}
                onChange={(event) => updateField('peso_tronco', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Pendiente (grados)</span>
              <input
                type="number"
                min="0"
                max="90"
                step="0.1"
                value={form.angulo_pendiente}
                onChange={(event) => updateField('angulo_pendiente', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Tipo de suelo</span>
              <select
                value={form.tipo_suelo}
                onChange={(event) => updateField('tipo_suelo', event.target.value)}
              >
                {SOIL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - friccion {option.frictionCoefficient}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Distancia de arrastre (m)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.distancia_arrastre}
                onChange={(event) => updateField('distancia_arrastre', event.target.value)}
              />
            </label>

            <label className="field">
              <span>Factor de seguridad</span>
              <input
                type="number"
                min="1"
                max="20"
                step="0.1"
                value={form.factor_seguridad}
                onChange={(event) => updateField('factor_seguridad', event.target.value)}
              />
            </label>
          </div>

          <div className="formula-box">
            <strong>Formula usada</strong>
            <span>T = m*g*(sin(theta)+mu*cos(theta)); cuerda minima = T*FS</span>
          </div>
        </section>

        <section className="result-panel">
          {result ? (
            <>
              <div className="result-hero">
                <span>Resistencia minima de cuerda</span>
                <strong>{formatKn(result.json.tension_con_seguridad_kN)} kN</strong>
              </div>

              <div className={`safety-graph safety-graph-${safetyProfile.tone}`}>
                <div className="safety-graph-header">
                  <div>
                    <span>Grado de seguridad</span>
                    <strong>Factor {formatNumber(result.technical.factor_seguridad, 1)}:1</strong>
                  </div>
                  <em>{safetyProfile.label}</em>
                </div>
                <div className="safety-meter" aria-label="Indicador de factor de seguridad">
                  <span style={{ width: `${Math.min(100, Math.max(8, (Number(form.factor_seguridad) / 5) * 100))}%` }} />
                </div>
                <p>{safetyProfile.explanation}</p>
              </div>

              <div className="tension-chart">
                <div className="chart-title">
                  <strong>Grafica de tension</strong>
                  <span>Compara la carga real contra la cuerda minima recomendada.</span>
                </div>
                {chartRows.map((row) => (
                  <div className="chart-row" key={row.label}>
                    <div className="chart-row-label">
                      <span>{row.label}</span>
                      <strong>{formatKn(row.value)} kN</strong>
                    </div>
                    <div className="chart-track">
                      <span className={`chart-fill chart-fill-${row.tone}`} style={{ width: `${row.width}%` }} />
                    </div>
                  </div>
                ))}
                <div className="component-grid">
                  <div>
                    <span>Pendiente</span>
                    <strong>{formatNumber(result.technical.slopeComponentN, 0)} N</strong>
                  </div>
                  <div>
                    <span>Friccion</span>
                    <strong>{formatNumber(result.technical.frictionForceN, 0)} N</strong>
                  </div>
                  <div>
                    <span>Reserva aplicada</span>
                    <strong>{formatNumber(result.technical.factor_seguridad, 1)}x</strong>
                  </div>
                </div>
              </div>

              <div className="result-metrics">
                <div className="result-metric">
                  <span>Tension estatica</span>
                  <strong>{formatKn(result.json.tension_estatica_kN)} kN</strong>
                </div>
                <div className="result-metric">
                  <span>MBS recomendado</span>
                  <strong>{formatNumber(result.json.mbs_recomendado_kg, 0)} kg</strong>
                </div>
                <div className="result-metric">
                  <span>Fuerza de friccion</span>
                  <strong>{formatNumber(result.technical.frictionForceN, 0)} N</strong>
                </div>
                <div className="result-metric">
                  <span>Coeficiente aplicado</span>
                  <strong>{selectedSoil.frictionCoefficient}</strong>
                </div>
              </div>

              <div className="recommendation-box">
                <strong>Material sugerido</strong>
                <span>{result.json.material_sugerido}</span>
              </div>

              <div className="risk-panel">
                <strong>Alertas operativas</strong>
                <ul>
                  {result.json.alertas.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="state-box">Ingresa valores validos para calcular la extraccion.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ExtractionCalculatorPage;
