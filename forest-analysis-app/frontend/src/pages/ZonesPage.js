import React, { useEffect, useState } from 'react';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import SubzoneForm from '../components/SubzoneForm';
import SubzonesPanel from '../components/SubzonesPanel';
import ZoneForm from '../components/ZoneForm';
import { reportsService, speciesService, subzonesService, zonesService } from '../services/api';
import { formatDate, formatNumber, getErrorMessage } from '../utils/helpers';
import './ZonesPage.css';

function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [subzones, setSubzones] = useState([]);
  const [selectedSubzone, setSelectedSubzone] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [editingSubzone, setEditingSubzone] = useState(null);
  const [showSubzoneForm, setShowSubzoneForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

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
    setEditingSubzone(null);
    setShowSubzoneForm(false);
    setSelectedSubzone(null);
    setMessage(null);

    try {
      const response = await zonesService.getReport(zone.id);
      setSelectedReport(response.data.data);
    } catch {
      setSelectedReport(null);
    }

    try {
      const response = await subzonesService.getByZoneId(zone.id);
      setSubzones(response.data.data);
    } catch (error) {
      setSubzones([]);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  async function handleUpdateZone(formData) {
    if (!editingZone) return;

    try {
      setLoading(true);

      const updatedGeometry = {
        ...editingZone.geometry,
        properties: {
          ...editingZone.geometry?.properties,
          color: formData.color,
        },
      };

      const response = await zonesService.update(editingZone.id, {
        ...formData,
        geometry: updatedGeometry,
      });
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
    try {
      await zonesService.delete(zoneId);
      setZones((current) => current.filter((zone) => zone.id !== zoneId));
      if (selectedZone?.id === zoneId) {
        setSelectedZone(null);
        setSelectedReport(null);
        setSelectedSubzone(null);
        setSubzones([]);
      }
      setConfirmingDeleteId(null);
      setMessage({ type: 'success', text: 'Zona eliminada.' });
    } catch (error) {
      setConfirmingDeleteId(null);
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

  async function handleCreateSubzone(formData) {
    if (!selectedZone) return;

    try {
      setLoading(true);
      const response = await subzonesService.create(selectedZone.id, formData);
      const createdSubzone = response.data.data;
      setSubzones((current) => [createdSubzone, ...current]);
      setSelectedSubzone(createdSubzone);
      setShowSubzoneForm(false);
      setMessage({ type: 'success', text: 'Subzona creada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSubzone(formData) {
    if (!editingSubzone) return;

    try {
      setLoading(true);
      const response = await subzonesService.update(editingSubzone.id, formData);
      const updatedSubzone = response.data.data;
      setSubzones((current) =>
        current.map((subzone) => (subzone.id === updatedSubzone.id ? updatedSubzone : subzone))
      );
      setSelectedSubzone(updatedSubzone);
      setEditingSubzone(null);
      setShowSubzoneForm(false);
      setMessage({ type: 'success', text: 'Subzona actualizada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubzone(subzone) {
    const confirmed = window.confirm(`Eliminar la subzona "${subzone.name}"?`);
    if (!confirmed) return;

    try {
      await subzonesService.delete(subzone.id);
      setSubzones((current) => current.filter((item) => item.id !== subzone.id));
      if (selectedSubzone?.id === subzone.id) setSelectedSubzone(null);
      if (editingSubzone?.id === subzone.id) setEditingSubzone(null);
      setMessage({ type: 'success', text: 'Subzona eliminada.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  function openCreateSubzone() {
    if (!selectedZone) {
      setMessage({ type: 'error', text: 'Selecciona una zona antes de crear subzonas.' });
      return;
    }

    setEditingSubzone(null);
    setShowSubzoneForm(true);
  }

  async function openCreateSubzoneForZone(zone) {
    setSelectedZone(zone);
    setEditingZone(null);
    setEditingSubzone(null);
    setSelectedSubzone(null);
    setShowSubzoneForm(true);
    setMessage(null);

    try {
      const [reportResponse, subzonesResponse] = await Promise.allSettled([
        zonesService.getReport(zone.id),
        subzonesService.getByZoneId(zone.id),
      ]);

      setSelectedReport(
        reportResponse.status === 'fulfilled' ? reportResponse.value.data.data : null
      );
      setSubzones(
        subzonesResponse.status === 'fulfilled' ? subzonesResponse.value.data.data : []
      );
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">📍 Gestión Territorial</span>
            <h1>Zonas Forestales</h1>
            <p>Administra, edita y genera reportes de tus zonas georreferenciadas.</p>
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
                      setEditingSubzone(null);
                      setShowSubzoneForm(false);
                      setSelectedZone(zone);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      openCreateSubzoneForZone(zone);
                    }}
                  >
                    Subzona
                  </button>
                  <a
                    className="btn btn-small btn-secondary"
                    href={`#/?zone=${zone.id}`}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    Ver en mapa
                  </a>
                  {confirmingDeleteId === zone.id ? (
                    <>
                      <span style={{fontSize:'0.8rem',color:'#b91c1c',fontWeight:700}}>¿Eliminar?</span>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(zone.id);
                        }}
                      >
                        Sí, eliminar
                      </button>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConfirmingDeleteId(null);
                        }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-small btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmingDeleteId(zone.id);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Sidebar title={editingZone ? 'Editar zona' : showSubzoneForm ? 'Subzona' : 'Detalle'}>
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
        ) : showSubzoneForm ? (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">
              {editingSubzone ? 'Editar subzona' : 'Nueva subzona'}
            </h3>
            <p className="sidebar-copy">
              Esta subzona queda asociada a {selectedZone?.name}. Si necesitas poligono exacto, dibujala desde el mapa.
            </p>
            <SubzoneForm
              initialData={editingSubzone || {}}
              onSubmit={editingSubzone ? handleUpdateSubzone : handleCreateSubzone}
              onCancel={() => {
                setEditingSubzone(null);
                setShowSubzoneForm(false);
              }}
              loading={loading}
              speciesOptions={species}
              hasGeometry={Boolean(editingSubzone?.geometry)}
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
            {selectedZone && (
              <section className="sidebar-section">
                <div className="section-header-row">
                  <h3 className="sidebar-section-title">Subzonas</h3>
                  <button type="button" className="btn btn-small btn-primary" onClick={openCreateSubzone}>
                    Nueva
                  </button>
                </div>
                <SubzonesPanel
                  subzones={subzones}
                  selectedSubzone={selectedSubzone}
                  onSelect={setSelectedSubzone}
                  onEdit={(subzone) => {
                    setEditingSubzone(subzone);
                    setShowSubzoneForm(true);
                  }}
                  onDelete={handleDeleteSubzone}
                />
              </section>
            )}
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default ZonesPage;
