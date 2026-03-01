import L from 'leaflet';
import state from '../state.js';

let arrowLine = null;
let arrowTip = null;

/**
 * Compute a destination lat/lng given an origin, bearing (deg), and distance (km).
 * Uses the flat-Earth approximation — accurate enough for 20 km.
 */
function destinationPoint(lat, lng, azDeg, distKm) {
  const R = 6371;
  const azRad = (azDeg * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const dLat = (distKm / R) * Math.cos(azRad);
  const dLng = (distKm / R) * (Math.sin(azRad) / Math.cos(latRad));
  return [lat + dLat * (180 / Math.PI), lng + dLng * (180 / Math.PI)];
}

function removeArrow() {
  arrowLine?.remove();
  arrowTip?.remove();
  arrowLine = null;
  arrowTip = null;
}

function updateArrow(map) {
  removeArrow();

  const loc = state.location;
  const nd = state.nightData;
  if (!loc || !nd) return;

  const mw = nd.milkyway;
  const sw = nd.shootingWindow;
  if (!sw || mw?.peakAz == null) return;

  const { lat, lng } = loc;
  const endpoint = destinationPoint(lat, lng, mw.peakAz, 20);

  arrowLine = L.polyline([[lat, lng], endpoint], {
    color: '#39c5cf',
    dashArray: '8 6',
    weight: 2,
    opacity: 0.75,
    interactive: false,
  }).addTo(map);

  arrowTip = L.circleMarker(endpoint, {
    radius: 5,
    color: '#fff',
    weight: 1.5,
    fillColor: '#39c5cf',
    fillOpacity: 1,
  }).addTo(map);

  arrowTip.bindTooltip(`GC direction: ${mw.peakAz.toFixed(0)}°`, {
    direction: 'right',
    className: 'gc-arrow-tooltip',
  });
}

/**
 * Subscribe to state changes and keep the GC direction arrow in sync.
 * @param {L.Map} map
 */
export function initGCArrow(map) {
  state.on('change', () => updateArrow(map));
}
