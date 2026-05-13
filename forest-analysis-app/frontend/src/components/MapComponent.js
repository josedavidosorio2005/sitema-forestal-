import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { GeoJSON, LayersControl, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';
import { calculatePolygonArea, closeRing, formatNumber } from '../utils/helpers';
import './MapComponent.css';

const DEFAULT_CENTER = [4.65, -74.08];
const DEFAULT_ZOOM = 6;

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

function DrawingControls({ onPolygonDraw, onPolygonClear }) {
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
      drawMarker: false,
      drawCircle: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawText: false,
      cutPolygon: false,
      rotateMode: false,
    });

    map.pm.setPathOptions({
      color: '#1f7a43',
      fillColor: '#22c55e',
      fillOpacity: 0.28,
      weight: 2,
    });

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
  }, [map]);

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

function SavedZonesLayer({ zones, selectedZone, onSelectZone }) {
  const map = useMap();

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
          key={`${zone.id}-${selectedZone?.id === zone.id ? 'active' : 'idle'}`}
          data={zone.geometry}
          eventHandlers={{
            click: () => onSelectZone?.(zone),
          }}
          style={{
            color: selectedZone?.id === zone.id ? '#f59e0b' : '#116b3b',
            fillColor: selectedZone?.id === zone.id ? '#fbbf24' : '#22c55e',
            fillOpacity: selectedZone?.id === zone.id ? 0.34 : 0.18,
            weight: selectedZone?.id === zone.id ? 3 : 2,
          }}
        />
      ))}
    </>
  );
}

function MapActions({ currentPolygon, onClear }) {
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
          <span>{formatNumber(currentPolygon.area.areaM2)} m2</span>
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
  onSelectZone,
  onClearSelection,
}) {
  const safeZones = useMemo(
    () => zones.filter((zone) => zone.geometry?.type === 'Polygon'),
    [zones]
  );

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

        <SavedZonesLayer zones={safeZones} selectedZone={selectedZone} onSelectZone={onSelectZone} />
        <DrawingControls onPolygonDraw={onPolygonDraw} onPolygonClear={onPolygonClear} />
        <MapActions currentPolygon={currentPolygon} onClear={onClearSelection} />
      </MapContainer>

      <div className="map-note">
        Dibuja un poligono. El calculo de cobertura vegetal es una simulacion inicial, no una
        identificacion exacta de especies.
      </div>
    </div>
  );
}

export default MapComponent;
