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

  // Base layers
  const cartoAttr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const esriAttr  = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community';
  const osmAttr   = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: cartoAttr, subdomains: 'abcd', maxZoom: 20 });

  const voyager = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { attribution: cartoAttr, subdomains: 'abcd', maxZoom: 20 });

  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: osmAttr, maxZoom: 19 });

  const osmDark = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: osmAttr, maxZoom: 19, className: 'tiles-osm-dark' });

  const esriTopo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    { attribution: esriAttr, maxZoom: 19 });

  const esriStreet = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    { attribution: esriAttr, maxZoom: 19 });

  osmDark.addTo(mapInstance);

  // Light Pollution overlay — self-hosted VIIRS 2024 tiles (z0–6)
  // Served from leemark/dark-sky-planner-tiles on GitHub Pages
  // maxNativeZoom:6 = Leaflet scales z6 tiles for higher zoom levels (native data res ~2.4km/px)
  lpLayer = L.tileLayer('https://leemark.github.io/dark-sky-planner-tiles/{z}/{x}/{y}.png', {
    attribution: '&copy; Light Pollution Atlas 2024 (VIIRS/NASA)',
    opacity: 0.25,
    maxZoom: 20,
    maxNativeZoom: 6,
    tms: true,
  });

  // Layer control
  const baseLayers = {
    'OSM Dark (Inverted)': osmDark,
    'Dark Matter': darkMatter,
    'Voyager': voyager,
    'OpenStreetMap': osm,
    'World Topo': esriTopo,
    'World Streets': esriStreet,
  };
  const overlays = { 'Light Pollution': lpLayer };
  L.control.layers(baseLayers, overlays, { collapsed: true }).addTo(mapInstance);
  lpLayer.addTo(mapInstance);

  const lpControls = document.getElementById('lp-controls');
  const lpLegend   = document.getElementById('lp-legend');

  mapInstance.on('overlayadd', (e) => {
    if (e.name === 'Light Pollution') {
      if (lpControls) lpControls.style.display = '';
      if (lpLegend)   lpLegend.style.display   = '';
    }
  });
  mapInstance.on('overlayremove', (e) => {
    if (e.name === 'Light Pollution') {
      if (lpControls) lpControls.style.display = 'none';
      if (lpLegend)   lpLegend.style.display   = 'none';
    }
  });

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
