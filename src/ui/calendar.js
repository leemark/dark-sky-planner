import state from '../state.js';
import { getSolarTimes, getDarknessWindow } from '../astro/solar.js';
import { getLunarData } from '../astro/lunar.js';
import { getMilkyWayData } from '../astro/milkyway.js';
import { computeShootingWindow } from '../astro/windows.js';
import { scoreNight } from '../astro/scoring.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

let calendarYear = null;
let calendarMonth = null; // 0-indexed
let calendarOpener = null; // element that triggered open, for focus restore

function getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
}

/**
 * Initialize the calendar modal.
 */
export function initCalendar() {
  const modal = document.getElementById('calendar-modal');
  const btnOpen = document.getElementById('btn-calendar');
  const btnClose = document.getElementById('btn-close-calendar');
  const btnPrev = document.getElementById('btn-prev-month');
  const btnNext = document.getElementById('btn-next-month');
  const backdrop = modal?.querySelector('.modal-backdrop');

  if (!modal) return;

  btnOpen?.addEventListener('click', () => {
    const [y, m] = state.date.split('-').map(Number);
    calendarYear = y;
    calendarMonth = m - 1;
    openCalendar();
  });

  btnClose?.addEventListener('click', closeCalendar);
  backdrop?.addEventListener('click', closeCalendar);

  btnPrev?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendarGrid();
  });

  btnNext?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendarGrid();
  });

  // Focus trap: keep Tab/Shift-Tab inside the modal
  modal.addEventListener('keydown', (e) => {
    if (modal.classList.contains('hidden')) return;
    if (e.key !== 'Tab') return;
    const focusable = getFocusable(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Keyboard: Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeCalendar();
    }
  });
}

function openCalendar() {
  const modal = document.getElementById('calendar-modal');
  calendarOpener = document.activeElement;
  modal?.classList.remove('hidden');
  document.body.classList.add('modal-open');
  renderCalendarGrid();
  // Focus first focusable element after grid renders
  requestAnimationFrame(() => {
    const first = getFocusable(modal)[0];
    first?.focus();
  });
}

function closeCalendar() {
  const modal = document.getElementById('calendar-modal');
  modal?.classList.add('hidden');
  document.body.classList.remove('modal-open');
  calendarOpener?.focus();
  calendarOpener = null;
}

async function renderCalendarGrid() {
  const title = document.getElementById('calendar-title');
  const grid = document.getElementById('calendar-grid');
  if (!grid || !title) return;

  title.textContent = `${MONTHS[calendarMonth]} ${calendarYear}`;

  // No location — show prompt instead of scoring grid
  if (!state.location) {
    grid.innerHTML = `<div class="cal-no-location">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 13 6 13s6-8.5 6-13c0-3.314-2.686-6-6-6z"/>
        <circle cx="12" cy="8" r="2"/>
      </svg>
      <p>No location selected</p>
      <p class="cal-no-location-hint">Drop a pin on the map or search for a place — then the calendar will show night quality scores for each date.</p>
    </div>`;
    return;
  }

  // Day headers
  const headerHtml = DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  // First day of month
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startOffset = firstDay.getDay(); // 0=Sun

  // Days in month
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  // Previous month fill
  const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

  const cells = [];

  // Empty cells for previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, otherMonth: true, isoDate: null });
  }

  // This month's days
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(calendarMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push({ day: d, otherMonth: false, isoDate: `${calendarYear}-${m}-${dd}` });
  }

  // Fill remaining cells
  const remainder = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remainder; d++) {
    cells.push({ day: d, otherMonth: true, isoDate: null });
  }

  // Render skeleton first
  grid.innerHTML = headerHtml + cells.map(cell => {
    if (cell.otherMonth || !cell.isoDate) {
      return `<div class="cal-day empty other-month">${cell.day}</div>`;
    }
    const isActive = cell.isoDate === state.date;
    return `<div class="cal-day computing ${isActive ? 'active' : ''}" data-date="${cell.isoDate}">${cell.day}</div>`;
  }).join('');

  // Compute scores for each day (can run quickly since all client-side)
  const { lat, lng } = state.location;

  const scorableCells = cells.filter(c => !c.otherMonth && c.isoDate);
  let scored = 0;

  for (const cell of cells) {
    if (cell.otherMonth || !cell.isoDate) continue;

    // Small async yield to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 0));

    const quality = computeDayQuality(cell.isoDate, lat, lng);
    scored++;

    // Show progress in title until all cells are scored
    if (title && scored < scorableCells.length) {
      title.textContent = `${MONTHS[calendarMonth]} ${calendarYear} · ${scored}/${scorableCells.length}`;
    } else if (title) {
      title.textContent = `${MONTHS[calendarMonth]} ${calendarYear}`;
    }

    const cellEl = grid.querySelector(`[data-date="${cell.isoDate}"]`);
    if (cellEl) {
      const isActive = cell.isoDate === state.date;
      cellEl.className = `cal-day ${quality} ${isActive ? 'active' : ''}`;
      cellEl.dataset.date = cell.isoDate;

      cellEl.addEventListener('click', () => {
        state.date = cell.isoDate;
        state.emit('uiSync'); // sync datepicker input
        state.emit('dateChange', cell.isoDate);
        closeCalendar();
      });
    }
  }
}

function computeDayQuality(isoDate, lat, lng) {
  try {
    const solar = getSolarTimes(isoDate, lat, lng);
    const darkness = getDarknessWindow(solar);
    const lunar = getLunarData(isoDate, lat, lng);
    const mw = getMilkyWayData(darkness, lat, lng);
    const sw = computeShootingWindow(darkness, lunar.moonDownWindow, mw.window);

    const nightData = { solar, darknessWindow: darkness, lunar, milkyway: mw, shootingWindow: sw };
    return scoreNight(nightData);
  } catch {
    return 'none';
  }
}
