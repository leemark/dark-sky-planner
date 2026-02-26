import state from '../state.js';
import { formatTime, formatDuration } from '../utils/time.js';

/**
 * Render the Solar panel into #panel-solar.
 */
export function renderSolarPanel() {
  const el = document.getElementById('panel-solar');
  if (!el) return;

  if (!state.location) {
    el.innerHTML = '';
    return;
  }

  const nd = state.nightData;
  const tz = state.timezone;

  if (!nd || !nd.solar) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel-title">Sun</div>
        <div class="skeleton" style="width:70%"></div>
        <div class="skeleton" style="width:55%"></div>
        <div class="skeleton" style="width:65%"></div>
        <div class="skeleton" style="width:50%"></div>
      </div>`;
    return;
  }

  const s = nd.solar;
  const darknessMin = nd.darknessWindow
    ? (nd.darknessWindow.end - nd.darknessWindow.start) / 60000
    : null;

  el.innerHTML = `
    <div class="panel">
      <div class="panel-title">Sun</div>
      <div class="panel-row">
        <span class="panel-label">Sunrise</span>
        <span class="panel-value">${formatTime(s.sunrise, tz)}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Sunset</span>
        <span class="panel-value">${formatTime(s.sunset, tz)}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Astro Dusk</span>
        <span class="panel-value">${formatTime(s.astronomicalDusk, tz)}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Astro Dawn</span>
        <span class="panel-value">${formatTime(s.astronomicalDawn, tz)}</span>
      </div>
      ${darknessMin !== null ? `
      <div class="panel-row">
        <span class="panel-label">Dark Window</span>
        <span class="panel-value">${formatDuration(darknessMin)}</span>
      </div>` : `
      <div class="panel-row">
        <span class="panel-label">Dark Window</span>
        <span class="panel-value" style="color:var(--text-muted)">None (high latitude)</span>
      </div>`}
    </div>
  `;
}
