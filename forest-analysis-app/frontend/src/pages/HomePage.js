import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import ZoneForm from '../components/ZoneForm';
import { reportsService, speciesService, zonesService } from '../services/api';
import { formatNumber, getErrorMessage } from '../utils/helpers';
import './HomePage.css';

function HomePage() {
  const [zones, setZones] = useState([]);
  const [species, setSpecies] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [report, setReport] = useState(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [zonesResponse, speciesResponse] = await Promise.all([
        zonesService.getAll(),
        speciesService.getAll(),
      ]);
      setZones(zonesResponse.data.data);
      setSpecies(speciesResponse.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  function handlePolygonDraw(payload) {
    setCurrentPolygon(payload);
    setSelectedZone(null);
    setReport(null);
    setShowZoneForm(true);
    setMessage(null);
  }

  function handlePolygonClear() {
    setCurrentPolygon(null);
    setShowZoneForm(false);
  }

  async function handleSaveZone(formData) {
    if (!currentPolygon) {
      setMessage({ type: 'error', text: 'Dibuja un poligono antes de guardar.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const zoneResponse = await zonesService.create({
        name: formData.name,
        description: formData.description,
        region: formData.region,
        geometry: currentPolygon.geometry,
      });
      const savedZone = zoneResponse.data.data;

      const reportResponse = await reportsService.create(savedZone.id, {
        region: formData.region,
        confirmed_species_ids: formData.confirmed_species_ids,
        observations: formData.description,
      });

      setZones((current) => [savedZone, ...current]);
      setSelectedZone(savedZone);
      setReport(reportResponse.data.data);
      setCurrentPolygon(null);
      setShowZoneForm(false);
      setMessage({ type: 'success', text: 'Zona guardada y reporte generado.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectZone(zone) {
    setSelectedZone(zone);
    setCurrentPolygon(null);
    setShowZoneForm(false);
    setMessage(null);

    try {
      const response = await zonesService.getReport(zone.id);
      setReport(response.data.data);
    } catch (error) {
      setReport(null);
    }
  }

  return (
    <div className="home-layout">
      <section className="map-column">
        <MapComponent
          currentPolygon={currentPolygon}
          onPolygonDraw={handlePolygonDraw}
          onPolygonClear={handlePolygonClear}
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={handleSelectZone}
          onClearSelection={() => {
            setSelectedZone(null);
            setReport(null);
          }}
        />
      </section>

      <Sidebar title="Herramientas">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {currentPolygon && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Poligono activo</h3>
            <div className="metric-grid">
              <div className="metric">
                <span>Metros cuadrados</span>
                <strong>{formatNumber(currentPolygon.area.areaM2)} m2</strong>
              </div>
              <div className="metric">
                <span>Hectareas</span>
                <strong>{formatNumber(currentPolygon.area.areaHa)} ha</strong>
              </div>
            </div>
            {!showZoneForm && (
              <button className="btn btn-primary btn-block mt-2" onClick={() => setShowZoneForm(true)}>
                Guardar zona
              </button>
            )}
          </section>
        )}

        {showZoneForm && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Datos de la zona</h3>
            <ZoneForm
              onSubmit={handleSaveZone}
              onCancel={() => setShowZoneForm(false)}
              loading={loading}
              speciesOptions={species}
              showConfirmedSpecies
            />
          </section>
        )}

        {!currentPolygon && !selectedZone && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Flujo MVP</h3>
            <p className="sidebar-copy">
              Navega el mapa, dibuja un poligono forestal y guarda la zona. El reporte separa
              especies probables de especies confirmadas manualmente por el cliente.
            </p>
          </section>
        )}

        <ReportPanel report={report} zone={selectedZone} />

        {zones.length > 0 && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Zonas guardadas</h3>
            <div className="compact-list">
              {zones.slice(0, 6).map((zone) => (
                <button
                  key={zone.id}
                  className={selectedZone?.id === zone.id ? 'compact-item active' : 'compact-item'}
                  onClick={() => handleSelectZone(zone)}
                >
                  <strong>{zone.name}</strong>
                  <span>{formatNumber(zone.area_ha)} ha</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </Sidebar>
    </div>
  );
}

export default HomePage;
