/**
 * Format a Date object into a time string using a specific IANA timezone.
 */
export function formatTime(date, timezone) {
  if (!date || isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format a Date object as a full date+time string in a specific timezone.
 */
export function formatDateTime(date, timezone) {
  if (!date || isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format duration in minutes as "Xh Ym"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Parse an ISO date string (YYYY-MM-DD) and return a Date at noon UTC
 * (used as reference for SunCalc daily calculations)
 */
export function parseISODate(isoString) {
  // Construct as noon UTC to avoid DST boundary issues in SunCalc
  const [y, m, d] = isoString.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Get the short timezone abbreviation for an IANA timezone string (e.g. "MDT", "JST").
 */
export function getTimezoneAbbr(timezone) {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(new Date())
    .find(p => p.type === 'timeZoneName')?.value ?? timezone;
}

/**
 * Get today's date as ISO string YYYY-MM-DD
 */
export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
