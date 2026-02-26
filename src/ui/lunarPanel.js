import state from '../state.js';
import { formatTime } from '../utils/time.js';

/**
 * Render the Lunar panel into #panel-lunar.
 */
export function renderLunarPanel() {
  const el = document.getElementById('panel-lunar');
  if (!el) return;

  if (!state.location) {
    el.innerHTML = '';
    return;
  }

  const nd = state.nightData;
  const tz = state.timezone;

  if (!nd || !nd.lunar) {
    el.innerHTML = `<div class="panel"><div class="panel-title">Moon</div><div class="panel-empty">Computing…</div></div>`;
    return;
  }

  const l = nd.lunar;
  const illumPct = Math.round(l.fraction * 100);

  el.innerHTML = `
    <div class="panel">
      <div class="panel-title">Moon</div>
      <div class="lunar-header">
        <div class="moon-phase-icon">${l.phaseIcon}</div>
        <div class="lunar-summary">
          <div class="phase-name">${l.phaseName}</div>
          <div class="illumination">${illumPct}% illuminated</div>
        </div>
        ${l.isNoInterference
          ? `<span class="quality-badge excellent" title="Moon won't interfere">Dark</span>`
          : illumPct > 50
            ? `<span class="quality-badge poor" title="Bright moon">Bright</span>`
            : `<span class="quality-badge fair" title="Partial moon">Partial</span>`
        }
      </div>
      <div class="panel-row">
        <span class="panel-label">Moonrise</span>
        <span class="panel-value">${l.moonrise ? formatTime(l.moonrise, tz) : '—'}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Moonset</span>
        <span class="panel-value">${l.moonset ? formatTime(l.moonset, tz) : '—'}</span>
      </div>
    </div>
  `;
}
