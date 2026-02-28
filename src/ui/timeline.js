import state from '../state.js';
import { formatTime } from '../utils/time.js';

const SVG_W = 348;
const SVG_H = 72;
const BAND_H = 28;
const BAND_Y = 12;

/**
 * Render the night timeline SVG into #timeline-container.
 */
export function renderTimeline() {
  const el = document.getElementById('timeline-container');
  if (!el) return;

  if (!state.location || !state.nightData) {
    el.innerHTML = '';
    return;
  }

  const nd = state.nightData;
  const tz = state.timezone;
  const s = nd.solar;

  if (!s) {
    el.innerHTML = '';
    return;
  }

  // Timeline spans sunset → next sunrise
  const tStart = s.sunset?.getTime?.() || 0;
  const tEnd = s.nextSunrise?.getTime?.() || 0;

  if (!tStart || !tEnd || tEnd <= tStart) {
    el.innerHTML = '';
    return;
  }

  const span = tEnd - tStart;

  function toPx(date) {
    if (!date) return 0;
    return Math.max(0, Math.min(SVG_W, ((date.getTime() - tStart) / span) * SVG_W));
  }

  function toTime(px) {
    return new Date(tStart + (px / SVG_W) * span);
  }

  // Build SVG
  const svgParts = [];

  // Background (night/day gradient)
  svgParts.push(`<rect x="0" y="${BAND_Y}" width="${SVG_W}" height="${BAND_H}" fill="#020710"/>`);

  // Twilight bands
  const twilightBands = [
    { end: s.civilDusk,          color: '#1a3a5c' }, // civil (day side)
    { end: s.nauticalDusk,       color: '#0f2340' }, // nautical
    { end: s.astronomicalDusk,   color: '#050e1a' }, // astronomical
  ];

  // Before civil dusk (still day)
  const civilDuskPx = toPx(s.civilDusk);
  if (civilDuskPx > 0) {
    svgParts.push(`<rect x="0" y="${BAND_Y}" width="${civilDuskPx}" height="${BAND_H}" fill="#1a3a5c"/>`);
  }

  // Civil → Nautical
  const nauticalDuskPx = toPx(s.nauticalDusk);
  if (nauticalDuskPx > civilDuskPx) {
    svgParts.push(`<rect x="${civilDuskPx}" y="${BAND_Y}" width="${nauticalDuskPx - civilDuskPx}" height="${BAND_H}" fill="#0f2340"/>`);
  }

  // Nautical → Astronomical
  const astroDuskPx = toPx(s.astronomicalDusk);
  if (astroDuskPx > nauticalDuskPx) {
    svgParts.push(`<rect x="${nauticalDuskPx}" y="${BAND_Y}" width="${astroDuskPx - nauticalDuskPx}" height="${BAND_H}" fill="#050e1a"/>`);
  }

  // Dawn side (mirror)
  const astroDawnPx = toPx(s.astronomicalDawn);
  const nauticalDawnPx = toPx(s.nauticalDawn);
  const civilDawnPx = toPx(s.civilDawn);

  if (astroDawnPx < SVG_W) {
    svgParts.push(`<rect x="${astroDawnPx}" y="${BAND_Y}" width="${Math.min(nauticalDawnPx, SVG_W) - astroDawnPx}" height="${BAND_H}" fill="#050e1a"/>`);
  }
  if (nauticalDawnPx < SVG_W) {
    svgParts.push(`<rect x="${nauticalDawnPx}" y="${BAND_Y}" width="${Math.min(civilDawnPx, SVG_W) - nauticalDawnPx}" height="${BAND_H}" fill="#0f2340"/>`);
  }
  if (civilDawnPx < SVG_W) {
    svgParts.push(`<rect x="${civilDawnPx}" y="${BAND_Y}" width="${SVG_W - civilDawnPx}" height="${BAND_H}" fill="#1a3a5c"/>`);
  }

  // Moon strip
  if (nd.lunar && !nd.lunar.isNoInterference) {
    const { moonrise, moonset, nextMoonrise, nextMoonset, fraction } = nd.lunar;
    const moonOpacity = Math.max(0.15, fraction * 0.7);

    drawMoonStrip(svgParts, tStart, tEnd, moonrise, moonset, nextMoonrise, nextMoonset, moonOpacity, toPx, SVG_W, BAND_Y, BAND_H);
  }

  // MW window strip (amber)
  if (nd.milkyway?.window) {
    const mwStartPx = toPx(nd.milkyway.window.start);
    const mwEndPx = toPx(nd.milkyway.window.end);
    if (mwEndPx > mwStartPx) {
      svgParts.push(`<rect x="${mwStartPx}" y="${BAND_Y + BAND_H * 0.6}" width="${mwEndPx - mwStartPx}" height="${BAND_H * 0.2}" fill="#f59e0b" opacity="0.7" rx="2"/>`);
    }
  }

  // Shooting window (cyan highlight)
  if (nd.shootingWindow) {
    const swStartPx = toPx(nd.shootingWindow.start);
    const swEndPx = toPx(nd.shootingWindow.end);
    if (swEndPx > swStartPx) {
      svgParts.push(`<rect x="${swStartPx}" y="${BAND_Y}" width="${swEndPx - swStartPx}" height="${BAND_H}" fill="#39c5cf" opacity="0.25" rx="2"/>`);
      svgParts.push(`<rect x="${swStartPx}" y="${BAND_Y + BAND_H - 4}" width="${swEndPx - swStartPx}" height="4" fill="#39c5cf" opacity="0.9" rx="1"/>`);
    }
  }

  // Time tick marks
  const tickTimes = getHourTicks(tStart, tEnd, tz);
  const tickLabels = [];
  for (const tick of tickTimes) {
    const px = toPx(tick.date);
    svgParts.push(`<line x1="${px}" y1="${BAND_Y + BAND_H}" x2="${px}" y2="${BAND_Y + BAND_H + 4}" stroke="rgba(139,148,158,0.5)" stroke-width="1"/>`);
    tickLabels.push({ px, label: tick.label });
  }

  // Assemble SVG
  const svgContent = `
    <svg id="timeline-svg" viewBox="0 0 ${SVG_W} ${SVG_H}" xmlns="http://www.w3.org/2000/svg"
         style="cursor:crosshair; border-radius:4px; overflow:visible;">
      <defs>
        <clipPath id="band-clip">
          <rect x="0" y="${BAND_Y}" width="${SVG_W}" height="${BAND_H}" rx="4"/>
        </clipPath>
      </defs>
      <g clip-path="url(#band-clip)">
        ${svgParts.join('\n        ')}
      </g>
      <!-- Tick lines outside clip -->
      ${tickTimes.map(tick => {
        const px = toPx(tick.date);
        return `<line x1="${px}" y1="${BAND_Y + BAND_H}" x2="${px}" y2="${BAND_Y + BAND_H + 5}" stroke="rgba(139,148,158,0.5)" stroke-width="1"/>`;
      }).join('')}
      <!-- Legend labels -->
      <text x="2" y="${BAND_Y - 2}" font-size="8" fill="rgba(139,148,158,0.6)">Sunset</text>
      <text x="${SVG_W - 2}" y="${BAND_Y - 2}" font-size="8" fill="rgba(139,148,158,0.6)" text-anchor="end">Sunrise</text>
      ${nd.shootingWindow ? `
      <text x="${(toPx(nd.shootingWindow.start) + toPx(nd.shootingWindow.end)) / 2}" y="${SVG_H - 2}"
            font-size="8" fill="#39c5cf" text-anchor="middle">Shooting Window</text>
      ` : ''}
    </svg>
  `;

  // Tooltip div
  const tooltipHtml = `<div class="timeline-tooltip" id="timeline-tip"></div>`;

  // Time labels row
  const labelsHtml = `
    <div class="timeline-labels">
      <span class="timeline-label">${formatTime(s.sunset, tz)}</span>
      <span class="timeline-label">${formatTime(s.nadir, tz)}</span>
      <span class="timeline-label">${formatTime(s.nextSunrise, tz)}</span>
    </div>
  `;

  const legendHtml = `
    <div class="timeline-legend">
      <span class="tl-item"><span class="tl-swatch tl-shooting"></span>Shooting window</span>
      <span class="tl-item"><span class="tl-swatch tl-mw"></span>MW visible</span>
      <span class="tl-item"><span class="tl-swatch tl-moon"></span>Moon up</span>
      <span class="tl-item"><span class="tl-swatch tl-dark"></span>Dark sky</span>
    </div>
  `;

  el.innerHTML = `
    <div class="timeline-title">Night Timeline</div>
    <div class="timeline-svg-wrap">
      ${svgContent}
      ${tooltipHtml}
    </div>
    ${labelsHtml}
    ${legendHtml}
  `;

  // Wire tooltip
  const svgEl = el.querySelector('#timeline-svg');
  const tip = el.querySelector('#timeline-tip');
  if (svgEl && tip) {
    svgEl.addEventListener('mousemove', (e) => {
      const rect = svgEl.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const hoveredTime = toTime(px);
      const timeStr = formatTime(hoveredTime, tz);
      const conditions = getConditionsAt(hoveredTime, nd);

      tip.textContent = `${timeStr} · ${conditions}`;
      tip.style.display = 'block';
      const rawLeft = e.clientX - rect.left;
      tip.style.left = `${Math.min(rawLeft, rect.width - tip.offsetWidth - 2)}px`;
      tip.style.top = `${BAND_Y - 28}px`;
    });

    svgEl.addEventListener('mouseleave', () => {
      tip.style.display = 'none';
    });

    svgEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = svgEl.getBoundingClientRect();
      const px = ((touch.clientX - rect.left) / rect.width) * SVG_W;
      const hoveredTime = toTime(px);
      tip.textContent = `${formatTime(hoveredTime, tz)} · ${getConditionsAt(hoveredTime, nd)}`;
      tip.style.display = 'block';
      const rawLeft = touch.clientX - rect.left;
      tip.style.left = `${Math.min(rawLeft, rect.width - tip.offsetWidth - 2)}px`;
      tip.style.top = `${BAND_Y - 28}px`;
    }, { passive: false });

    svgEl.addEventListener('touchend', () => {
      tip.style.display = 'none';
    });
  }
}

