import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import SpeciesForm from '../components/SpeciesForm';
import { speciesService } from '../services/api';
import {
  formatDate,
  getErrorMessage,
  getSpeciesTypeClass,
  getSpeciesTypeLabel,
} from '../utils/helpers';
import './SpeciesPage.css';

const BASE_TYPES = ['nativa', 'introducida', 'invasora', 'ornamental', 'comercial'];

function SpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [selectedType, setSelectedType] = useState('todas');
  const [editingSpecies, setEditingSpecies] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [allSpeciesForTypes, setAllSpeciesForTypes] = useState([]);

  const activeType = selectedType === 'todas' ? null : selectedType;

  const loadSpecies = useCallback(async (type = activeType) => {
    try {
      setLoading(true);
      const [filteredResponse, allResponse] = await Promise.all([
        speciesService.getAll(type),
        type ? speciesService.getAll(null) : Promise.resolve(null),
      ]);
      setSpecies(filteredResponse.data.data);
      setAllSpeciesForTypes(allResponse ? allResponse.data.data : filteredResponse.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    loadSpecies(activeType);
  }, [activeType, loadSpecies]);

  async function handleSubmit(formData) {
    try {
      setLoading(true);
      if (editingSpecies) {
        await speciesService.update(editingSpecies.id, formData);
        setMessage({ type: 'success', text: 'Especie actualizada.' });
      } else {
        await speciesService.create(formData);
        setMessage({ type: 'success', text: 'Especie agregada al catalogo.' });
      }
      setShowForm(false);
      setEditingSpecies(null);
      await loadSpecies();
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(speciesId) {
    try {
      await speciesService.delete(speciesId);
      setConfirmingDeleteId(null);
      setMessage({ type: 'success', text: 'Especie eliminada.' });
      await loadSpecies();
    } catch (error) {
      setConfirmingDeleteId(null);
      setMessage({ type: 'error', text: getErrorMessage(error) });
    }
  }

  const stats = useMemo(() => {
    return species.reduce(
      (acc, item) => ({
        ...acc,
        [item.type]: (acc[item.type] || 0) + 1,
      }),
      {}
    );
  }, [species]);

  const allTypes = useMemo(() => {
    const typesFromData = allSpeciesForTypes.map(s => s.type).filter(Boolean);
    const merged = [...new Set([...BASE_TYPES, ...typesFromData])];
    return merged;
  }, [allSpeciesForTypes]);

  const FILTERS = useMemo(() => ['todas', ...allTypes], [allTypes]);

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">🌿 Catálogo Botánico</span>
            <h1>Especies Arbóreas</h1>
            <p>
              Gestiona el inventario de especies por categoría y región para análisis y reportes forestales.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingSpecies(null);
              setShowForm(true);
            }}
          >
            Nueva especie
          </button>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="filter-row">
          {FILTERS.map((type) => (
            <button
              key={type}
              className={selectedType === type ? 'filter active' : 'filter'}
              onClick={() => setSelectedType(type)}
            >
              {type === 'todas' ? 'Todas' : getSpeciesTypeLabel(type)}
              {type !== 'todas' && stats[type] ? ` (${stats[type]})` : ''}
            </button>
          ))}
        </div>

        <div className="summary-row">
          <div>
            <span>Total visible</span>
            <strong>{species.length}</strong>
          </div>
          <div>
            <span>Nativas</span>
            <strong>{stats.nativa || 0}</strong>
          </div>
          <div>
            <span>Comerciales</span>
            <strong>{stats.comercial || 0}</strong>
          </div>
        </div>

        {loading ? (
          <div className="state-box">Cargando especies...</div>
        ) : species.length === 0 ? (
          <div className="state-box">
            No hay especies para este filtro. Agrega una desde el panel lateral.
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Nombre comun</th>
                  <th>Nombre cientifico</th>
                  <th>Tipo</th>
                  <th>Region</th>
                  <th>Creada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {species.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.common_name}</strong>
                    </td>
                    <td>
                      <em>{item.scientific_name}</em>
                    </td>
                    <td>
                      <span className={getSpeciesTypeClass(item.type)}>
                        {getSpeciesTypeLabel(item.type)}
                      </span>
                    </td>
                    <td>{item.region || 'Sin region'}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => {
                            setEditingSpecies(item);
                            setShowForm(true);
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn btn-small btn-danger" onClick={() => setConfirmingDeleteId(item.id)}>
                          Eliminar
                        </button>
                        {confirmingDeleteId === item.id && (
                          <div style={{display:'flex',gap:'6px',alignItems:'center',marginTop:'4px'}}>
                            <span style={{fontSize:'0.75rem',color:'#b91c1c',fontWeight:700}}>¿Seguro?</span>
                            <button className="btn btn-small btn-danger" onClick={() => handleDelete(item.id)}>
                              Sí
                            </button>
                            <button className="btn btn-small btn-secondary" onClick={() => setConfirmingDeleteId(null)}>
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Sidebar title={editingSpecies ? 'Editar especie' : 'Nueva especie'}>
        {showForm ? (
          <SpeciesForm
            initialData={editingSpecies || {}}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSpecies(null);
            }}
            loading={loading}
            customTypes={allTypes.filter(t => !BASE_TYPES.includes(t))}
          />
        ) : (
          <section className="sidebar-section">
            <h3 className="sidebar-section-title">Catalogo manual</h3>
            <p className="sidebar-copy">
              Registra especies propias del cliente por region. El analisis las muestra como
              probables, no como identificacion exacta.
            </p>
          </section>
        )}
      </Sidebar>
    </div>
  );
}

export default SpeciesPage;
