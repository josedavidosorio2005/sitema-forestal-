import React from 'react';
import {
  formatNumber,
  getSubzoneOperationLabel,
  getSubzoneTreeColor,
  getSubzoneTreeName,
  getSubzoneUseLabel,
} from '../utils/helpers';
import './SubzonesPanel.css';

function SubzonesPanel({
  subzones = [],
  selectedSubzone = null,
  onSelect,
  onEdit,
  onDelete,
}) {
  const totalTrees = subzones.reduce((sum, subzone) => sum + Number(subzone.tree_count || 0), 0);
  const plantedTrees = subzones
    .filter((subzone) => subzone.operation_type === 'sembrar')
    .reduce((sum, subzone) => sum + Number(subzone.tree_count || 0), 0);
  const harvestTrees = subzones
    .filter((subzone) => subzone.operation_type === 'recolectar')
    .reduce((sum, subzone) => sum + Number(subzone.tree_count || 0), 0);

  return (
    <section className="subzones-panel">
      <div className="subzone-summary">
        <div>
          <span>Subzonas</span>
          <strong>{subzones.length}</strong>
        </div>
        <div>
          <span>Arboles</span>
          <strong>{formatNumber(totalTrees, 0)}</strong>
        </div>
        <div>
          <span>Siembra</span>
          <strong>{formatNumber(plantedTrees, 0)}</strong>
        </div>
        <div>
          <span>Recoleccion</span>
          <strong>{formatNumber(harvestTrees, 0)}</strong>
        </div>
      </div>

      {subzones.length === 0 ? (
        <p className="subzone-empty">Todavia no hay subzonas para esta zona.</p>
      ) : (
        <div className="subzone-list">
          {subzones.map((subzone) => (
            <article
              key={subzone.id}
              className={selectedSubzone?.id === subzone.id ? 'subzone-card active' : 'subzone-card'}
              onClick={() => onSelect?.(subzone)}
            >
              <div className="subzone-card-header">
                <div>
                  <h4>
                    <span
                      className="subzone-color-dot"
                      style={{ backgroundColor: getSubzoneTreeColor(subzone) }}
                    />
                    {subzone.name}
                  </h4>
                  <span>{getSubzoneUseLabel(subzone.use_type)} / {getSubzoneOperationLabel(subzone.operation_type)}</span>
                </div>
                <strong>{formatNumber(subzone.tree_count, 0)}</strong>
              </div>
              <div className="subzone-details">
                <span>{formatNumber(subzone.slope_degrees, 1)} grados</span>
                <span>{subzone.soil_type}</span>
                <span>{getSubzoneTreeName(subzone)}</span>
                {subzone.area_ha ? (
                  <span>{formatNumber(subzone.area_ha)} ha</span>
                ) : (
                  <span>Sin poligono</span>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div className="row-actions">
                  {onEdit && (
                    <button
                      type="button"
                      className="btn btn-small btn-secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit(subzone);
                      }}
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(subzone);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default SubzonesPanel;