function drawMoonStrip(parts, tStart, tEnd, moonrise, moonset, nextMoonrise, nextMoonset, opacity, toPx, W, BAND_Y, BAND_H) {
  const color = `rgba(212,197,160,${opacity})`;
  const y = BAND_Y + 2;
  const h = BAND_H - 4;

  // Collect all rise/set events that fall within [tStart, tEnd], sorted by time.
  // A "rise" event means the moon goes UP; a "set" event means it goes DOWN.
  const events = [];

  function addIf(time, type) {
    if (time) {
      const ms = time.getTime();
      if (ms >= tStart && ms <= tEnd) events.push({ ms, type });
    }
  }

  addIf(moonrise,      'rise');
  addIf(moonset,       'set');
  addIf(nextMoonrise,  'rise');
  addIf(nextMoonset,   'set');

  events.sort((a, b) => a.ms - b.ms);

  // Determine if the moon is already up at tStart:
  // It's up if the most recent event before tStart was a rise (or there's no
  // preceding set). We can infer this: if the first event in our window is a
  // "set", the moon must have been up at tStart.
  let moonUp = events.length > 0 && events[0].type === 'set';

  // Walk through the night, building moon-up intervals.
  const intervals = [];
  let upSince = moonUp ? tStart : null;

  for (const ev of events) {
    if (ev.type === 'rise' && upSince === null) {
      upSince = ev.ms;
    } else if (ev.type === 'set' && upSince !== null) {
      intervals.push([upSince, ev.ms]);
      upSince = null;
    }
  }
  // If still up at the end of the window, close the interval
  if (upSince !== null) {
    intervals.push([upSince, tEnd]);
  }

  for (const [start, end] of intervals) {
    const startPx = toPx(new Date(start));
    const endPx   = toPx(new Date(end));
    if (endPx > startPx) {
      parts.push(`<rect x="${startPx}" y="${y}" width="${endPx - startPx}" height="${h}" fill="${color}"/>`);
    }
  }
}

