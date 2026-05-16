import React, { useState } from 'react';
import './SpeciesForm.css';

const SPECIES_TYPES = [
  { value: 'nativa', label: 'Nativa' },
  { value: 'introducida', label: 'Introducida' },
  { value: 'invasora', label: 'Invasora' },
  { value: 'ornamental', label: 'Ornamental' },
  { value: 'comercial', label: 'Comercial' },
];

const SPECIES_CATEGORIES = [
  { value: 'maderable', label: 'Maderable' },
  { value: 'frutal', label: 'Frutal' },
  { value: 'restauracion', label: 'Restauracion' },
  { value: 'proteccion', label: 'Proteccion de suelo' },
  { value: 'ornamental', label: 'Ornamental' },
  { value: 'medicinal', label: 'Medicinal' },
  { value: 'otro', label: 'Otro' },
];

function SpeciesForm({ initialData = {}, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState({
    common_name: initialData.common_name || '',
    scientific_name: initialData.scientific_name || '',
    type: initialData.type || 'nativa',
    category: initialData.category || 'maderable',
    description: initialData.description || '',
    region: initialData.region || '',
    image_url: initialData.image_url || '',
    observations: initialData.observations || '',
  });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
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

      <label className="field">
        <span>Tipo *</span>
        <select name="type" value={formData.type} onChange={handleChange} disabled={loading}>
          {SPECIES_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Categoria de uso</span>
        <select name="category" value={formData.category} onChange={handleChange} disabled={loading}>
          {SPECIES_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

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
