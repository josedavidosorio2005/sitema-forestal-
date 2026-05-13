import React, { useEffect, useState } from 'react';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import ZoneForm from '../components/ZoneForm';
import { reportsService, speciesService, zonesService } from '../services/api';
import { formatDate, formatNumber, getErrorMessage } from '../utils/helpers';
import './ZonesPage.css';

function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [zonesResponse, speciesResponse] = await Promise.all([
        zonesService.getAll(),
        speciesService.getAll(),
      ]);
      setZones(zonesResponse.data.data);
      setSpecies(speciesResponse.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function selectZone(zone) {
    setSelectedZone(zone);
    setEditingZone(null);
    setMessage(null);

    try {
      const response = await zonesService.getReport(zone.id);
      setSelectedReport(response.data.data);
    } catch {
      setSelectedReport(null);
    }
  }

  async function handleUpdateZone(formData) {
    if (!editingZone) return;

    try {
      setLoading(true);
      const response = await zonesService.update(editingZone.id, formData);
      const updatedZone = response.data.data;
      setZones((current) => current.map((zone) => (zone.id === updatedZone.id ? updatedZone : zone)));
      setSelectedZone(updatedZone);
      setEditingZone(null);
      setMessage({ type: 'success', text: 'Zona actualizada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(zoneId) {
    const confirmed = window.confirm('Eliminar esta zona y sus reportes?');
    if (!confirmed) return;

    try {
      await zonesService.delete(zoneId);
      setZones((current) => current.filter((zone) => zone.id !== zoneId));
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
        setSelectedReport(null);
      }
      setMessage({ type: 'success', text: 'Zona eliminada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  async function generateReport(zone) {
    try {
      setLoading(true);
      const response = await reportsService.create(zone.id, {
        region: zone.region,
        observations: zone.description,
      });
      setSelectedReport(response.data.data);
      setMessage({ type: 'success', text: 'Reporte generado.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">Zonas dibujadas</span>
            <h1>Zonas guardadas</h1>
            <p>Consulta detalles, edita metadatos, elimina zonas o genera reportes.</p>
          </div>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {loading && zones.length === 0 ? (
          <div className="state-box">Cargando zonas...</div>
        ) : zones.length === 0 ? (
          <div className="state-box">No hay zonas guardadas. Crea una desde el mapa.</div>
        ) : (
          <div className="zones-grid">
            {zones.map((zone) => (
              <article
                key={zone.id}
                className={selectedZone?.id === zone.id ? 'zone-card active' : 'zone-card'}
                onClick={() => selectZone(zone)}
              >
                <div className="zone-card-header">
                  <h2>{zone.name}</h2>
                  <span>{formatDate(zone.created_at)}</span>
                </div>
                <p>{zone.description || 'Sin descripcion'}</p>
                <div className="zone-card-metrics">
                  <strong>{formatNumber(zone.area_m2)} m2</strong>
                  <strong>{formatNumber(zone.area_ha)} ha</strong>
                </div>
                <div className="row-actions">
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingZone(zone);
                      setSelectedZone(zone);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(zone.id);
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Sidebar title={editingZone ? 'Editar zona' : 'Detalle'}>
        {editingZone ? (
          <section className="sidebar-section">
            <ZoneForm
              initialData={editingZone}
              onSubmit={handleUpdateZone}
              onCancel={() => setEditingZone(null)}
              loading={loading}
              speciesOptions={species}
            />
          </section>
        ) : (
          <>
            {selectedZone && !selectedReport && (
              <section className="sidebar-section">
                <h3 className="sidebar-section-title">Sin reporte</h3>
                <p className="sidebar-copy">Esta zona no tiene reporte creado todavia.</p>
                <button className="btn btn-primary btn-block mt-2" onClick={() => generateReport(selectedZone)}>
                  Generar reporte
                </button>
              </section>
            )}
            <ReportPanel report={selectedReport} zone={selectedZone} />
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default ZonesPage;
