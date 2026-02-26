import state from '../state.js';

/**
 * Initialize the date picker UI component.
 * Renders into #datepicker-container.
 *
 * @param {function} onDateChange - called with new ISO date string when user changes date
 */
export function initDatepicker(onDateChange) {
  const container = document.getElementById('datepicker-container');
  if (!container) return;

  container.innerHTML = `
    <div class="datepicker-wrap">
      <button class="date-nav-btn" id="date-prev" title="Previous day">&#8592;</button>
      <label for="date-input">Date</label>
      <input type="date" id="date-input" value="${state.date}" />
      <button class="date-nav-btn" id="date-next" title="Next day">&#8594;</button>
    </div>
  `;

  const input = document.getElementById('date-input');
  const prevBtn = document.getElementById('date-prev');
  const nextBtn = document.getElementById('date-next');

  function applyDate(iso) {
    state.date = iso;
    input.value = iso;
    onDateChange?.(iso);
  }

  input.addEventListener('change', () => {
    if (input.value) applyDate(input.value);
  });

  prevBtn.addEventListener('click', () => shiftDate(-1));
  nextBtn.addEventListener('click', () => shiftDate(1));

  // Keyboard shortcut: left/right arrows
  document.addEventListener('keydown', (e) => {
    if (e.target !== input && e.target.tagName !== 'INPUT') {
      if (e.key === 'ArrowLeft') shiftDate(-1);
      if (e.key === 'ArrowRight') shiftDate(1);
    }
  });

  // Keep in sync when state.date is changed externally (e.g. calendar click)
  state.on('uiSync', () => {
    if (input.value !== state.date) {
      input.value = state.date;
    }
  });

  function shiftDate(delta) {
    const [y, m, d] = state.date.split('-').map(Number);
    const newDate = new Date(y, m - 1, d + delta);
    const iso = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
    applyDate(iso);
  }
}
