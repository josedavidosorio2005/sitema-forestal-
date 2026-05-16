import React, { useState } from 'react';
import './ZoneForm.css';

const ZONE_COLORS = ['#116b3b', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0f766e'];

function ZoneForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  speciesOptions = [],
  showConfirmedSpecies = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    region: initialData.region || '',
    color: initialData.color || '#116b3b',
    confirmed_species_ids: initialData.confirmed_species_ids || [],
  });
  const [errors, setErrors] = useState({});

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function handleConfirmedChange(event) {
    const selected = Array.from(event.target.selectedOptions).map((option) =>
      Number(option.value)
    );
    setFormData((current) => ({ ...current, confirmed_species_ids: selected }));
  }

  function validate() {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'El nombre es requerido.';
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
      name: formData.name.trim(),
      description: formData.description.trim(),
      region: formData.region.trim(),
      color: formData.color,
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <label className="field">
        <span>Nombre de la zona *</span>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Reserva norte"
          disabled={loading}
        />
        {errors.name && <small className="field-error">{errors.name}</small>}
      </label>

      <label className="field">
        <span>Region o ubicacion</span>
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
          placeholder="Notas de campo, uso del suelo o referencia del predio"
          disabled={loading}
          rows="4"
        />
      </label>

      <label className="field">
        <span>Color de la zona</span>
        <div className="color-picker-row">
          <input
            name="color"
            type="color"
            value={formData.color}
            onChange={handleChange}
            disabled={loading}
            aria-label="Color de la zona"
          />
          <div className="color-swatches">
            {ZONE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={formData.color === color ? 'color-swatch active' : 'color-swatch'}
                style={{ backgroundColor: color }}
                onClick={() => setFormData((current) => ({ ...current, color }))}
                disabled={loading}
                aria-label={`Usar color ${color}`}
              />
            ))}
          </div>
        </div>
        <small className="field-hint">
          Este color se refleja en el mapa para distinguir cada zona.
        </small>
      </label>

      {showConfirmedSpecies && (
        <label className="field">
          <span>Especies confirmadas manualmente</span>
          <select
            multiple
            value={formData.confirmed_species_ids.map(String)}
            onChange={handleConfirmedChange}
            disabled={loading || speciesOptions.length === 0}
            size={Math.min(6, Math.max(3, speciesOptions.length || 3))}
          >
            {speciesOptions.map((species) => (
              <option key={species.id} value={species.id}>
                {species.common_name} - {species.scientific_name}
              </option>
            ))}
          </select>
          <small className="field-hint">
            Mantiene separadas las especies probables de las confirmadas por el usuario.
          </small>
        </label>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
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

export default ZoneForm;
