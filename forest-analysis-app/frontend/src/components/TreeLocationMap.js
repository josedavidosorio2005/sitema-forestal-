import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatNumber } from '../utils/helpers';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS = {
  Marcado: '#3b82f6',
  Derribado: '#f59e0b',
  Troceado: '#8b5cf6',
  Despachado: '#22c55e',
};

const DEFAULT_CENTER = [4.65, -74.08];
const DEFAULT_ZOOM = 6;

function FlyToZone({ geometry }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    try {
      const layer = L.geoJSON(geometry);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 17, duration: 1 });
      }
    } catch { /* ignore bad geometry */ }
  }, [map, geometry]);
  return null;
}

function ClickToPlace({ enabled, onPlace }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPlace([e.latlng.lng, e.latlng.lat]); // [lng, lat] for GeoJSON
    },
  });
  return null;
}

function TreeLocationMap({
  zoneGeometry = null,
  subzoneGeometry = null,
  trees = [],
  selectedTree = null,
  placingMode = false,
  placedCoords = null,
  onLocationSelect,
  onSelectTree,
  style = {},
}) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const mapRef = useRef(null);

  // Which geometry to focus on (subzone > zone)
  const focusGeometry = subzoneGeometry || zoneGeometry;

  const safeTreeMarkers = useMemo(() => {
    return trees.filter(
      (t) => t.geometry && t.geometry.type === 'Point' && Array.isArray(t.geometry.coordinates)
    );
  }, [trees]);

  function handleUseGps() {
    if (!navigator.geolocation) {
      setGpsError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        onLocationSelect?.(coords);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('No se pudo obtener la ubicación. Haz clic en el mapa.');
        setGpsLoading(false);
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div style={{ position: 'relative', ...style }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        ref={mapRef}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Mapa OSM">
            <TileLayer
              attribution="OSM"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelital">
            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FlyToZone geometry={focusGeometry} />
        <ClickToPlace enabled={placingMode} onPlace={onLocationSelect} />

        {/* Zone polygon */}
        {zoneGeometry && (
          <GeoJSON
            key={`zone-${JSON.stringify(zoneGeometry).slice(0, 60)}`}
            data={zoneGeometry}
            style={{
              color: '#116b3b',
              fillColor: '#22c55e',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* Subzone polygon */}
        {subzoneGeometry && (
          <GeoJSON
            key={`subzone-${JSON.stringify(subzoneGeometry).slice(0, 60)}`}
            data={subzoneGeometry}
            style={{
              color: '#2563eb',
              fillColor: '#60a5fa',
              fillOpacity: 0.18,
              weight: 2,
              dashArray: '6 4',
            }}
          />
        )}

        {/* Existing trees */}
        {safeTreeMarkers.map((tree) => {
          const [lng, lat] = tree.geometry.coordinates;
          const isSelected = selectedTree?.id === tree.id;
          return (
            <CircleMarker
              key={tree.id}
              center={[lat, lng]}
              radius={isSelected ? 9 : 6}
              pathOptions={{
                color: isSelected ? '#ffffff' : STATUS_COLORS[tree.status] || '#64748b',
                fillColor: STATUS_COLORS[tree.status] || '#64748b',
                fillOpacity: isSelected ? 1 : 0.8,
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onSelectTree?.(tree),
              }}
            >
              <Tooltip>
                <strong>{tree.qr_tag}</strong> — {tree.status}
                <br />
                {tree.species_common_name || 'Sin especie'} · Vol: {formatNumber(tree.estimated_volume)} m³
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Placed/new tree marker */}
        {placedCoords && (
          <Marker position={[placedCoords[1], placedCoords[0]]}>
            <Tooltip permanent direction="top" offset={[0, -30]}>
              📍 Nuevo árbol aquí
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* GPS + instructions overlay */}
      {placingMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              backdropFilter: 'blur(4px)',
            }}
          >
            {placedCoords
              ? `📍 Coordenadas: ${placedCoords[1].toFixed(6)}, ${placedCoords[0].toFixed(6)}`
              : '👆 Haz clic en el mapa para ubicar el árbol'}
          </div>
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: gpsLoading ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            {gpsLoading ? '⏳ Obteniendo...' : '📡 Usar mi GPS'}
          </button>
        </div>
      )}
      {gpsError && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          {gpsError}
        </div>
      )}
    </div>
  );
}

export default TreeLocationMap;