function getHourTicks(tStart, tEnd, tz) {
  const ticks = [];
  const startDate = new Date(tStart);
  // Round up to next hour
  const firstHour = new Date(Math.ceil(tStart / 3600000) * 3600000);

  for (let t = firstHour.getTime(); t < tEnd; t += 3600000) {
    const d = new Date(t);
    const label = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: true,
    }).format(d);
    ticks.push({ date: d, label });
  }
  return ticks;
}

function isMoonUp(t, lunar) {
  // Collect all rise/set events and sort them to determine moon state at time t.
  const events = [];
  if (lunar.moonrise)     events.push({ ms: lunar.moonrise.getTime(),     type: 'rise' });
  if (lunar.moonset)      events.push({ ms: lunar.moonset.getTime(),      type: 'set' });
  if (lunar.nextMoonrise) events.push({ ms: lunar.nextMoonrise.getTime(), type: 'rise' });
  if (lunar.nextMoonset)  events.push({ ms: lunar.nextMoonset.getTime(),  type: 'set' });
  events.sort((a, b) => a.ms - b.ms);

  // Walk events up to time t; the last event before t tells us current state.
  // Start by assuming the moon is up if the first event is a set.
  let up = events.length > 0 && events[0].ms > t ? events[0].type === 'set'
         : false;
  for (const ev of events) {
    if (ev.ms > t) break;
    up = ev.type === 'rise';
  }
  return up;
}

function getConditionsAt(time, nd) {
  const parts = [];
  const t = time.getTime();

  if (nd.darknessWindow) {
    const { start, end } = nd.darknessWindow;
    if (t >= start.getTime() && t <= end.getTime()) {
      parts.push('Dark');
    } else if (nd.solar?.civilDusk && t >= nd.solar.sunset.getTime() && t < nd.solar.civilDusk.getTime()) {
      parts.push('Civil twilight');
    } else {
      parts.push('Twilight');
    }
  }

  if (nd.lunar && !nd.lunar.isNoInterference) {
    const moonUp = isMoonUp(t, nd.lunar);
    if (moonUp) parts.push(`Moon up (${Math.round(nd.lunar.fraction * 100)}%)`);
    else parts.push('Moon down');
  }

  if (nd.milkyway?.window) {
    const { start, end } = nd.milkyway.window;
    if (t >= start.getTime() && t <= end.getTime()) parts.push('MW visible');
  }

  if (nd.shootingWindow) {
    const { start, end } = nd.shootingWindow;
    if (t >= start.getTime() && t <= end.getTime()) parts.push('✓ Shoot');
  }

  return parts.join(' · ') || 'Daylight';
}
