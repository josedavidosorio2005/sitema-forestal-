import React from 'react';
import {
  formatDate,
  formatNumber,
  getForestDensityColor,
  getSpeciesTypeClass,
  getSpeciesTypeLabel,
} from '../utils/helpers';
import './ReportPanel.css';

function SpeciesList({ title, items = [], emptyText, showProbability = false }) {
  return (
    <section className="report-block">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <div className="report-species-list">
          {items.map((species, index) => (
            <article key={`${species.id || species.common_name}-${index}`} className="report-species">
              <div>
                <strong>{species.common_name}</strong>
                {species.scientific_name && <em>{species.scientific_name}</em>}
                {species.type && (
                  <span className={getSpeciesTypeClass(species.type)}>
                    {getSpeciesTypeLabel(species.type)}
                  </span>
                )}
              </div>
              {showProbability && (
                <span className="probability">{Math.round(species.probability * 100)}%</span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportPanel({ report, zone }) {
  if (!zone && !report) {
    return (
      <div className="report-panel empty-panel">
        <h2>Reporte</h2>
        <p>Guarda o selecciona una zona para ver el analisis.</p>
      </div>
    );
  }

  if (zone && !report) {
    return (
      <div className="report-panel empty-panel">
        <h2>{zone.name}</h2>
        <p>Esta zona todavia no tiene reporte generado.</p>
      </div>
    );
  }

  return (
    <div className="report-panel">
      <div className="report-heading">
        <div>
          <span className="eyebrow">Reporte forestal</span>
          <h2>{zone?.name || report.zone_name || 'Zona analizada'}</h2>
          <p>{formatDate(report.analysis_date || report.created_at)}</p>
        </div>
        <span
          className="density-pill"
          style={{ backgroundColor: getForestDensityColor(report.forest_density) }}
        >
          {report.forest_density}
        </span>
      </div>

      <div className="report-metrics">
        <div>
          <span>Area total</span>
          <strong>{formatNumber(report.area_m2 || zone?.area_m2)} m2</strong>
        </div>
        <div>
          <span>Hectareas</span>
          <strong>{formatNumber(report.area_ha || zone?.area_ha)} ha</strong>
        </div>
        <div>
          <span>Cobertura vegetal</span>
          <strong>{formatNumber(report.vegetation_coverage, 0)}%</strong>
        </div>
      </div>

      <section className="report-block">
        <h3>Cobertura vegetal simulada</h3>
        <div className="coverage-bar" aria-label="Cobertura vegetal estimada">
          <span
            style={{
              width: `${Math.min(100, Number(report.vegetation_coverage || 0))}%`,
              backgroundColor: getForestDensityColor(report.forest_density),
            }}
          />
        </div>
        <p className="muted">
          Resultado inicial basado en simulacion. La arquitectura deja listo el reemplazo por
          Sentinel-2/Copernicus y calculo NDVI real.
        </p>
      </section>

      <SpeciesList
        title="Especies probables"
        items={report.probable_species}
        emptyText="No hay especies probables. Agrega especies al catalogo del cliente."
        showProbability
      />

      <SpeciesList
        title="Especies confirmadas manualmente"
        items={report.confirmed_species}
        emptyText="Sin confirmaciones manuales."
      />

      {report.observations && (
        <section className="report-block">
          <h3>Observaciones</h3>
          <p>{report.observations}</p>
        </section>
      )}
    </div>
  );
}

export default ReportPanel;
