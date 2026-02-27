import state from '../state.js';
import { renderSolarPanel } from './solarPanel.js';
import { renderLunarPanel } from './lunarPanel.js';
import { renderMWPanel } from './mwPanel.js';
import { renderTimeline } from './timeline.js';

/**
 * Initialize the sidebar — renders all panels on state change.
 */
export function initSidebar() {
  renderAll();
  state.on('change', renderAll);
  initMobileToggle();
}

function initMobileToggle() {
  const btn = document.getElementById('btn-sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('sidebar-collapsed');
    btn.textContent = collapsed ? '▲' : '▼';
    btn.title = collapsed ? 'Show panel' : 'Hide panel';
  });
}

function renderAll() {
  updateLocationBar();
  renderSolarPanel();
  renderLunarPanel();
  renderMWPanel();
  renderTimeline();
  renderNoPinMessage();
}

function updateLocationBar() {
  const el = document.getElementById('location-name');
  if (!el) return;

  if (state.location?.name) {
    el.textContent = `📍 ${state.location.name}`;
    el.classList.add('has-location');
  } else if (state.location) {
    el.textContent = `📍 ${state.location.lat.toFixed(4)}°, ${state.location.lng.toFixed(4)}°`;
    el.classList.add('has-location');
  } else {
    el.textContent = 'Click map to pin a location';
    el.classList.remove('has-location');
  }
}

function renderNoPinMessage() {
  const panels = document.getElementById('panels');
  if (!panels) return;

  if (!state.location) {
    const existing = panels.querySelector('.no-pin-message');
    if (!existing) {
      const msg = document.createElement('div');
      msg.className = 'no-pin-message';
      msg.innerHTML = `
        <div class="pin-icon">🔭</div>
        <p>Search above or tap the map to pin a location and see astrophotography conditions.</p>
        <ul class="no-pin-features">
          <li>🌙 Moon phase &amp; rise/set times</li>
          <li>🌌 Galactic Center visibility window</li>
          <li>🌅 Sunset, astronomical dusk &amp; dawn</li>
          <li>📅 Monthly quality calendar</li>
        </ul>
        <div class="no-pin-tip">Tip: use ← → arrow keys to navigate dates</div>
      `;
      panels.appendChild(msg);
    }
  } else {
    const existing = panels.querySelector('.no-pin-message');
    if (existing) existing.remove();
  }
}
