import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';
import {
  calculatePolygonArea,
  closeRing,
  formatNumber,
  getSubzoneOperationLabel,
  getSubzoneTreeColor,
  getSubzoneTreeName,
  getSubzoneUseLabel,
} from '../utils/helpers';
import './MapComponent.css';

const DEFAULT_CENTER = [4.65, -74.08];
const DEFAULT_ZOOM = 6;

function drawPathOptions(drawMode) {
  return drawMode === 'subzone'
    ? {
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.28,
        weight: 2,
        dashArray: '6 4',
      }
    : {
        color: '#1f7a43',
        fillColor: '#22c55e',
        fillOpacity: 0.28,
        weight: 2,
      };
}

function polygonPayloadFromLayer(layer) {
  const geometry = layer.toGeoJSON().geometry;
  const ring = closeRing(geometry.coordinates[0]);
  const polygon = {
    type: 'Polygon',
    coordinates: [ring],
  };
  const area = calculatePolygonArea(ring);

  return { geometry: polygon, area };
}

function polygonPayloadFromLatLngPoints(points) {
  const ring = closeRing(points.map(([lat, lng]) => [lng, lat]));
  const polygon = {
    type: 'Polygon',
    coordinates: [ring],
  };
  const area = calculatePolygonArea(ring);

  return { geometry: polygon, area };
}

function DrawingControls({
  drawMode,
  drawRequestId = 0,
  clearRequestId = 0,
  onPolygonDraw,
  onPolygonClear,
}) {
  const map = useMap();
  const drawnLayerRef = useRef(null);
  const callbackRef = useRef({ onPolygonDraw, onPolygonClear });

  useEffect(() => {
    callbackRef.current = { onPolygonDraw, onPolygonClear };
  }, [onPolygonDraw, onPolygonClear]);

  useEffect(() => {
    if (!map.pm) return undefined;

    map.pm.addControls({
      position: 'topleft',
      drawPolygon: drawMode !== 'subzone',
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
    });

    map.pm.setPathOptions(drawPathOptions(drawMode));

    function syncLayer(layer) {
      if (!(layer instanceof L.Polygon)) return;
      const payload = polygonPayloadFromLayer(layer);
      callbackRef.current.onPolygonDraw?.(payload);
    }

    function handleCreate(event) {
      const layer = event.layer;

      if (!(layer instanceof L.Polygon)) {
        map.removeLayer(layer);
        return;
      }

      if (drawnLayerRef.current && drawnLayerRef.current !== layer) {
        map.removeLayer(drawnLayerRef.current);
      }

      drawnLayerRef.current = layer;
      layer.on('pm:edit', () => syncLayer(layer));
      layer.on('pm:remove', () => {
        drawnLayerRef.current = null;
        callbackRef.current.onPolygonClear?.();
      });
      syncLayer(layer);
      map.pm.disableDraw('Polygon');
    }

    function handleRemove(event) {
      if (event.layer === drawnLayerRef.current) {
        drawnLayerRef.current = null;
        callbackRef.current.onPolygonClear?.();
      }
    }

    map.on('pm:create', handleCreate);
    map.on('pm:remove', handleRemove);

    return () => {
      map.off('pm:create', handleCreate);
      map.off('pm:remove', handleRemove);
      map.pm.removeControls();
    };
  }, [drawMode, map]);

  useEffect(() => {
    if (!map.pm || drawRequestId === 0) return;

    if (drawnLayerRef.current) {
      map.removeLayer(drawnLayerRef.current);
      drawnLayerRef.current = null;
      callbackRef.current.onPolygonClear?.();
    }

    map.pm.disableDraw('Polygon');
    map.pm.setPathOptions(drawPathOptions(drawMode));

    if (drawMode === 'subzone') {
      return;
    }

    map.pm.enableDraw('Polygon', {
      snappable: true,
      allowSelfIntersection: false,
      pathOptions: drawPathOptions(drawMode),
    });
  }, [drawMode, drawRequestId, map]);

  useEffect(() => {
    if (!map.pm || clearRequestId === 0) return;

    map.pm.disableDraw('Polygon');
    if (drawnLayerRef.current) {
      map.removeLayer(drawnLayerRef.current);
      drawnLayerRef.current = null;
    }
  }, [clearRequestId, map]);

  useEffect(() => {
    const handler = () => {
      if (drawnLayerRef.current) {
        map.removeLayer(drawnLayerRef.current);
        drawnLayerRef.current = null;
      }
      callbackRef.current.onPolygonClear?.();
    };

    map.on('forest:clear-drawing', handler);
    return () => map.off('forest:clear-drawing', handler);
  }, [map]);

  return null;
}

