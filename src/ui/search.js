import { forwardGeocode } from '../map/geocoder.js';
import { placePin } from '../map/pin.js';

let debounceTimer = null;

export function initSearch(map, onSelect) {
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 2) { hideResults(results); return; }
    debounceTimer = setTimeout(() => runSearch(query, map, results, input, onSelect), 350);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideResults(results); input.blur(); }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-container')) hideResults(results);
  });
}

async function runSearch(query, map, results, input, onSelect) {
  results.innerHTML = '<li class="search-loading">Searching…</li>';
  results.classList.remove('hidden');
  try {
    const hits = await forwardGeocode(query);
    if (!hits.length) {
      results.innerHTML = '<li class="search-no-results">No results found</li>';
      return;
    }
    results.innerHTML = '';
    hits.forEach((hit) => {
      const li = document.createElement('li');
      li.textContent = hit.display_name;
      li.addEventListener('click', () => {
        const lat = parseFloat(hit.lat);
        const lng = parseFloat(hit.lon);
        map.setView([lat, lng], 10, { animate: true });
        placePin(map, lat, lng);
        input.value = '';
        hideResults(results);
        onSelect({ lat, lng });
      });
      results.appendChild(li);
    });
  } catch {
    results.innerHTML = '<li class="search-no-results">Search unavailable</li>';
  }
}

function hideResults(results) {
  results.classList.add('hidden');
  results.innerHTML = '';
}
