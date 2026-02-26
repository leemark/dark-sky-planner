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
import { renderLegend } from './ui/legend.js';
import { encodeState, decodeState } from './utils/url.js';
import tzlookup from 'tz-lookup';

// ============================================================
// Night data computation
// Synchronous — no network calls, runs in <10ms
// ============================================================

function recompute() {
  if (!state.location) return;

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
  renderLegend();

  // Wire pin behavior
  initPin(map, async ({ lat, lng }) => {
    state.location = { lat, lng, name: null };
    state.timezone = tzlookup(lat, lng);
    recompute();
    encodeState({ lat, lng, date: state.date });

    // Fetch place name asynchronously (non-blocking)
    const name = await reverseGeocode(lat, lng);
    state.location = { lat, lng, name };
    state.emit('change');
  });

  // Share button
  const btnShare = document.getElementById('btn-share');
  btnShare?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      btnShare.title = 'Copied!';
      btnShare.style.color = '#39c5cf';
      setTimeout(() => {
        btnShare.title = 'Copy Share Link';
        btnShare.style.color = '';
      }, 2000);
    }).catch(() => {
      // Fallback: select the URL
      prompt('Copy this link:', window.location.href);
    });
  });

  // Restore from URL params
  const urlState = decodeState();
  if (urlState) {
    const { lat, lng, date } = urlState;
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
