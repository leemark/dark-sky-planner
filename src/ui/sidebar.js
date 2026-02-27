import state from '../state.js';
import { scoreNight } from '../astro/scoring.js';
import { getTimezoneAbbr } from '../utils/time.js';
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
  renderErrorBanner();
  renderSolarPanel();
  renderLunarPanel();
  renderMWPanel();
  renderTimeline();
  renderNoPinMessage();
}

function updateLocationBar() {
  const el = document.getElementById('location-name');
  const bar = document.getElementById('location-bar');
  if (!el || !bar) return;

  // Remove existing TZ line (re-inserted below if location set)
  bar.querySelector('.location-tz')?.remove();

  if (state.location) {
    const locText = state.location.name
      ? `📍 ${state.location.name}`
      : `📍 ${state.location.lat.toFixed(4)}°, ${state.location.lng.toFixed(4)}°`;

    if (state.nightData) {
      const quality = scoreNight(state.nightData);
      const label = quality.charAt(0).toUpperCase() + quality.slice(1);
      el.innerHTML = `${locText} <span class="quality-badge ${quality}">${label}</span>`;
    } else {
      el.textContent = locText;
    }
    el.classList.add('has-location');

    const tzDiv = document.createElement('div');
    tzDiv.className = 'location-tz';
    tzDiv.textContent = `All times in ${getTimezoneAbbr(state.timezone)}`;
    bar.appendChild(tzDiv);
  } else {
    el.textContent = 'Search or tap map to pin a location';
    el.classList.remove('has-location');
  }
}

function renderErrorBanner() {
  const panels = document.getElementById('panels');
  const existing = panels?.querySelector('.compute-error-banner');
  if (state.computeError) {
    if (!existing) {
      const banner = document.createElement('div');
      banner.className = 'compute-error-banner';
      banner.textContent = 'Could not calculate conditions for this location or date.';
      panels.prepend(banner);
    }
  } else {
    existing?.remove();
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