function ManualSubzoneDrawingLayer({ enabled, points, finished, onAddPoint }) {
  useMapEvents({
    click(event) {
      if (!enabled || finished) return;
      onAddPoint([event.latlng.lat, event.latlng.lng]);
    },
  });

  if (points.length === 0) return null;

  const markerOptions = {
    radius: 5,
    color: '#1d4ed8',
    fillColor: '#ffffff',
    fillOpacity: 1,
    weight: 3,
  };

  return (
    <>
      {points.length >= 2 && !finished && (
        <Polyline
          positions={points}
          pathOptions={{
            color: '#2563eb',
            weight: 3,
            dashArray: '8 6',
          }}
        />
      )}
      {points.length >= 3 && (
        <Polygon
          positions={points}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: finished ? 0.34 : 0.18,
            weight: finished ? 3 : 2,
            dashArray: finished ? null : '8 6',
          }}
        />
      )}
      {points.map((point, index) => (
        <CircleMarker
          key={`${point[0]}-${point[1]}-${index}`}
          center={point}
          pathOptions={markerOptions}
        />
      ))}
    </>
  );
}

function SavedZonesLayer({ zones, selectedZone, drawMode, onSelectZone }) {
  const map = useMap();
  const canSelect = drawMode !== 'subzone';

  useEffect(() => {
    if (!selectedZone?.geometry) return;

    const layer = L.geoJSON(selectedZone.geometry);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
    }
  }, [map, selectedZone]);

  return (
    <>
      {zones.map((zone) => (
        <GeoJSON
          key={`${zone.id}-${selectedZone?.id === zone.id ? 'active' : 'idle'}-${canSelect ? 'select' : 'draw'}`}
          data={zone.geometry}
          interactive={canSelect}
          bubblingMouseEvents={canSelect}
          eventHandlers={
            canSelect
              ? {
                  click: () => onSelectZone?.(zone),
                }
              : {}
          }
          style={() => {
            const color = zone.color || '#116b3b';
            const active = selectedZone?.id === zone.id;

            return {
              color,
              fillColor: color,
              fillOpacity:
                drawMode === 'subzone'
                  ? active
                    ? 0.2
                    : 0.08
                  : active
                  ? 0.36
                  : 0.2,
              weight: active ? 4 : 2,
            };
          }}
        />
      ))}
    </>
  );
}

function SavedSubzonesLayer({ subzones, selectedSubzone, drawMode, onSelectSubzone }) {
  const map = useMap();
  const canSelect = drawMode !== 'subzone';

  useEffect(() => {
    if (!selectedSubzone?.geometry) return;

    const layer = L.geoJSON(selectedSubzone.geometry);
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [map, selectedSubzone]);

  return (
    <>
      {subzones.map((subzone) => (
        <GeoJSON
          key={`subzone-${subzone.id}-${selectedSubzone?.id === subzone.id ? 'active' : 'idle'}-${canSelect ? 'select' : 'draw'}`}
          data={subzone.geometry}
          interactive={canSelect}
          bubblingMouseEvents={canSelect}
          eventHandlers={
            canSelect
              ? {
                  click: () => onSelectSubzone?.(subzone),
                }
              : {}
          }
          onEachFeature={(feature, layer) => {
            layer.bindTooltip(
              `${subzone.name} | ${getSubzoneTreeName(subzone)} | ${getSubzoneUseLabel(subzone.use_type)} / ${getSubzoneOperationLabel(subzone.operation_type)} | ${formatNumber(subzone.tree_count, 0)} arboles`,
              { sticky: true }
            );
          }}
          style={() => {
            const color = getSubzoneTreeColor(subzone);
            const active = selectedSubzone?.id === subzone.id;

            return {
              color,
              fillColor: color,
              fillOpacity: drawMode === 'subzone' ? 0.14 : active ? 0.46 : 0.28,
              weight: active ? 4 : 2,
              dashArray: active ? null : '5 4',
            };
          }}
        />
      ))}
    </>
  );
}

function SubzoneLegend({ subzones }) {
  const legendItems = useMemo(() => {
    const bySpecies = new Map();

    subzones.forEach((subzone) => {
      const treeName = getSubzoneTreeName(subzone);
      const current = bySpecies.get(treeName) || {
        treeName,
        color: getSubzoneTreeColor(subzone),
        count: 0,
        subzones: 0,
      };

      current.count += Number(subzone.tree_count || 0);
      current.subzones += 1;
      bySpecies.set(treeName, current);
    });

    return Array.from(bySpecies.values()).sort((a, b) => b.count - a.count);
  }, [subzones]);

  if (legendItems.length === 0) return null;

  return (
    <div className="map-legend">
      <strong>Subzonas por arbol</strong>
      {legendItems.map((item) => (
        <div key={item.treeName} className="map-legend-item">
          <span style={{ backgroundColor: item.color }} />
          <p>
            {item.treeName}
            <small>{formatNumber(item.count, 0)} arboles / {item.subzones} subzonas</small>
          </p>
        </div>
      ))}
    </div>
  );
}

function parseCoordinateSearch(value) {
  const parts = String(value || '')
    .trim()
    .split(/[,\s]+/)
    .map((part) => Number(part));

  if (parts.length < 2 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }

  const [lat, lng] = parts;

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng, label: `${lat}, ${lng}` };
}

