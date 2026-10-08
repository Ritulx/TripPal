import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[220deg]',
});

const RecenterOnChange = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map]);
  return null;
};

// Defined at module scope — NOT inside SearchMap — so React never remounts
// this component on parent re-renders, keeping the click listener stable.
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
};

const SearchMap = ({ center, radiusKm, places, activeId, onMarkerClick, onMapClick }) => {
  if (!center) return null;

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterOnChange center={center} />
      <MapClickHandler onMapClick={onMapClick} />

      <Marker position={[center.lat, center.lng]} icon={userIcon}>
        <Popup>Your search origin</Popup>
      </Marker>

      {/*
        interactive: false is the actual fix — by default Leaflet's Circle
        captures clicks and stops them reaching the map's own click event.
        Since this circle covers most of the viewport at typical search
        radii, it was silently swallowing every click before MapClickHandler
        ever saw it. Setting it non-interactive lets clicks pass through.
      */}
      <Circle
        center={[center.lat, center.lng]}
        radius={radiusKm * 1000}
        pathOptions={{
          color: '#20a868',
          fillColor: '#20a868',
          fillOpacity: 0.07,
          weight: 1.5,
          interactive: false,
        }}
      />

      {places.map((place) => (
        <Marker
          key={place._id}
          position={[place.location.coordinates[1], place.location.coordinates[0]]}
          eventHandlers={{ click: () => onMarkerClick(place._id) }}
        >
          <Popup>
            <div className="text-sm font-medium">{place.name}</div>
            {place.score && (
              <div className="text-xs text-gray-500">Score: {place.score.localScore?.toFixed(2)}</div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default SearchMap;