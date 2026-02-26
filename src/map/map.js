import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

let mapInstance = null;
let lpLayer = null;

/**
 * Initialize the Leaflet map.
 *
 * @returns {L.Map}
 */
export function initMap() {
  if (mapInstance) return mapInstance;

  mapInstance = L.map('map', {
    center: [39.5, -105.0], // Default: Colorado
    zoom: 7,
    zoomControl: true,
  });

  // CartoDB Dark Matter base layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(mapInstance);

  // Light Pollution overlay
  lpLayer = L.tileLayer('https://map1.lightpollutionmap.info/tiles/lp/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.lightpollutionmap.info">lightpollutionmap.info</a>',
    opacity: 0.7,
    maxZoom: 11,
  }).addTo(mapInstance);

  // Opacity slider wiring
  const slider = document.getElementById('lp-opacity');
  if (slider) {
    slider.addEventListener('input', () => {
      lpLayer.setOpacity(slider.value / 100);
    });
  }

  return mapInstance;
}

/**
 * Get the current map instance.
 */
export function getMap() {
  return mapInstance;
}
