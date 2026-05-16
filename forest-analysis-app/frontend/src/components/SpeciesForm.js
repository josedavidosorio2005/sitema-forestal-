import React, { useState } from 'react';
import './SpeciesForm.css';

const DEFAULT_TYPES = [
  { value: 'nativa', label: 'Nativa' },
  { value: 'introducida', label: 'Introducida' },
  { value: 'invasora', label: 'Invasora' },
  { value: 'ornamental', label: 'Ornamental' },
  { value: 'comercial', label: 'Comercial' },
];

function SpeciesForm({ initialData = {}, onSubmit, onCancel, loading = false, customTypes = [] }) {
  const [formData, setFormData] = useState({
    common_name: initialData.common_name || '',
    scientific_name: initialData.scientific_name || '',
    type: initialData.type || 'nativa',
    description: initialData.description || '',
    region: initialData.region || '',
    image_url: initialData.image_url || '',
    observations: initialData.observations || '',
  });
  const [errors, setErrors] = useState({});
  const [showNewType, setShowNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [localAddedTypes, setLocalAddedTypes] = useState([]);

  // Merge default + custom from DB + locally created types
  const allTypes = [...DEFAULT_TYPES];
  [...customTypes, ...localAddedTypes].forEach(ct => {
    if (!allTypes.find(t => t.value === ct)) {
      allTypes.push({ value: ct, label: ct.charAt(0).toUpperCase() + ct.slice(1) });
    }
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleAddNewType() {
    const trimmed = newTypeName.trim().toLowerCase();
    if (!trimmed) return;
    // Add to local state so it survives re-renders
    if (!localAddedTypes.includes(trimmed)) {
      setLocalAddedTypes(prev => [...prev, trimmed]);
    }
    setFormData(prev => ({ ...prev, type: trimmed }));
    setShowNewType(false);
    setNewTypeName('');
  }

  function validate() {
    const nextErrors = {};
    if (!formData.common_name.trim()) nextErrors.common_name = 'Requerido.';
    if (!formData.scientific_name.trim()) nextErrors.scientific_name = 'Requerido.';
    if (!formData.type) nextErrors.type = 'Requerido.';
    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      ...formData,
      common_name: formData.common_name.trim(),
      scientific_name: formData.scientific_name.trim(),
      description: formData.description.trim(),
      region: formData.region.trim(),
      image_url: formData.image_url.trim(),
      observations: formData.observations.trim(),
    });
  }

  return (
    <form className="form-stack species-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Nombre comun *</span>
        <input
          name="common_name"
          value={formData.common_name}
          onChange={handleChange}
          placeholder="Ej: Cedro rojo"
          disabled={loading}
        />
        {errors.common_name && <small className="field-error">{errors.common_name}</small>}
      </label>

      <label className="field">
        <span>Nombre cientifico *</span>
        <input
          name="scientific_name"
          value={formData.scientific_name}
          onChange={handleChange}
          placeholder="Ej: Cedrela odorata"
          disabled={loading}
        />
        {errors.scientific_name && (
          <small className="field-error">{errors.scientific_name}</small>
        )}
      </label>

      <div className="field">
        <span>Categoría / Tipo *</span>
        {!showNewType ? (
          <div className="type-selector">
            <select name="type" value={formData.type} onChange={handleChange} disabled={loading}>
              {allTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary btn-small btn-new-type"
              onClick={() => setShowNewType(true)}
              disabled={loading}
              title="Crear nueva categoría"
            >
              + Nueva
            </button>
          </div>
        ) : (
          <div className="new-type-form">
            <input
              type="text"
              placeholder="Nombre de la nueva categoría"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewType(); } }}
            />
            <div className="new-type-actions">
              <button type="button" className="btn btn-primary btn-small" onClick={handleAddNewType} disabled={!newTypeName.trim()}>
                Crear
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => { setShowNewType(false); setNewTypeName(''); }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
        {errors.type && <small className="field-error">{errors.type}</small>}
      </div>

      <label className="field">
        <span>Region habitual</span>
        <input
          name="region"
          value={formData.region}
          onChange={handleChange}
          placeholder="Ej: Andes, Caribe, Amazonia"
          disabled={loading}
        />
      </label>

      <label className="field">
        <span>Descripcion</span>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          disabled={loading}
        />
      </label>

      <label className="field">
        <span>Imagen opcional</span>
        <input
          name="image_url"
          type="url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://..."
          disabled={loading}
        />
      </label>

      <label className="field">
        <span>Observaciones</span>
        <textarea
          name="observations"
          value={formData.observations}
          onChange={handleChange}
          rows="3"
          disabled={loading}
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar especie'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default SpeciesForm;
