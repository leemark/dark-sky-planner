import SunCalc from 'suncalc';

/**
 * Get solar times for a given date and location.
 * Returns a structured object with all relevant twilight times.
 *
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} lat
 * @param {number} lng
 * @returns {object}
 */
export function getSolarTimes(isoDate, lat, lng) {
  const [y, m, d] = isoDate.split('-').map(Number);
  // Use noon local-ish time as reference date for SunCalc
  const date = new Date(y, m - 1, d, 12, 0, 0);

  const times = SunCalc.getTimes(date, lat, lng);

  // For the "next day" dawn — SunCalc computes for the calendar day,
  // so astronomical dawn will be early morning of the same calendar day.
  // We need the dawn after the dusk (i.e. next morning).
  const nextDay = new Date(y, m - 1, d + 1, 12, 0, 0);
  const nextTimes = SunCalc.getTimes(nextDay, lat, lng);

  return {
    sunrise: times.sunrise,
    nextSunrise: nextTimes.sunrise,
    sunset: times.sunset,
    civilDusk: times.dusk,                      // civil (6°)
    nauticalDusk: times.nauticalDusk,
    astronomicalDusk: times.night,              // astronomical dusk = end of astro twilight (18°)
    civilDawn: nextTimes.dawn,
    nauticalDawn: nextTimes.nauticalDawn,
    astronomicalDawn: nextTimes.nightEnd,       // astronomical dawn (18°)
    solarNoon: times.solarNoon,
    nadir: times.nadir,
  };
}

/**
 * Compute the "darkness window" — the period from astronomical dusk
 * to astronomical dawn of the following morning.
 */
export function getDarknessWindow(solarTimes) {
  const { astronomicalDusk, astronomicalDawn } = solarTimes;
  if (!astronomicalDusk || !astronomicalDawn || isNaN(astronomicalDusk)) {
    return null;
  }
  // High latitude: if no astronomical darkness, return null
  if (astronomicalDusk > astronomicalDawn) return null;
  return { start: astronomicalDusk, end: astronomicalDawn };
}
