import SunCalc from 'suncalc';
import { MOON_INTERFERENCE_THRESHOLD } from '../utils/constants.js';

const PHASE_NAMES = [
  { max: 0.0625, name: 'New Moon',        icon: '🌑' },
  { max: 0.1875, name: 'Waxing Crescent', icon: '🌒' },
  { max: 0.3125, name: 'First Quarter',   icon: '🌓' },
  { max: 0.4375, name: 'Waxing Gibbous',  icon: '🌔' },
  { max: 0.5625, name: 'Full Moon',       icon: '🌕' },
  { max: 0.6875, name: 'Waning Gibbous',  icon: '🌖' },
  { max: 0.8125, name: 'Last Quarter',    icon: '🌗' },
  { max: 0.9375, name: 'Waning Crescent', icon: '🌘' },
  { max: 1.0,    name: 'New Moon',        icon: '🌑' },
];

function getPhaseName(phase) {
  return PHASE_NAMES.find(p => phase <= p.max) || PHASE_NAMES[PHASE_NAMES.length - 1];
}

/**
 * Get lunar data for a given date and location.
 *
 * @param {string} isoDate - 'YYYY-MM-DD'
 * @param {number} lat
 * @param {number} lng
 * @returns {object}
 */
export function getLunarData(isoDate, lat, lng) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0);

  const illum = SunCalc.getMoonIllumination(date);
  const phaseInfo = getPhaseName(illum.phase);

  // Moon times — try current date first, then check if we need next day's rise
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng);
  const nextDay = new Date(y, m - 1, d + 1, 12, 0, 0);
  const nextMoonTimes = SunCalc.getMoonTimes(nextDay, lat, lng);

  const isNoInterference = illum.fraction < MOON_INTERFERENCE_THRESHOLD;

  // Determine moon-down window for the night
  // This is the interval when moon is below horizon during the night
  const moonWindow = getMoonDownWindow(moonTimes, nextMoonTimes, isNoInterference);

  return {
    fraction: illum.fraction,
    phase: illum.phase,
    phaseName: phaseInfo.name,
    phaseIcon: phaseInfo.icon,
    moonrise: moonTimes.rise || null,
    moonset: moonTimes.set || null,
    nextMoonrise: nextMoonTimes.rise || null,
    nextMoonset: nextMoonTimes.set || null,
    isNoInterference,
    moonDownWindow: moonWindow,
  };
}

/**
 * Determine the "moon-down" window for a night.
 * Returns { start: Date, end: Date } representing when the moon is below horizon,
 * or null if moon is up all night.
 * If no interference, returns a sentinel meaning "all night ok".
 */
function getMoonDownWindow(moonTimes, nextMoonTimes, isNoInterference) {
  if (isNoInterference) {
    // Treat as moon-down all night — return a very wide window
    return {
      start: new Date(0),
      end: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      allNight: true,
    };
  }

  const { rise, set } = moonTimes;

  // Moon sets before it rises (sets in the evening, rises later/next day)
  if (set && rise && set < rise) {
    // Moon is down from start of night until it rises
    return { start: new Date(0), end: rise };
  }

  // Moon has set but not rising tonight
  if (set && !rise) {
    // Moon sets sometime during/before the night, doesn't rise until next day
    return { start: set, end: nextMoonTimes.rise || new Date(Date.now() + 86400000) };
  }

  // Moon rises but not setting tonight
  if (rise && !set) {
    // Moon rises during the night, is up until it sets the following night
    // Moon-down window is from start until it rises
    return { start: new Date(0), end: rise };
  }

  // Both rise and set exist
  if (rise && set) {
    if (rise < set) {
      // Moon rises then sets during the night — dark before rise and after set
      // We'll use the longer of the two dark windows
      // For simplicity, return the post-set window (common case for astrophotography)
      return { start: set, end: nextMoonTimes.rise || new Date(Date.now() + 86400000) };
    } else {
      // Moon sets before it rises (covered above but double-checking)
      return { start: set, end: rise };
    }
  }

  // Moon doesn't rise or set — either up all night or down all night
  if (moonTimes.alwaysUp) return null; // moon up all night
  if (moonTimes.alwaysDown) {
    return {
      start: new Date(0),
      end: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      allNight: true,
    };
  }

  return null;
}
