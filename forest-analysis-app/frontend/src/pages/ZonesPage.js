import React, { useEffect, useState } from 'react';
import ReportPanel from '../components/ReportPanel';
import Sidebar from '../components/Sidebar';
import SubzoneForm from '../components/SubzoneForm';
import SubzonesPanel from '../components/SubzonesPanel';
import ZoneForm from '../components/ZoneForm';
import {
  reportsService,
  speciesService,
  subzonesService,
  zoneEventsService,
  zonesService,
} from '../services/api';
import { formatDate, formatNumber, getErrorMessage } from '../utils/helpers';
import './ZonesPage.css';

const EVENT_TYPES = [
  { value: 'preparacion', label: 'Preparacion' },
  { value: 'siembra', label: 'Siembra' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'cosecha', label: 'Cosecha' },
  { value: 'arrastre', label: 'Arrastre' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'inspeccion', label: 'Inspeccion' },
  { value: 'incidente', label: 'Incidente' },
  { value: 'otro', label: 'Otro' },
];

function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [subzones, setSubzones] = useState([]);
  const [zoneEvents, setZoneEvents] = useState([]);
  const [eventForm, setEventForm] = useState({
    event_type: 'inspeccion',
    title: '',
    description: '',
    actor: '',
  });
  const [selectedSubzone, setSelectedSubzone] = useState(null);
  const [editingZone, setEditingZone] = useState(null);
  const [editingSubzone, setEditingSubzone] = useState(null);
  const [showSubzoneForm, setShowSubzoneForm] = useState(false);
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
    setEditingSubzone(null);
    setShowSubzoneForm(false);
    setSelectedSubzone(null);
    setZoneEvents([]);
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

    try {
      const response = await zoneEventsService.getByZoneId(zone.id);
      setZoneEvents(response.data.data);
    } catch {
      setZoneEvents([]);
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
        setSelectedSubzone(null);
        setSubzones([]);
        setZoneEvents([]);
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

  async function handleCreateEvent(event) {
    event.preventDefault();
    if (!selectedZone) return;

    const title = eventForm.title.trim();
    if (!title) {
      setMessage({ type: 'error', text: 'Escribe un titulo para el evento de trazabilidad.' });
      return;
    }

    try {
      setLoading(true);
      const response = await zoneEventsService.create(selectedZone.id, {
        ...eventForm,
        title,
        description: eventForm.description.trim(),
        actor: eventForm.actor.trim(),
        event_date: new Date().toISOString(),
      });
      setZoneEvents((current) => [response.data.data, ...current]);
      setEventForm({
        event_type: 'inspeccion',
        title: '',
        description: '',
        actor: '',
      });
      setMessage({ type: 'success', text: 'Evento agregado al historial de la zona.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!selectedZone) return;

    try {
      await zoneEventsService.delete(selectedZone.id, eventId);
      setZoneEvents((current) => current.filter((item) => item.id !== eventId));
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
    setZoneEvents([]);
    setShowSubzoneForm(true);
    setMessage(null);

    try {
      const [reportResponse, subzonesResponse, eventsResponse] = await Promise.allSettled([
        zonesService.getReport(zone.id),
        subzonesService.getByZoneId(zone.id),
        zoneEventsService.getByZoneId(zone.id),
      ]);

      setSelectedReport(
        reportResponse.status === 'fulfilled' ? reportResponse.value.data.data : null
      );
      setSubzones(
        subzonesResponse.status === 'fulfilled' ? subzonesResponse.value.data.data : []
      );
      setZoneEvents(
        eventsResponse.status === 'fulfilled' ? eventsResponse.value.data.data : []
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
                  <h2>
                    <span className="zone-color-dot" style={{ backgroundColor: zone.color || '#116b3b' }} />
                    {zone.name}
                  </h2>
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
            {selectedZone && (
              <section className="sidebar-section">
                <h3 className="sidebar-section-title">Historial y trazabilidad</h3>
                <form className="trace-form" onSubmit={handleCreateEvent}>
                  <div className="trace-form-row">
                    <select
                      value={eventForm.event_type}
                      onChange={(event) =>
                        setEventForm((current) => ({ ...current, event_type: event.target.value }))
                      }
                      disabled={loading}
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={eventForm.actor}
                      placeholder="Responsable"
                      onChange={(event) =>
                        setEventForm((current) => ({ ...current, actor: event.target.value }))
                      }
                      disabled={loading}
                    />
                  </div>
                  <input
                    value={eventForm.title}
                    placeholder="Que paso con los arboles o el terreno"
                    onChange={(event) =>
                      setEventForm((current) => ({ ...current, title: event.target.value }))
                    }
                    disabled={loading}
                  />
                  <textarea
                    value={eventForm.description}
                    placeholder="Detalle operativo, movimiento, cosecha, arrastre, transporte, incidente..."
                    onChange={(event) =>
                      setEventForm((current) => ({ ...current, description: event.target.value }))
                    }
                    disabled={loading}
                    rows="3"
                  />
                  <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                    Agregar evento
                  </button>
                </form>
                <div className="trace-list">
                  {zoneEvents.length === 0 ? (
                    <p className="sidebar-copy">Sin eventos registrados para esta zona.</p>
                  ) : (
                    zoneEvents.map((item) => (
                      <article key={item.id} className="trace-item">
                        <div>
                          <span>{item.event_type}</span>
                          <strong>{item.title}</strong>
                          <small>{formatDate(item.event_date || item.created_at)}{item.actor ? ` / ${item.actor}` : ''}</small>
                        </div>
                        {item.description && <p>{item.description}</p>}
                        <button
                          type="button"
                          className="btn btn-small btn-secondary"
                          onClick={() => handleDeleteEvent(item.id)}
                        >
                          Quitar
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default ZonesPage;
