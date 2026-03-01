import './style.css';
import state from './state.js';
import { initMap } from './map/map.js';
import { initPin, placePin } from './map/pin.js';
import { reverseGeocode } from './map/geocoder.js';
import { getSolarTimes, getDarknessWindow } from './astro/solar.js';
import { getLunarData } from './astro/lunar.js';
import { getMilkyWayData } from './astro/milkyway.js';
import { computeShootingWindow } from './astro/windows.js';
import { initDatepicker } from './ui/datepicker.js';
import { initSidebar } from './ui/sidebar.js';
import { initCalendar } from './ui/calendar.js';
import { initHelp } from './ui/help.js';
import { initSearch } from './ui/search.js';
import { renderLegend } from './ui/legend.js';
import { encodeState, decodeState } from './utils/url.js';
import { initGCArrow } from './map/gcArrow.js';
import tzlookup from 'tz-lookup';

// ============================================================
// Night data computation
// Synchronous — no network calls, runs in <10ms
// ============================================================

function recompute() {
  if (!state.location) return;

  state.computeError = false;

  const { lat, lng } = state.location;
  const date = state.date;

  try {
    const solar = getSolarTimes(date, lat, lng);
    const darknessWindow = getDarknessWindow(solar);
    const lunar = getLunarData(date, lat, lng);
    const milkyway = getMilkyWayData(darknessWindow, lat, lng);
    const shootingWindow = computeShootingWindow(darknessWindow, lunar.moonDownWindow, milkyway.window);

    state.nightData = {
      solar,
      darknessWindow,
      lunar,
      milkyway,
      shootingWindow,
    };
  } catch (err) {
    console.error('recompute error:', err);
    state.nightData = null;
    state.computeError = true;
  }

  // Emit 'change' ONCE — this triggers all UI panels to re-render.
  // recompute() itself is only called from user input handlers (pin, datepicker, calendar),
  // never from inside a 'change' listener, so there's no loop.
  state.emit('change');
}

// ============================================================
// Boot
// ============================================================

async function boot() {
  const map = initMap();

  // Datepicker: pass recompute as callback for date changes
  initDatepicker((isoDate) => {
    recompute();
    if (state.location) {
      encodeState({ lat: state.location.lat, lng: state.location.lng, date: isoDate });
    }
  });

  // Calendar date selection also triggers recompute
  state.on('dateChange', (isoDate) => {
    recompute();
    if (state.location) {
      encodeState({ lat: state.location.lat, lng: state.location.lng, date: isoDate });
    }
  });

  initSidebar();
  initCalendar();
  initHelp();
  renderLegend();

  // Shared callback for both map-click pins and search results
  async function onPinPlaced({ lat, lng }) {
    document.getElementById('map-hint-overlay')?.remove();
    state.location = { lat, lng, name: null };
    state.timezone = tzlookup(lat, lng);
    recompute();
    encodeState({ lat, lng, date: state.date });

    // Fetch place name asynchronously (non-blocking)
    const name = await reverseGeocode(lat, lng);
    state.location = { lat, lng, name };
    state.emit('change');
  }

  initPin(map, onPinPlaced);
  initSearch(map, onPinPlaced);
  initGCArrow(map);

  // Share button
  const btnShare = document.getElementById('btn-share');
  const announcer = document.getElementById('status-announcer');

  function showShareCopied() {
    const label = btnShare.querySelector('.btn-label');
    if (label) label.textContent = 'Copied!';
    btnShare.style.color = '#39c5cf';
    if (announcer) announcer.textContent = 'Link copied to clipboard.';
    setTimeout(() => {
      if (label) label.textContent = 'Share';
      btnShare.style.color = '';
      if (announcer) announcer.textContent = '';
    }, 2000);
  }

  function showShareFallback(url) {
    // Show the URL visibly in the announcer for manual copy; no prompt()
    const label = btnShare.querySelector('.btn-label');
    if (label) label.textContent = 'Copy URL';
    if (announcer) announcer.textContent = `Copy this link: ${url}`;
    setTimeout(() => {
      if (label) label.textContent = 'Share';
      if (announcer) announcer.textContent = '';
    }, 5000);
  }

  function copyWithExecCommand(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) showShareCopied(); else showShareFallback(text);
    } catch {
      showShareFallback(text);
    }
  }

  btnShare?.addEventListener('click', () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
        .then(showShareCopied)
        .catch(() => copyWithExecCommand(shareUrl));
    } else {
      copyWithExecCommand(shareUrl);
    }
  });

  // Restore from URL params
  const urlState = decodeState();
  if (urlState) {
    const { lat, lng, date } = urlState;
    document.getElementById('map-hint-overlay')?.remove();
    state.date = date;
    state.timezone = tzlookup(lat, lng);
    state.location = { lat, lng, name: null };

    map.setView([lat, lng], 10);
    placePin(map, lat, lng);

    // Update datepicker to match URL date
    state.emit('uiSync');
    recompute();

    // Fetch place name async
    reverseGeocode(lat, lng).then(name => {
      state.location = { lat, lng, name };
      state.emit('change');
    });
  }
}

boot();
