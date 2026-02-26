import state from '../state.js';
import { formatTime, formatDuration } from '../utils/time.js';
import { scoreNight, QUALITY } from '../astro/scoring.js';

const OUT_OF_SEASON_MONTHS = [11, 12, 1]; // Nov, Dec, Jan (month numbers)

function isOutOfSeason(isoDate) {
  const month = parseInt(isoDate.split('-')[1], 10);
  return OUT_OF_SEASON_MONTHS.includes(month);
}

/**
 * Render the Milky Way panel into #panel-mw.
 */
export function renderMWPanel() {
  const el = document.getElementById('panel-mw');
  if (!el) return;

  if (!state.location) {
    el.innerHTML = '';
    return;
  }

  const nd = state.nightData;
  const tz = state.timezone;

  if (!nd) {
    el.innerHTML = `<div class="panel"><div class="panel-title">Milky Way</div><div class="panel-empty">Computing…</div></div>`;
    return;
  }

  const quality = scoreNight(nd);
  const mw = nd.milkyway;
  const sw = nd.shootingWindow;

  // Build quality badge HTML
  const badgeHtml = `<span class="quality-badge ${quality}">${quality.charAt(0).toUpperCase() + quality.slice(1)}</span>`;

  // Out of season check (Nov–Jan for Northern hemisphere)
  if (isOutOfSeason(state.date) && (!mw || mw.neverVisible)) {
    el.innerHTML = `
      <div class="panel">
        <div class="panel-title">Milky Way ${badgeHtml}</div>
        <div class="mw-out-of-season">
          🌌 Milky Way core is out of season (Nov–Jan).<br>
          The galactic center is below the horizon during dark hours.
        </div>
      </div>
    `;
    return;
  }

  // No shooting window
  if (!sw) {
    const reason = getReason(nd);
    el.innerHTML = `
      <div class="panel">
        <div class="panel-title">Milky Way ${badgeHtml}</div>
        <div class="mw-out-of-season">
          No shooting window tonight.<br>
          <span style="color:var(--text-muted);font-size:11px">${reason}</span>
        </div>
        ${mw && mw.peakAlt !== null ? `
        <div class="panel-row" style="margin-top:8px">
          <span class="panel-label">GC Peak Altitude</span>
          <span class="panel-value">${mw.peakAlt.toFixed(1)}°</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">GC Peak Azimuth</span>
          <span class="panel-value">${mw.peakAz.toFixed(0)}° ${azToCompass(mw.peakAz)}</span>
        </div>
        <div class="panel-row">
          <span class="panel-label">GC Peak Time</span>
          <span class="panel-value">${formatTime(mw.peakTime, tz)}</span>
        </div>
        ` : ''}
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div class="panel">
      <div class="panel-title">Milky Way ${badgeHtml}</div>
      <div class="mw-window-block">
        <div class="mw-window-title">Shooting Window</div>
        <div class="mw-window-time">${formatTime(sw.start, tz)} – ${formatTime(sw.end, tz)}</div>
        <div class="mw-window-duration">${formatDuration(sw.durationMinutes)} of optimal darkness</div>
      </div>
      ${mw && mw.peakAlt !== null ? `
      <div class="panel-row">
        <span class="panel-label">GC Peak Altitude</span>
        <span class="panel-value">${mw.peakAlt.toFixed(1)}°</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">GC Peak Azimuth</span>
        <span class="panel-value">${mw.peakAz.toFixed(0)}° ${azToCompass(mw.peakAz)}</span>
      </div>
      <div class="panel-row">
        <span class="panel-label">GC Peak Time</span>
        <span class="panel-value">${formatTime(mw.peakTime, tz)}</span>
      </div>
      ` : ''}
    </div>
  `;
}

function getReason(nd) {
  if (!nd.darknessWindow) return 'No astronomical darkness at this location/date.';
  if (!nd.lunar?.moonDownWindow) return 'Moon is up all night.';
  if (!nd.milkyway?.window) return 'Milky Way core stays below 15° all night.';
  return 'Conditions overlap insufficiently.';
}

function azToCompass(az) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(az / 22.5) % 16];
}
