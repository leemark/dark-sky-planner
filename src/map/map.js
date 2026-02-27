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

  // Light Pollution overlay — self-hosted VIIRS 2024 tiles (z0–6)
  // Served from leemark/dark-sky-planner-tiles on GitHub Pages
  // maxNativeZoom:6 = Leaflet scales z6 tiles for higher zoom levels (native data res ~2.4km/px)
  lpLayer = L.tileLayer('https://leemark.github.io/dark-sky-planner-tiles/{z}/{x}/{y}.png', {
    attribution: '&copy; Light Pollution Atlas 2024 (VIIRS/NASA)',
    opacity: 0.7,
    maxZoom: 20,
    maxNativeZoom: 6,
  }).addTo(mapInstance);

  // Add crosshair cursor hint until user places first pin
  mapInstance.getContainer().classList.add('map-awaiting-pin');

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
