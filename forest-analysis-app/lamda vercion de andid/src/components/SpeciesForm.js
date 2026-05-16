import React, { useState } from 'react';
import { DEFAULT_SPECIES_CATEGORIES, normalizeCategory } from '../utils/helpers';
import './SpeciesForm.css';

const SPECIES_TYPES = [
  { value: 'nativa', label: 'Nativa' },
  { value: 'introducida', label: 'Introducida' },
  { value: 'invasora', label: 'Invasora' },
  { value: 'ornamental', label: 'Ornamental' },
  { value: 'comercial', label: 'Comercial' },
];

function buildCategoryOptions(categoryOptions = []) {
  const options = new Map();
  [...DEFAULT_SPECIES_CATEGORIES, ...categoryOptions].forEach((item) => {
    const value = typeof item === 'string' ? normalizeCategory(item) : normalizeCategory(item.value);
    const label = typeof item === 'string' ? item : item.label;
    if (value) options.set(value, label || value);
  });
  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
}

function SpeciesForm({ initialData = {}, onSubmit, onCancel, loading = false, categoryOptions = [] }) {
  const mergedCategories = buildCategoryOptions(categoryOptions);
  const initialCategory = normalizeCategory(initialData.category || 'maderable') || 'maderable';
  const initialIsCustom = !mergedCategories.some((category) => category.value === initialCategory);
  const [formData, setFormData] = useState({
    common_name: initialData.common_name || '',
    scientific_name: initialData.scientific_name || '',
    type: initialData.type || 'nativa',
    category: initialIsCustom ? '__new' : initialCategory,
    custom_category: initialIsCustom ? initialData.category || '' : '',
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
    if (formData.category === '__new' && !formData.custom_category.trim()) {
      nextErrors.custom_category = 'Escribe el nombre de la nueva categoria.';
    }
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
      category:
        formData.category === '__new'
          ? normalizeCategory(formData.custom_category)
          : formData.category,
      custom_category: undefined,
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
          {mergedCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
          <option value="__new">Agregar nueva categoria...</option>
        </select>
      </label>

      {formData.category === '__new' && (
        <label className="field">
          <span>Nueva categoria</span>
          <input
            name="custom_category"
            value={formData.custom_category}
            onChange={handleChange}
            placeholder="Ej: Semilla, sombra, cerca viva"
            disabled={loading}
          />
          {errors.custom_category && <small className="field-error">{errors.custom_category}</small>}
          <small className="field-hint">
            Quedara disponible como categoria al guardar esta especie.
          </small>
        </label>
      )}

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
