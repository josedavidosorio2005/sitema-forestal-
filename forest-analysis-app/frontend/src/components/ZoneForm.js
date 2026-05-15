import React, { useState } from 'react';
import './ZoneForm.css';

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
    color: initialData.geometry?.properties?.color || '#22c55e',
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

      <div style={{ display: 'flex', gap: '12px' }}>
        <label className="field" style={{ flex: 1 }}>
          <span>Region o ubicacion</span>
          <input
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Ej: Andes, Caribe, Amazonia"
            disabled={loading}
          />
        </label>
        
        <label className="field" style={{ width: '80px' }}>
          <span>Color</span>
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={loading}
            style={{ width: '100%', height: '38px', padding: '2px', cursor: 'pointer' }}
          />
        </label>
      </div>

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
