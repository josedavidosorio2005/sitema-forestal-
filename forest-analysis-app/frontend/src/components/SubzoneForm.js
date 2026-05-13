import React, { useState } from 'react';
import { getTreeColor } from '../utils/helpers';
import './SubzoneForm.css';

const USE_TYPES = [
  { value: 'plantacion', label: 'Plantacion' },
  { value: 'recoleccion', label: 'Recoleccion' },
  { value: 'conservacion', label: 'Conservacion' },
  { value: 'mixto', label: 'Mixto' },
];

const OPERATION_TYPES = [
  { value: 'sembrar', label: 'Sembrar' },
  { value: 'recolectar', label: 'Recolectar' },
  { value: 'monitorear', label: 'Monitorear' },
];

function SubzoneForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  speciesOptions = [],
  hasGeometry = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    use_type: initialData.use_type || 'plantacion',
    operation_type: initialData.operation_type || 'sembrar',
    slope_degrees: initialData.slope_degrees ?? 0,
    soil_type: initialData.soil_type || '',
    tree_species_id: initialData.tree_species_id || '',
    tree_common_name: initialData.tree_common_name || '',
    tree_count: initialData.tree_count ?? 0,
    notes: initialData.notes || '',
  });
  const [errors, setErrors] = useState({});
  const selectedSpecies = speciesOptions.find(
    (species) => Number(species.id) === Number(formData.tree_species_id)
  );
  const treePreviewName =
    selectedSpecies?.common_name || formData.tree_common_name || 'Sin especie';
  const treePreviewColor = getTreeColor(treePreviewName);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const nextErrors = {};
    const slope = Number(formData.slope_degrees);
    const treeCount = Number(formData.tree_count);

    if (!formData.name.trim()) nextErrors.name = 'El nombre es requerido.';
    if (!formData.soil_type.trim()) nextErrors.soil_type = 'El tipo de suelo es requerido.';
    if (!Number.isFinite(slope) || slope < 0 || slope > 90) {
      nextErrors.slope_degrees = 'Usa un valor entre 0 y 90 grados.';
    }
    if (!Number.isInteger(treeCount) || treeCount < 0) {
      nextErrors.tree_count = 'Usa una cantidad entera mayor o igual a 0.';
    }
    if (!formData.tree_species_id && !formData.tree_common_name.trim()) {
      nextErrors.tree_common_name = 'Selecciona una especie o escribe el arbol.';
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
      name: formData.name.trim(),
      use_type: formData.use_type,
      operation_type: formData.operation_type,
      slope_degrees: Number(formData.slope_degrees),
      soil_type: formData.soil_type.trim(),
      tree_species_id: formData.tree_species_id ? Number(formData.tree_species_id) : null,
      tree_common_name: formData.tree_common_name.trim(),
      tree_count: Number(formData.tree_count),
      notes: formData.notes.trim(),
    });
  }

  return (
    <form className="form-stack subzone-form" onSubmit={handleSubmit}>
      {hasGeometry && (
        <div className="geometry-note">
          Esta subzona quedara marcada con el poligono dibujado dentro de la zona.
        </div>
      )}

      <label className="field">
        <span>Nombre de subzona *</span>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Ladera norte"
          disabled={loading}
        />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </label>

      <div className="form-grid-two">
        <label className="field">
          <span>Uso *</span>
          <select name="use_type" value={formData.use_type} onChange={handleChange} disabled={loading}>
            {USE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Operacion *</span>
          <select
            name="operation_type"
            value={formData.operation_type}
            onChange={handleChange}
            disabled={loading}
          >
            {OPERATION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid-two">
        <label className="field">
          <span>Inclinacion grados *</span>
          <input
            name="slope_degrees"
            type="number"
            min="0"
            max="90"
            step="0.1"
            value={formData.slope_degrees}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.slope_degrees && <small className="field-error">{errors.slope_degrees}</small>}
        </label>

        <label className="field">
          <span>Arboles *</span>
          <input
            name="tree_count"
            type="number"
            min="0"
            step="1"
            value={formData.tree_count}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.tree_count && <small className="field-error">{errors.tree_count}</small>}
        </label>
      </div>

      <label className="field">
        <span>Tipo de suelo *</span>
        <input
          name="soil_type"
          value={formData.soil_type}
          onChange={handleChange}
          placeholder="Ej: Franco arcilloso, arenoso, humedo"
          disabled={loading}
        />
        {errors.soil_type && <small className="field-error">{errors.soil_type}</small>}
      </label>

      <label className="field">
        <span>Especie del catalogo</span>
        <select
          name="tree_species_id"
          value={formData.tree_species_id}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Sin seleccionar</option>
          {speciesOptions.map((species) => (
            <option key={species.id} value={species.id}>
              {species.common_name} - {species.scientific_name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Arbol manual</span>
        <input
          name="tree_common_name"
          value={formData.tree_common_name}
          onChange={handleChange}
          placeholder="Ej: Pino, cedro, eucalipto"
          disabled={loading}
        />
        {errors.tree_common_name && <small className="field-error">{errors.tree_common_name}</small>}
      </label>

      <div className="tree-color-preview">
        <span style={{ backgroundColor: treePreviewColor }} />
        <strong>{treePreviewName}</strong>
      </div>

      <label className="field">
        <span>Notas</span>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Distancia de siembra, acceso, observaciones del terreno"
          disabled={loading}
        />
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar subzona'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default SubzoneForm;
