import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TreeLocationMap from '../components/TreeLocationMap';
import { zonesService, subzonesService, treesService, speciesService } from '../services/api';
import { getErrorMessage, formatNumber, formatDate } from '../utils/helpers';
import './TraceabilityPage.css';

function TraceabilityPage() {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [subzones, setSubzones] = useState([]);
  const [selectedSubzone, setSelectedSubzone] = useState('');
  
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [treeLogs, setTreeLogs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // New Log form state
  const [showLogForm, setShowLogForm] = useState(false);
  const [showTreeForm, setShowTreeForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [treeQueue, setTreeQueue] = useState([]);
  const [savingBatch, setSavingBatch] = useState(false);
  const [placedCoords, setPlacedCoords] = useState(null);
  const [zoneGeometry, setZoneGeometry] = useState(null);
  const [subzoneGeometry, setSubzoneGeometry] = useState(null);
  
  const [treeFormData, setTreeFormData] = useState({
    qr_tag: '',
    species_id: '',
    dap: '',
    commercial_height: '',
    estimated_volume: '',
    legal_permit: false,
    health_condition: 'Sano / Normal'
  });

  const [logFormData, setLogFormData] = useState({
    action: 'tala',
    operator_name: '',
    equipment_used: '',
    cable_tension: '',
    destination: ''
  });

  const [species, setSpecies] = useState([]);

  useEffect(() => {
    loadZones();
    loadSpecies();
  }, []);

  async function loadSpecies() {
    try {
      const response = await speciesService.getAll();
      setSpecies(response.data.data);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadZones() {
    try {
      setLoading(true);
      const response = await zonesService.getAll();
      setZones(response.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleZoneChange(e) {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
    setSelectedSubzone('');
    setTrees([]);
    setSelectedTree(null);
    setShowTreeForm(false);
    setFilterStatus('Todos');
    setPlacedCoords(null);
    setSubzoneGeometry(null);

    if (!zoneId) {
      setSubzones([]);
      setZoneGeometry(null);
      return;
    }

    // Track zone geometry for the map
    const zone = zones.find(z => z.id === Number(zoneId));
    setZoneGeometry(zone?.geometry || null);

    try {
      setLoading(true);
      const response = await subzonesService.getByZoneId(zoneId);
      setSubzones(response.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubzoneChange(e) {
    const subzoneId = e.target.value;
    setSelectedSubzone(subzoneId);
    setSelectedTree(null);
    setShowTreeForm(false);
    setFilterStatus('Todos');
    setPlacedCoords(null);

    // Track subzone geometry for the map
    const sz = subzones.find(s => s.id === Number(subzoneId));
    setSubzoneGeometry(sz?.geometry || null);

    if (!subzoneId) {
      setTrees([]);
      return;
    }

    loadTrees(subzoneId);
  }

  async function loadTrees(subzoneId) {
    try {
      setLoading(true);
      const response = await treesService.getBySubzoneId(subzoneId);
      setTrees(response.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  async function selectTree(tree) {
    setSelectedTree(tree);
    setShowLogForm(false);
    setShowTreeForm(false);
    
    try {
      setLoading(true);
      const response = await treesService.getLogs(tree.id);
      setTreeLogs(response.data.data);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  function handleTreeSubmit(e) {
    e.preventDefault();
    if (!selectedSubzone) return;

    if (!placedCoords) {
      setMessage({ type: 'error', text: 'Primero ubica el árbol en el mapa (haz clic o usa GPS).' });
      return;
    }

    const payload = {
      subzone_id: selectedSubzone,
      qr_tag: treeFormData.qr_tag,
      species_id: treeFormData.species_id || null,
      dap: parseFloat(treeFormData.dap),
      commercial_height: parseFloat(treeFormData.commercial_height),
      estimated_volume: parseFloat(treeFormData.estimated_volume),
      legal_permit: treeFormData.legal_permit,
      health_condition: treeFormData.health_condition,
      geometry: { type: 'Point', coordinates: placedCoords },
      _speciesLabel: species.find(s => String(s.id) === String(treeFormData.species_id))?.common_name || 'Sin especie'
    };

    if (treeQueue.some(t => t.qr_tag === payload.qr_tag)) {
      setMessage({ type: 'error', text: 'Ya existe un árbol con ese QR en la cola.' });
      return;
    }

    setTreeQueue(prev => [...prev, payload]);
    setPlacedCoords(null);
    setTreeFormData({ qr_tag: '', species_id: treeFormData.species_id, dap: '', commercial_height: '', estimated_volume: '', legal_permit: treeFormData.legal_permit, health_condition: treeFormData.health_condition });
    setMessage({ type: 'success', text: `Árbol "${payload.qr_tag}" añadido a la cola (${treeQueue.length + 1} pendientes). Ubica el siguiente en el mapa.` });
  }

  function removeFromQueue(index) {
    setTreeQueue(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveBatch() {
    if (treeQueue.length === 0) return;
    try {
      setSavingBatch(true);
      const cleanTrees = treeQueue.map(({ _speciesLabel, ...rest }) => rest);
      const response = await treesService.createBatch(cleanTrees);
      const { data, errors } = response.data;
      const errCount = errors?.length || 0;
      setMessage({ type: errCount > 0 ? 'error' : 'success', text: `${data.length} árboles registrados.${errCount > 0 ? ` ${errCount} errores: ${errors.map(e => e.error).join(', ')}` : ''}` });
      setTreeQueue(errCount > 0 ? treeQueue.filter((_, i) => errors.some(e => e.index === i)) : []);
      setShowTreeForm(false);
      loadTrees(selectedSubzone);
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setSavingBatch(false);
    }
  }

  async function handleLogSubmit(e) {
    e.preventDefault();
    if (!selectedTree) return;

    try {
      setLoading(true);
      const payload = {
        ...logFormData,
        cable_tension: logFormData.cable_tension ? parseFloat(logFormData.cable_tension) : null
      };

      await treesService.createLog(selectedTree.id, payload);
      
      setMessage({ type: 'success', text: 'Trazabilidad registrada correctamente.' });
      setShowLogForm(false);
      setLogFormData({
        action: 'tala',
        operator_name: '',
        equipment_used: '',
        cable_tension: '',
        destination: ''
      });
      
      selectTree(selectedTree);
      if (selectedSubzone) {
        loadTrees(selectedSubzone);
      }
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  const filteredTrees = filterStatus === 'Todos' 
    ? trees 
    : trees.filter(t => t.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="traceability-layout">
      <main className="traceability-main">
        <div className="page-header">
          <div>
            <span className="eyebrow">🚚 Logística y Transporte</span>
            <h1>Trazabilidad de Árboles</h1>
            <p>Controla la extracción, movimiento por cable vía y despacho de madera.</p>
          </div>
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        {/* Mapa de ubicación de árboles */}
        {selectedZone && (
          <TreeLocationMap
            zoneGeometry={zoneGeometry}
            subzoneGeometry={subzoneGeometry}
            trees={trees}
            selectedTree={selectedTree}
            placingMode={showTreeForm}
            placedCoords={placedCoords}
            onLocationSelect={setPlacedCoords}
            onSelectTree={selectTree}
            style={{ height: '340px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}
          />
        )}

        <div className="traceability-controls card">
          <div className="form-group">
            <label>1. Selecciona una Zona</label>
            <select value={selectedZone} onChange={handleZoneChange} className="form-control">
              <option value="">-- Seleccionar Zona --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>2. Selecciona un Lote/Subzona</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <select 
                value={selectedSubzone} 
                onChange={handleSubzoneChange} 
                className="form-control"
                disabled={!selectedZone}
              >
                <option value="">-- Seleccionar Subzona --</option>
                {subzones.map((sz) => (
                  <option key={sz.id} value={sz.id}>{sz.name} ({sz.use_type})</option>
                ))}
              </select>
              {selectedZone && subzones.length === 0 && (
                <button 
                  className="btn btn-secondary" 
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await subzonesService.create(selectedZone, {
                        name: 'Lote Principal',
                        use_type: 'mixto',
                        operation_type: 'monitorear',
                        slope_degrees: 15,
                        soil_type: 'Arcilloso',
                        tree_count: 0,
                        tree_common_name: 'Pino (Variedad Local)'
                      });
                      const response = await subzonesService.getByZoneId(selectedZone);
                      setSubzones(response.data.data);
                      setMessage({ type: 'success', text: 'Lote creado automáticamente. Por favor selecciónalo.' });
                    } catch(e) {
                      setMessage({ type: 'error', text: getErrorMessage(e) });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  + Crear Lote Rápido
                </button>
              )}
            </div>
            {selectedZone && subzones.length === 0 && (
              <small className="text-secondary mt-1 block">Esta zona no tiene lotes. Crea uno rápido para empezar.</small>
            )}
          </div>
        </div>

        {!selectedSubzone && (
          <div className="empty-state-hero">
            <div className="hero-icon-container">
              <span className="hero-icon">🌲</span>
            </div>
            <h2>Bienvenido al Centro de Trazabilidad</h2>
            <p>
              Aquí podrás monitorear cada árbol especial desde su marcación hasta su despacho.
              Comienza seleccionando una <strong>Zona</strong> y un <strong>Lote</strong> en la parte superior para visualizar el inventario y controlar el impacto ambiental en el terreno.
            </p>
            {!selectedZone && (
              <div className="hero-steps">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <span>Elige la Zona Operativa</span>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <span>Selecciona el Lote/Subzona</span>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <span>Gestiona la Trazabilidad</span>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedSubzone && (
          <>
            <div className="traceability-dashboard">
              <div className="stat-card">
                <span className="stat-icon">🌲</span>
                <div className="stat-info">
                  <h4>Total Árboles</h4>
                  <p>{trees.length} individuos</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🪚</span>
                <div className="stat-info">
                  <h4>Derribados/Troceados</h4>
                  <p>{trees.filter(t => t.status === 'Derribado' || t.status === 'Troceado').length} individuos</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🚚</span>
                <div className="stat-info">
                  <h4>Despachados</h4>
                  <p>{trees.filter(t => t.status === 'Despachado').length} individuos</p>
                </div>
              </div>
              <div className="stat-card highlight">
                <span className="stat-icon">📦</span>
                <div className="stat-info">
                  <h4>Volumen Total</h4>
                  <p>{formatNumber(trees.reduce((acc, t) => acc + (t.estimated_volume || 0), 0))} m³</p>
                </div>
              </div>
            </div>

            <div className="section-header-row mt-4 align-items-center">
              <div>
                <h2>Inventario del Lote</h2>
                <div className="filters-group mt-2">
                  {['Todos', 'Marcado', 'Derribado', 'Troceado', 'Despachado'].map(status => (
                    <button 
                      key={status}
                      className={`filter-badge ${filterStatus === status ? 'active' : ''}`}
                      onClick={() => setFilterStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                {treeQueue.length > 0 && (
                  <button className="btn btn-primary btn-icon" onClick={handleSaveBatch} disabled={savingBatch}>
                    {savingBatch ? '⏳ Guardando...' : `💾 Guardar ${treeQueue.length} árbol(es)`}
                  </button>
                )}
                <button className="btn btn-primary btn-icon" onClick={() => {
                  setShowTreeForm(true);
                  setSelectedTree(null);
                }}>
                  <span className="icon-plus">+</span> Marcar Árbol
                </button>
              </div>
            </div>

            {loading && trees.length === 0 ? (
              <div className="state-box">Cargando inventario...</div>
            ) : filteredTrees.length === 0 ? (
              <div className="state-box">No hay árboles que coincidan con este estado.</div>
            ) : (
              <div className="trees-grid">
                {filteredTrees.map((tree) => (
                  <div 
                    key={tree.id} 
                    className={`tree-card ${selectedTree?.id === tree.id ? 'active' : ''}`}
                    onClick={() => selectTree(tree)}
                  >
                    <div className="tree-header">
                      <span className="tree-id">QR: {tree.qr_tag}</span>
                      <span className={`tree-status ${tree.status.toLowerCase()}`}>{tree.status}</span>
                    </div>
                    <h3>{tree.species_common_name || 'Especie Desconocida'}</h3>
                    <p className="text-secondary text-sm" style={{marginBottom: '0'}}>
                      {tree.species_scientific_name && <em>{tree.species_scientific_name}</em>}
                    </p>
                    
                    <div className="tree-metrics">
                      <div className="tree-metric">
                        <span className="tree-metric-label">DAP</span>
                        <span className="tree-metric-value">{tree.dap} cm</span>
                      </div>
                      <div className="tree-metric">
                        <span className="tree-metric-label">Altura Com.</span>
                        <span className="tree-metric-value">{tree.commercial_height} m</span>
                      </div>
                      <div className="tree-metric">
                        <span className="tree-metric-label">Volumen</span>
                        <span className="tree-metric-value">{formatNumber(tree.estimated_volume)} m³</span>
                      </div>
                      <div className="tree-metric">
                        <span className="tree-metric-label">Permiso</span>
                        <span className="tree-metric-value">{tree.legal_permit ? '✅ Aprobado' : '❌ Pendiente'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Sidebar title={showTreeForm ? `Marcar Árboles (${treeQueue.length} en cola)` : selectedTree ? `Árbol QR: ${selectedTree.qr_tag}` : selectedSubzone ? 'Impacto del Lote' : 'Detalles'}>
        {showTreeForm ? (
          <div className="mt-3">
            <p className="sidebar-copy">Agrega múltiples árboles a la cola y guárdalos todos de una vez.</p>

            {treeQueue.length > 0 && (
              <div className="batch-queue">
                <h4 className="sidebar-section-title">Cola de registro ({treeQueue.length})</h4>
                <div className="queue-list">
                  {treeQueue.map((item, idx) => (
                    <div key={idx} className="queue-item">
                      <div className="queue-item-info">
                        <strong>{item.qr_tag}</strong>
                        <small>{item._speciesLabel} · DAP {item.dap}cm · {item.estimated_volume}m³</small>
                      </div>
                      <button className="btn-remove" onClick={() => removeFromQueue(idx)} title="Quitar">✕</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-block mt-2" onClick={handleSaveBatch} disabled={savingBatch}>
                  {savingBatch ? '⏳ Guardando...' : `💾 Guardar ${treeQueue.length} árbol(es)`}
                </button>
                <div style={{height:'1px',background:'var(--border-color)',margin:'16px 0'}}></div>
              </div>
            )}

            <h4 className="sidebar-section-title" style={{marginTop: treeQueue.length > 0 ? '0' : '8px'}}>Agregar otro árbol</h4>
            <form onSubmit={handleTreeSubmit}>
              <div className="form-group">
                <label>Código QR / Tag ID *</label>
                <input type="text" className="form-control" required placeholder="Ej. TR-2023-001" value={treeFormData.qr_tag} onChange={(e) => setTreeFormData({...treeFormData, qr_tag: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Especie</label>
                <select className="form-control" value={treeFormData.species_id} onChange={(e) => setTreeFormData({...treeFormData, species_id: e.target.value})}>
                  <option value="">-- Seleccionar Especie --</option>
                  {species.map(s => <option key={s.id} value={s.id}>{s.common_name} ({s.scientific_name})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>DAP (cm) *</label>
                <input type="number" step="0.1" className="form-control" required value={treeFormData.dap} onChange={(e) => setTreeFormData({...treeFormData, dap: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Altura Comercial (m) *</label>
                <input type="number" step="0.1" className="form-control" required value={treeFormData.commercial_height} onChange={(e) => setTreeFormData({...treeFormData, commercial_height: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Volumen Estimado (m³) *</label>
                <input type="number" step="0.01" className="form-control" required value={treeFormData.estimated_volume} onChange={(e) => setTreeFormData({...treeFormData, estimated_volume: e.target.value})} />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={treeFormData.legal_permit} onChange={(e) => setTreeFormData({...treeFormData, legal_permit: e.target.checked})} />
                  Permiso Legal Aprobado
                </label>
              </div>
              <div className="form-group">
                <label>Estado de Salud</label>
                <select className="form-control" value={treeFormData.health_condition} onChange={(e) => setTreeFormData({...treeFormData, health_condition: e.target.value})}>
                  <option value="Sano / Normal">Sano / Normal</option>
                  <option value="Infectado (Plaga/Hongo)">Infectado (Plaga/Hongo)</option>
                  <option value="Crecimiento Acelerado">Crecimiento Acelerado</option>
                  <option value="Déficit de Crecimiento">Déficit de Crecimiento</option>
                  <option value="Riesgo de Caída">Riesgo de Caída</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowTreeForm(false); if(treeQueue.length > 0 && window.confirm('Tienes árboles en cola sin guardar. ¿Deseas descartarlos?')) setTreeQueue([]); }}>Cerrar</button>
                <button type="submit" className="btn btn-primary">+ Añadir a cola</button>
              </div>
            </form>
          </div>
        ) : !selectedTree && selectedSubzone ? (
          (() => {
            const currentSubzone = subzones.find(sz => sz.id === parseInt(selectedSubzone));
            if (!currentSubzone) return null;

            // Calculate impact
            const extractedTrees = trees.filter(t => t.status === 'Despachado' || t.status === 'Troceado');
            const totalExtractedVolume = extractedTrees.reduce((acc, t) => acc + (t.estimated_volume || 0), 0);
            const compactionLimit = currentSubzone.compaction_limit || 100;
            const impactPercentage = Math.min((totalExtractedVolume / compactionLimit) * 100, 100);
            const isCritical = totalExtractedVolume >= compactionLimit;

            return (
              <div className="impact-monitor">
                <p className="sidebar-copy mb-4">Monitor de impacto en el suelo y control de extracción forestal del lote.</p>
                
                <div className="state-box" style={{ borderColor: isCritical ? '#ef4444' : 'var(--border-color)', backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'var(--card-bg)' }}>
                  <h4 style={{ color: isCritical ? '#ef4444' : 'var(--text-primary)', marginBottom: '10px' }}>
                    {isCritical ? '⚠️ ALERTA: Límite de Compactación Superado' : 'Monitor de Compactación de Suelo'}
                  </h4>
                  <div className="progress-container" style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', width: `${impactPercentage}%`, backgroundColor: isCritical ? '#ef4444' : 'var(--primary-color)', transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Extraído: {formatNumber(totalExtractedVolume)} m³</span>
                    <span className="text-secondary">Límite: {formatNumber(compactionLimit)} m³</span>
                  </div>
                </div>

                <h4 className="sidebar-section-title mt-4 pt-4" style={{borderTop: '1px solid var(--border-color)'}}>Trazabilidad de Regeneración</h4>
                
                <div className="form-group mt-3">
                  <label>Estado de Regeneración Natural</label>
                  <select 
                    className="form-control" 
                    value={currentSubzone.regeneration_state || 'nulo'}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setSubzones(subzones.map(sz => sz.id === currentSubzone.id ? {...sz, regeneration_state: val} : sz));
                      await subzonesService.update(currentSubzone.id, {...currentSubzone, regeneration_state: val});
                    }}
                  >
                    <option value="nulo">Nulo</option>
                    <option value="inicial">Inicial</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Registro Erosión Pre-Saca</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Sin signos evidentes"
                    value={currentSubzone.erosion_pre || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubzones(subzones.map(sz => sz.id === currentSubzone.id ? {...sz, erosion_pre: val} : sz));
                    }}
                    onBlur={async (e) => {
                      await subzonesService.update(currentSubzone.id, {...currentSubzone, erosion_pre: e.target.value});
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>Registro Erosión Post-Saca</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Surcos ligeros por arrastre"
                    value={currentSubzone.erosion_post || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubzones(subzones.map(sz => sz.id === currentSubzone.id ? {...sz, erosion_post: val} : sz));
                    }}
                    onBlur={async (e) => {
                      await subzonesService.update(currentSubzone.id, {...currentSubzone, erosion_post: e.target.value});
                    }}
                  />
                </div>

              </div>
            );
          })()
        ) : !selectedTree ? (
          <div className="state-box">Selecciona una subzona para ver su impacto, o un árbol para ver su historial.</div>
        ) : (
          <>
            <section className="sidebar-section">
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--surface-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Logística Operativa</h4>
                  <span className={`tree-status ${selectedTree.status.toLowerCase()}`}>{selectedTree.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '15px' }}>
                  <div><strong>Volumen:</strong> {formatNumber(selectedTree.estimated_volume)} m³</div>
                  <div><strong>DAP:</strong> {selectedTree.dap} cm</div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Permiso Legal:</strong> {selectedTree.legal_permit ? '✅ Aprobado' : '❌ Sin validar'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Condición Fitosanitaria</h4>
                  <select 
                    className="form-control" 
                    value={selectedTree.health_condition || 'Sano / Normal'}
                    onChange={async (e) => {
                      const newCondition = e.target.value;
                      const updatedTree = {...selectedTree, health_condition: newCondition};
                      setSelectedTree(updatedTree);
                      setTrees(trees.map(t => t.id === updatedTree.id ? updatedTree : t));
                      await treesService.update(updatedTree.id, updatedTree);
                    }}
                  >
                    <option value="Sano / Normal">Sano / Normal</option>
                    <option value="Infectado (Plaga/Hongo)">Infectado (Plaga/Hongo)</option>
                    <option value="Crecimiento Acelerado">Crecimiento Acelerado</option>
                    <option value="Déficit de Crecimiento">Déficit de Crecimiento</option>
                    <option value="Riesgo de Caída">Riesgo de Caída</option>
                  </select>
                </div>
              </div>

              <div className="section-header-row">
                <h3 className="sidebar-section-title">Historial de Trazabilidad</h3>
                {!showLogForm && (
                  <button 
                    className="btn btn-primary btn-small"
                    onClick={() => setShowLogForm(true)}
                  >
                    + Registrar
                  </button>
                )}
              </div>

              {showLogForm ? (
                <form onSubmit={handleLogSubmit} className="mt-3">
                  <div className="form-group">
                    <label>Acción a registrar *</label>
                    <select 
                      className="form-control"
                      value={logFormData.action}
                      onChange={(e) => setLogFormData({...logFormData, action: e.target.value})}
                      required
                    >
                      <option value="tala">Tala / Derribo</option>
                      <option value="movimiento">Extracción (Cable Vía)</option>
                      <option value="despacho">Despacho a Camión</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Operador o Cuadrilla *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={logFormData.operator_name}
                      onChange={(e) => setLogFormData({...logFormData, operator_name: e.target.value})}
                      required
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="form-group">
                    <label>Equipo Utilizado</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={logFormData.equipment_used}
                      onChange={(e) => setLogFormData({...logFormData, equipment_used: e.target.value})}
                      placeholder="Ej. Motosierra Stihl, Torre A"
                    />
                  </div>

                  {logFormData.action === 'movimiento' && (
                    <div className="form-group">
                      <label>Tensión del Cable (kN)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="form-control" 
                        value={logFormData.cable_tension}
                        onChange={(e) => setLogFormData({...logFormData, cable_tension: e.target.value})}
                        placeholder="Control de arrastre"
                      />
                    </div>
                  )}

                  {logFormData.action === 'despacho' && (
                    <div className="form-group">
                      <label>Destino / Centro de Acopio</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={logFormData.destination}
                        onChange={(e) => setLogFormData({...logFormData, destination: e.target.value})}
                        placeholder="Ej. Aserradero Norte"
                      />
                    </div>
                  )}

                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowLogForm(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="log-timeline">
                  {treeLogs.length === 0 ? (
                    <p className="text-secondary text-sm">Aún no hay registros para este árbol. Solo ha sido marcado.</p>
                  ) : (
                    treeLogs.map((log) => (
                      <div key={log.id} className="log-item">
                        <div className="log-header">
                          <span className="log-action">{log.action}</span>
                          <span className="log-time">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="log-details">
                          <strong>Operador:</strong> {log.operator_name}
                        </div>
                        <div className="mt-1">
                          {log.equipment_used && <span className="log-meta">Equip: {log.equipment_used}</span>}
                          {log.cable_tension && <span className="log-meta">Tensión: {log.cable_tension} kN</span>}
                          {log.destination && <span className="log-meta">Dest: {log.destination}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </Sidebar>
    </div>
  );
}

export default TraceabilityPage;
