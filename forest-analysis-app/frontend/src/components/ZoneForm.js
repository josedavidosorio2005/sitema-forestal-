import React, { useState } from 'react';
import './ZoneForm.css';

function ZoneForm({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  speciesOptions = [],
  // showConfirmedSpecies is kept for backward compatibility but species selector always shows now
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

  function toggleSpecies(speciesId) {
    setFormData((current) => {
      const ids = current.confirmed_species_ids;
      const next = ids.includes(speciesId)
        ? ids.filter((id) => id !== speciesId)
        : [...ids, speciesId];
      return { ...current, confirmed_species_ids: next };
    });
  }

  function clearSpecies() {
    setFormData((current) => ({ ...current, confirmed_species_ids: [] }));
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

  const noneSelected = formData.confirmed_species_ids.length === 0;

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {/* Nombre */}
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

      {/* Region + Color */}
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

      {/* Descripcion */}
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

      {/* Especies - siempre visible, con checkboxes y opcion Ninguna */}
      <div className="field">
        <span>Especies nativas confirmadas</span>
        <div
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: '#fafafa',
            marginTop: '4px',
          }}
        >
          {/* Opcion Ninguna */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontStyle: 'italic',
              color: '#6b7280',
              paddingBottom: '4px',
              borderBottom: '1px dashed #e5e7eb',
            }}
          >
            <input
              type="checkbox"
              checked={noneSelected}
              onChange={clearSpecies}
              disabled={loading}
            />
            Ninguna
          </label>

          {speciesOptions.length === 0 ? (
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', padding: '4px 0' }}>
              No hay especies registradas todavia. Ve a la seccion Especies para agregar.
            </span>
          ) : (
            speciesOptions.map((sp) => (
              <label
                key={sp.id}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={formData.confirmed_species_ids.includes(sp.id)}
                  onChange={() => toggleSpecies(sp.id)}
                  disabled={loading}
                />
                <span>
                  <strong>{sp.common_name}</strong>
                  {sp.scientific_name && (
                    <em style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: '6px' }}>
                      ({sp.scientific_name})
                    </em>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
        <small style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: '2px', display: 'block' }}>
          Marca todas las que apliquen. Si no hay ninguna, deja solo "Ninguna".
        </small>
      </div>

      {/* Acciones */}
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