function PlaceSearchControl() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  function goToPlace(place, closeAfter = true) {
    const lat = Number(place.lat);
    const lng = Number(place.lng ?? place.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setSelectedPlace({
      lat,
      lng,
      label: place.display_name || place.label || query,
    });
    setMessage('');
    if (closeAfter) {
      setIsOpen(false);
      setResults([]);
    }

    if (Array.isArray(place.boundingbox) && place.boundingbox.length === 4) {
      const [south, north, west, east] = place.boundingbox.map(Number);
      const bounds = L.latLngBounds([south, west], [north, east]);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
        return;
      }
    }

    map.flyTo([lat, lng], 16, { duration: 0.8 });
  }

  async function searchPlace(event) {
    event.preventDefault();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setMessage('Escribe una direccion, finca, vereda o coordenadas.');
      setResults([]);
      return;
    }

    const coordinatePlace = parseCoordinateSearch(cleanQuery);
    if (coordinatePlace) {
      setResults([]);
      goToPlace(coordinatePlace);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'es');
      url.searchParams.set('q', cleanQuery);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('No se pudo buscar el lugar.');
      }

      const payload = await response.json();
      setResults(payload);

      if (payload.length > 0) {
        goToPlace(payload[0], payload.length <= 1);
      } else {
        setMessage('No se encontraron lugares para esa busqueda.');
      }
    } catch (error) {
      setMessage(error.message || 'No se pudo buscar el lugar.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className={isOpen ? 'map-search open' : 'map-search collapsed'}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        {!isOpen ? (
          <button type="button" className="map-search-toggle" onClick={() => setIsOpen(true)}>
            {selectedPlace ? 'Buscar otro lugar' : 'Buscar lugar'}
          </button>
        ) : (
          <div className="map-search-panel">
            <div className="map-search-header">
              <strong>Buscar ubicacion</strong>
              <button type="button" onClick={() => setIsOpen(false)}>
                Minimizar
              </button>
            </div>
            <form onSubmit={searchPlace}>
              <div className="map-search-row">
                <input
                  type="search"
                  value={query}
                  placeholder="Direccion, finca, vereda o 4.65,-74.08"
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button type="submit" disabled={loading}>
                  {loading ? '...' : 'Buscar'}
                </button>
              </div>
            </form>
            {message && <div className="map-search-message">{message}</div>}
            {results.length > 1 && (
              <div className="map-search-results">
                {results.map((place) => (
                  <button
                    key={`${place.place_id}-${place.lat}-${place.lon}`}
                    type="button"
                    onClick={() => goToPlace({ ...place, lng: place.lon })}
                  >
                    {place.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {!isOpen && selectedPlace && (
          <div className="map-search-chip" title={selectedPlace.label}>
            {selectedPlace.label}
          </div>
        )}
      </div>

      {selectedPlace && (
        <CircleMarker
          center={[selectedPlace.lat, selectedPlace.lng]}
          radius={9}
          pathOptions={{
            color: '#0f172a',
            fillColor: '#f59e0b',
            fillOpacity: 0.95,
            weight: 3,
          }}
        />
      )}
    </>
  );
}

function MapActions({ currentPolygon, drawMode, onClear }) {
  const map = useMap();

  return (
    <div className="map-actions">
      <button type="button" onClick={() => map.fire('forest:clear-drawing')}>
        Limpiar dibujo
      </button>
      <button type="button" onClick={onClear}>
        Quitar seleccion
      </button>
      {currentPolygon && (
        <div className="map-area-chip">
          <span>{drawMode === 'subzone' ? 'Subzona' : 'Zona'}</span>
          <strong>{formatNumber(currentPolygon.area.areaHa)} ha</strong>
        </div>
      )}
    </div>
  );
}

function MapComponent({
  currentPolygon,
  onPolygonDraw,
  onPolygonClear,
  zones = [],
  selectedZone = null,
  subzones = [],
  selectedSubzone = null,
  drawMode = 'zone',
  drawRequestId = 0,
  clearRequestId = 0,
  onSelectZone,
  onSelectSubzone,
  onClearSelection,
}) {
  const [manualSubzonePoints, setManualSubzonePoints] = useState([]);
  const [manualSubzoneFinished, setManualSubzoneFinished] = useState(false);
  const safeZones = useMemo(
    () => zones.filter((zone) => zone.geometry?.type === 'Polygon'),
    [zones]
  );
  const safeSubzones = useMemo(
    () => subzones.filter((subzone) => subzone.geometry?.type === 'Polygon'),
    [subzones]
  );
  const manualSubzoneActive = drawMode === 'subzone';

  useEffect(() => {
    if (drawMode !== 'subzone') {
      setManualSubzonePoints([]);
      setManualSubzoneFinished(false);
    }
  }, [drawMode]);

  useEffect(() => {
    if (drawRequestId === 0 || drawMode !== 'subzone') return;
    setManualSubzonePoints([]);
    setManualSubzoneFinished(false);
  }, [drawMode, drawRequestId]);

  useEffect(() => {
    if (clearRequestId === 0) return;
    setManualSubzonePoints([]);
    setManualSubzoneFinished(false);
  }, [clearRequestId]);

  const handleManualSubzonePoint = useCallback((point) => {
    setManualSubzonePoints((current) => [...current, point]);
  }, []);

  const finishManualSubzone = useCallback(() => {
    if (manualSubzonePoints.length < 3) return;
    const payload = polygonPayloadFromLatLngPoints(manualSubzonePoints);
    setManualSubzoneFinished(true);
    onPolygonDraw?.(payload);
  }, [manualSubzonePoints, onPolygonDraw]);

  const undoManualSubzonePoint = useCallback(() => {
    if (manualSubzoneFinished) return;
    setManualSubzonePoints((current) => current.slice(0, -1));
  }, [manualSubzoneFinished]);

  const resetManualSubzone = useCallback(() => {
    setManualSubzonePoints([]);
    setManualSubzoneFinished(false);
    onPolygonClear?.();
  }, [onPolygonClear]);

  return (
    <div className="map-shell">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map">
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa estandar OSM">
            <TileLayer
              attribution="OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelital Esri">
            <TileLayer
              attribution="Tiles Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <SavedZonesLayer
          zones={safeZones}
          selectedZone={selectedZone}
          drawMode={drawMode}
          onSelectZone={onSelectZone}
        />
        <SavedSubzonesLayer
          subzones={safeSubzones}
          selectedSubzone={selectedSubzone}
          drawMode={drawMode}
          onSelectSubzone={onSelectSubzone}
        />
        <DrawingControls
          drawMode={drawMode}
          drawRequestId={drawRequestId}
          clearRequestId={clearRequestId}
          onPolygonDraw={onPolygonDraw}
          onPolygonClear={onPolygonClear}
        />
        <ManualSubzoneDrawingLayer
          enabled={manualSubzoneActive && !manualSubzoneFinished}
          points={manualSubzonePoints}
          finished={manualSubzoneFinished}
          onAddPoint={handleManualSubzonePoint}
        />
        <MapActions currentPolygon={currentPolygon} drawMode={drawMode} onClear={onClearSelection} />
        <PlaceSearchControl />
      </MapContainer>

      <SubzoneLegend subzones={safeSubzones} />
      {drawMode === 'subzone' && (
        <>
          <div className="draw-mode-banner">
            Haz clic dentro de la zona para marcar puntos. Con 3 puntos o mas, finaliza la subzona.
          </div>
          <div className="manual-draw-panel">
            <strong>Dibujo de subzona</strong>
            <span>
              {manualSubzoneFinished
                ? 'Poligono listo para guardar'
                : `${manualSubzonePoints.length} puntos marcados`}
            </span>
            <div className="manual-draw-actions">
              <button
                type="button"
                onClick={finishManualSubzone}
                disabled={manualSubzonePoints.length < 3 || manualSubzoneFinished}
              >
                Finalizar subzona
              </button>
              <button
                type="button"
                onClick={undoManualSubzonePoint}
                disabled={manualSubzonePoints.length === 0 || manualSubzoneFinished}
              >
                Deshacer punto
              </button>
              <button
                type="button"
                onClick={resetManualSubzone}
                disabled={manualSubzonePoints.length === 0 && !currentPolygon}
              >
                Reiniciar
              </button>
            </div>
          </div>
        </>
      )}
      <div className="map-note">
        {selectedZone
          ? `Zona seleccionada: ${selectedZone.name}. Las subzonas se pintan por especie sembrada.`
          : 'Dibuja o selecciona una zona para crear subzonas internas.'}
      </div>
    </div>
  );
}

export default MapComponent;
