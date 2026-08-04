import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet image loader fix for React bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Synchronize map center when external coordinates change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== 0) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Click listener to register GPS markers on layout
function MapEventsHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      // Return coordinates in GeoJSON [longitude, latitude] standard format
      onLocationSelect([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
}

const MapPicker = ({ location, onLocationSelect }) => {
  // Center coordinates. Fallback default to center-city coords if empty
  const defaultCenter = location && location[0] !== 0 
    ? [location[1], location[0]] 
    : [12.9716, 77.5946]; 

  return (
    <div className="w-full h-[280px] rounded-xl overflow-hidden border border-slate-800 shadow-inner relative z-10">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', background: '#0b0f19' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" // Premium dark-themed map layer
        />
        {location && location[0] !== 0 && (
          <Marker position={[location[1], location[0]]} />
        )}
        <MapEventsHandler onLocationSelect={onLocationSelect} />
        <ChangeView center={defaultCenter} zoom={14} />
      </MapContainer>
      <div className="absolute bottom-2 right-2 bg-slate-950/90 backdrop-blur border border-slate-800 rounded py-1 px-2 text-[10px] text-slate-400 font-medium z-[1000]">
        Click map to pinpoint location
      </div>
    </div>
  );
};

export default MapPicker;
