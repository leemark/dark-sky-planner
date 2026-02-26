import L from 'leaflet';

let currentMarker = null;

// Custom circular pin icon
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #c8a96e;
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px #c8a96e, 0 2px 8px rgba(0,0,0,0.6);
    cursor: crosshair;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Initialize click-to-pin behavior on the map.
 *
 * @param {L.Map} map - Leaflet map instance
 * @param {function} onPin - callback({ lat, lng })
 */
export function initPin(map, onPin) {
  map.on('click', (e) => {
    const { lat, lng } = e.latlng;
    placePin(map, lat, lng);
    onPin({ lat, lng });
  });
}

/**
 * Place (or move) the marker to the given position.
 */
export function placePin(map, lat, lng) {
  if (currentMarker) {
    currentMarker.setLatLng([lat, lng]);
  } else {
    currentMarker = L.marker([lat, lng], {
      icon: pinIcon,
      zIndexOffset: 1000,
    }).addTo(map);
  }
}
