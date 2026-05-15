import React, { useEffect, useState } from 'react';
import MapComponent from '../components/MapComponent';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import SubzoneForm from '../components/SubzoneForm';
import SubzonesPanel from '../components/SubzonesPanel';
import ZoneForm from '../components/ZoneForm';
import { reportsService, speciesService, subzonesService, zonesService } from '../services/api';
import { formatNumber, getErrorMessage, polygonIsInsidePolygon } from '../utils/helpers';
import './HomePage.css';

function HomePage() {
  const [zones, setZones] = useState([]);
  const [species, setSpecies] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedSubzone, setSelectedSubzone] = useState(null);
  const [subzones, setSubzones] = useState([]);
  const [report, setReport] = useState(null);
  const [drawMode, setDrawMode] = useState('zone');
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showSubzoneForm, setShowSubzoneForm] = useState(false);
  const [drawRequestId, setDrawRequestId] = useState(0);
  const [clearRequestId, setClearRequestId] = useState(0);
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
      const loadedZones = zonesResponse.data.data;
      setZones(loadedZones);
      setSpecies(speciesResponse.data.data);

      const searchParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const zoneId = searchParams.get('zone');
      if (zoneId) {
        const targetZone = loadedZones.find(z => z.id === Number(zoneId));
        if (targetZone) {
          handleSelectZone(targetZone);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  function handlePolygonDraw(payload) {
    setCurrentPolygon(payload);
    setMessage(null);

    if (drawMode === 'subzone' && selectedZone) {
      if (!polygonIsInsidePolygon(payload.geometry, selectedZone.geometry)) {
        setCurrentPolygon(null);
        setShowSubzoneForm(false);
        setClearRequestId((current) => current + 1);
        setMessage({
          type: 'error',
          text: 'La subzona debe quedar completamente dentro de la zona seleccionada.',
        });
        return;
      }

      setShowSubzoneForm(true);
      setShowZoneForm(false);
      return;
    }

    setSelectedZone(null);
    setSelectedSubzone(null);
    setSubzones([]);
    setReport(null);
    setShowZoneForm(true);
    setShowSubzoneForm(false);
    setDrawMode('zone');
  }

  function handlePolygonClear() {
    setCurrentPolygon(null);
    setShowZoneForm(false);
    setShowSubzoneForm(false);
    setClearRequestId((current) => current + 1);
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
      setClearRequestId((current) => current + 1);
      setShowZoneForm(false);
      setShowSubzoneForm(false);
      setSubzones([]);
      setSelectedSubzone(null);
      setDrawMode('zone');
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
    setClearRequestId((current) => current + 1);
    setShowZoneForm(false);
    setShowSubzoneForm(false);
    setSelectedSubzone(null);
    setDrawMode('zone');
    setMessage(null);

    try {
      const response = await zonesService.getReport(zone.id);
      setReport(response.data.data);
    } catch (error) {
      setReport(null);
    }

    try {
      const response = await subzonesService.getByZoneId(zone.id);
      setSubzones(response.data.data);
    } catch (error) {
      setSubzones([]);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  function startSubzoneDrawing() {
    if (!selectedZone) return;

    setDrawMode('subzone');
    setCurrentPolygon(null);
    setShowZoneForm(false);
    setShowSubzoneForm(false);
    setMessage({
      type: 'success',
      text: `Modo dibujo activo: marca puntos dentro de ${selectedZone.name} y pulsa Finalizar subzona.`,
    });
    setDrawRequestId((current) => current + 1);
  }

  function startSubzoneForm() {
    if (!selectedZone) return;

    setDrawMode('zone');
    setCurrentPolygon(null);
    setClearRequestId((current) => current + 1);
    setShowZoneForm(false);
    setShowSubzoneForm(true);
    setMessage(null);
  }

  async function handleSaveSubzone(formData) {
    if (!selectedZone) {
      setMessage({ type: 'error', text: 'Selecciona una zona antes de guardar la subzona.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      if (currentPolygon && !polygonIsInsidePolygon(currentPolygon.geometry, selectedZone.geometry)) {
        setMessage({
          type: 'error',
          text: 'La subzona debe quedar completamente dentro de la zona seleccionada.',
        });
        setLoading(false);
        return;
      }

      const response = await subzonesService.create(selectedZone.id, {
        ...formData,
        ...(currentPolygon ? { geometry: currentPolygon.geometry } : {}),
      });
      const savedSubzone = response.data.data;

      setSubzones((current) => [savedSubzone, ...current]);
      setSelectedSubzone(savedSubzone);
      setCurrentPolygon(null);
      setClearRequestId((current) => current + 1);
      setShowSubzoneForm(false);
      setDrawMode('zone');
      setMessage({ type: 'success', text: 'Subzona guardada dentro de la zona.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
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
          subzones={subzones}
          selectedSubzone={selectedSubzone}
          drawMode={drawMode}
          drawRequestId={drawRequestId}
          clearRequestId={clearRequestId}
          onSelectZone={handleSelectZone}
          onSelectSubzone={setSelectedSubzone}
          onClearSelection={() => {
            setSelectedZone(null);
            setSelectedSubzone(null);
            setSubzones([]);
            setReport(null);
            setCurrentPolygon(null);
            setClearRequestId((current) => current + 1);
            setShowZoneForm(false);
            setShowSubzoneForm(false);
            setDrawMode('zone');
          }}
        />
      </section>

      <Sidebar title="Herramientas">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {currentPolygon && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">
              {drawMode === 'subzone' ? 'Poligono de subzona' : 'Poligono activo'}
            </h3>
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
            {drawMode === 'zone' && !showZoneForm && (
              <button className="btn btn-primary btn-block mt-2" onClick={() => setShowZoneForm(true)}>
                Guardar zona
              </button>
            )}
            {drawMode === 'subzone' && !showSubzoneForm && (
              <button className="btn btn-primary btn-block mt-2" onClick={() => setShowSubzoneForm(true)}>
                Guardar subzona
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

        {showSubzoneForm && selectedZone && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Datos de subzona</h3>
            <SubzoneForm
              onSubmit={handleSaveSubzone}
              onCancel={() => {
                setShowSubzoneForm(false);
                setDrawMode('zone');
                setClearRequestId((current) => current + 1);
              }}
              loading={loading}
              speciesOptions={species}
              hasGeometry={Boolean(currentPolygon)}
            />
          </section>
        )}

        {!currentPolygon && !selectedZone && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Flujo MVP</h3>
            <p className="sidebar-copy">
              Navega el mapa, dibuja una zona forestal y luego selecciona esa zona para dividirla
              en subzonas de plantacion, recoleccion o conservacion.
            </p>
          </section>
        )}

        <ReportPanel report={report} zone={selectedZone} />

        {selectedZone && !showSubzoneForm && (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Subzonas operativas</h3>
            <p className="sidebar-copy">
              Divide la zona en sectores internos para indicar pendiente, suelo, arbol y cantidad.
            </p>
            <div className="stack-actions mt-2">
              <button className="btn btn-primary btn-block" onClick={startSubzoneDrawing}>
                Dibujar parte de zona
              </button>
              <button className="btn btn-secondary btn-block" onClick={startSubzoneForm}>
                Nueva sin poligono
              </button>
            </div>
            <div className="mt-2">
              <SubzonesPanel
                subzones={subzones}
                selectedSubzone={selectedSubzone}
                onSelect={setSelectedSubzone}
              />
            </div>
          </section>
        )}

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
