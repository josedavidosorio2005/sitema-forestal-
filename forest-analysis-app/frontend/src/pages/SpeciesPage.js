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

const FILTERS = ['todas', 'nativa', 'introducida', 'invasora', 'ornamental', 'comercial'];

function SpeciesPage() {
  const [species, setSpecies] = useState([]);
  const [selectedType, setSelectedType] = useState('todas');
  const [editingSpecies, setEditingSpecies] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const activeType = selectedType === 'todas' ? null : selectedType;

  const loadSpecies = useCallback(async (type = activeType) => {
    try {
      setLoading(true);
      const response = await speciesService.getAll(type);
      setSpecies(response.data.data);
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
    const confirmed = window.confirm('Eliminar esta especie del catalogo?');
    if (!confirmed) return;

    try {
      await speciesService.delete(speciesId);
      setMessage({ type: 'success', text: 'Especie eliminada.' });
      await loadSpecies();
    } catch (error) {
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

  return (
    <div className="management-layout">
      <main className="management-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">Catalogo del cliente</span>
            <h1>Especies arboreas</h1>
            <p>
              El catalogo manual evita depender de una IA para adivinar especies. Los reportes
              usan estas especies como base local.
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
                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(item.id)}>
                          Eliminar
                        </button>
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
