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
    el.innerHTML = `
      <div class="panel">
        <div class="panel-title">Moon</div>
        <div class="skeleton" style="width:60%"></div>
        <div class="skeleton" style="width:40%"></div>
        <div class="skeleton" style="width:50%"></div>
      </div>`;
    return;
  }

  const l = nd.lunar;
  const illumPct = Math.round(l.fraction * 100);

  // Show the moonrise/moonset relevant to tonight (sunset → next sunrise).
  // SunCalc returns times for a calendar day (midnight–midnight), so a rise or set
  // after midnight will appear in the *next* day's data instead.
  const solar = nd.solar;
  const nightStart = solar?.sunset?.getTime() ?? 0;
  const nightEnd   = solar?.nextSunrise?.getTime() ?? 0;

  function inNight(t) { return t && nightStart && nightEnd && t.getTime() >= nightStart && t.getTime() <= nightEnd; }

  const tonightRise = inNight(l.moonrise) ? l.moonrise : inNight(l.nextMoonrise) ? l.nextMoonrise : null;
  const tonightSet  = inNight(l.moonset)  ? l.moonset  : inNight(l.nextMoonset)  ? l.nextMoonset  : null;

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
          ? `<span class="quality-badge excellent" title="Moon sets before darkness — won't interfere with shooting">Dark</span>`
          : illumPct > 50
            ? `<span class="quality-badge poor" title="Bright moon (${illumPct}% illuminated) — significantly reduces sky darkness">Bright</span>`
            : `<span class="quality-badge fair" title="Partially illuminated moon — some interference with sky darkness">Partial</span>`
        }
      </div>
      <div class="panel-row">
        <span class="panel-label">Moonrise</span>
        <span class="panel-value">${tonightRise ? formatTime(tonightRise, tz) : '—'}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">Moonset</span>
        <span class="panel-value">${tonightSet ? formatTime(tonightSet, tz) : '—'}</span>
      </div>
    </div>
  `;
}
