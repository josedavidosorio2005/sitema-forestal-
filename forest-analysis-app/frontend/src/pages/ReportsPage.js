import React, { useEffect, useMemo, useState } from 'react';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import { reportsService, zonesService } from '../services/api';
import { formatDate, formatNumber, getErrorMessage, getForestDensityColor } from '../utils/helpers';
import './ReportsPage.css';

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
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
      if (reportsResponse.data.data.length > 0) {
        setSelectedReportIds([reportsResponse.data.data[0].id]);
      } else {
        setSelectedReportIds([]);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const zoneById = useMemo(() => {
    return zones.reduce((acc, zone) => ({ ...acc, [zone.id]: zone }), {});
  }, [zones]);

  const toggleReport = (reportId) => {
    setSelectedReportIds((prev) => {
      if (prev.includes(reportId)) {
        return prev.filter((id) => id !== reportId);
      }
      return [...prev, reportId];
    });
  };

  const selectedReports = reports.filter((r) => selectedReportIds.includes(r.id));

  return (
    <div className="reports-layout">
      <aside className="reports-sidebar">
        <div className="page-header">
          <div>
            <span className="eyebrow">📊 Análisis Ambiental</span>
            <h1>Reportes Ecológicos</h1>
            <p style={{ fontSize: '0.85rem' }}>Selecciona uno o varios reportes para visualizar o imprimir.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={loadReports} style={{ flex: 1 }}>
              Actualizar
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedReportIds(reports.map(r => r.id))}
              title="Seleccionar todos"
            >
              Todos
            </button>
          </div>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {loading && reports.length === 0 ? (
          <div className="state-box">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="state-box">No hay reportes. Guarda una zona desde el mapa para generar uno.</div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => {
              const isSelected = selectedReportIds.includes(report.id);
              return (
                <article
                  key={report.id}
                  className={isSelected ? 'report-card active' : 'report-card'}
                  onClick={() => toggleReport(report.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2>{report.zone_name || zoneById[report.zone_id]?.name || 'Zona'}</h2>
                      <span>{formatDate(report.analysis_date || report.created_at)}</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                  </div>
                  <div className="report-card-metrics">
                    <strong>{formatNumber(report.area_ha)} ha</strong>
                    <strong>{formatNumber(report.vegetation_coverage, 0)}%</strong>
                    <strong style={{ color: getForestDensityColor(report.forest_density) }}>
                      {report.forest_density}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </aside>

      <main className="reports-main">
        {selectedReports.length > 0 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }} className="print-hide">
              <h2 style={{ fontSize: '1.6rem', color: '#1a3d2c', margin: 0 }}>
                {selectedReports.length} {selectedReports.length === 1 ? 'Reporte Seleccionado' : 'Reportes Seleccionados'}
              </h2>
              <button className="btn btn-primary" onClick={() => window.print()}>
                🖨️ Imprimir Selección
              </button>
            </div>
            
            <div className="reports-print-container">
              {selectedReports.map((report, index) => (
                <div key={report.id} className="reports-main-content" style={{ marginBottom: '32px', pageBreakAfter: 'always' }}>
                  <div style={{ marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, color: '#1a3d2c' }}>Reporte de Zona Ecológica</h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Documento {index + 1} de {selectedReports.length}</p>
                  </div>
                  <ReportPanel report={report} zone={zoneById[report.zone_id]} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="state-box" style={{ height: '100%', minHeight: '400px' }}>
            <p>Selecciona uno o más reportes del panel izquierdo para ver sus detalles ambientales.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportsPage;
