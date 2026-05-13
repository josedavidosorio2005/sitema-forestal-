import React, { useEffect, useMemo, useState } from 'react';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import { reportsService, zonesService } from '../services/api';
import { formatDate, formatNumber, getErrorMessage, getForestDensityColor } from '../utils/helpers';
import './ReportsPage.css';

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      setLoading(true);
      const [reportsResponse, zonesResponse] = await Promise.all([
        reportsService.getAll(),
        zonesService.getAll(),
      ]);
      setReports(reportsResponse.data.data);
      setZones(zonesResponse.data.data);
      setSelectedReport(reportsResponse.data.data[0] || null);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const zoneById = useMemo(() => {
    return zones.reduce((acc, zone) => ({ ...acc, [zone.id]: zone }), {});
  }, [zones]);

  const selectedZone = selectedReport ? zoneById[selectedReport.zone_id] : null;

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">Analisis generados</span>
            <h1>Reportes</h1>
            <p>Resultados de cobertura vegetal simulada y especies probables por catalogo.</p>
          </div>
          <button className="btn btn-secondary" onClick={loadReports}>
            Actualizar
          </button>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {loading && reports.length === 0 ? (
          <div className="state-box">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="state-box">No hay reportes. Guarda una zona desde el mapa para generar uno.</div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <article
                key={report.id}
                className={selectedReport?.id === report.id ? 'report-card active' : 'report-card'}
                onClick={() => setSelectedReport(report)}
              >
                <div>
                  <h2>{report.zone_name || zoneById[report.zone_id]?.name || 'Zona'}</h2>
                  <span>{formatDate(report.analysis_date || report.created_at)}</span>
                </div>
                <div className="report-card-metrics">
                  <strong>{formatNumber(report.area_ha)} ha</strong>
                  <strong>{formatNumber(report.vegetation_coverage, 0)}%</strong>
                  <strong style={{ color: getForestDensityColor(report.forest_density) }}>
                    {report.forest_density}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Sidebar title="Reporte seleccionado">
        <ReportPanel report={selectedReport} zone={selectedZone} />
        {selectedReport && (
          <button className="btn btn-secondary btn-block" onClick={() => window.print()}>
            Imprimir reporte
          </button>
        )}
      </Sidebar>
    </div>
  );
}

export default ReportsPage;
