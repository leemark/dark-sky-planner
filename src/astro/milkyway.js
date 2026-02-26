import * as Astronomy from 'astronomy-engine';
import { GC_RA_HOURS, GC_DEC_DEG, MW_MIN_ALT_DEG, MW_SAMPLE_INTERVAL_MIN } from '../utils/constants.js';
// Note: Astronomy.Horizon(date, observer, ra_hours, dec_deg, refraction) is used directly

/**
 * Calculate Milky Way galactic center altitude and azimuth for a given time.
 */
function getGCHorizon(dateTime, lat, lng) {
  const observer = new Astronomy.Observer(lat, lng, 0);
  // Horizon(date, observer, ra_hours, dec_deg, refraction) → { altitude, azimuth }
  const hor = Astronomy.Horizon(dateTime, observer, GC_RA_HOURS, GC_DEC_DEG, Astronomy.Refraction.Normal);
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}

/**
 * Get the Milky Way visibility window for a given night.
 * Samples every MW_SAMPLE_INTERVAL_MIN minutes during the darkness window.
 *
 * @param {object} darknessWindow - { start: Date, end: Date } | null
 * @param {number} lat
 * @param {number} lng
 * @returns {object} - { window: {start, end} | null, samples, peakAlt, peakAz, peakTime }
 */
export function getMilkyWayData(darknessWindow, lat, lng) {
  if (!darknessWindow) {
    return { window: null, samples: [], peakAlt: null, peakAz: null, peakTime: null };
  }

  const { start, end } = darknessWindow;
  const intervalMs = MW_SAMPLE_INTERVAL_MIN * 60 * 1000;
  const samples = [];

  // Clamp to a reasonable night window (max 12 hours)
  const maxDuration = 12 * 3600 * 1000;
  const windowStart = start.getTime();
  const windowEnd = Math.min(end.getTime(), windowStart + maxDuration);

  for (let t = windowStart; t <= windowEnd; t += intervalMs) {
    const dateTime = new Date(t);
    try {
      const { altitude, azimuth } = getGCHorizon(dateTime, lat, lng);
      samples.push({ time: dateTime, altitude, azimuth });
    } catch (e) {
      // Skip samples that fail (e.g., extreme latitudes)
    }
  }

  // Find peak altitude
  let peak = null;
  for (const s of samples) {
    if (!peak || s.altitude > peak.altitude) {
      peak = s;
    }
  }

  // Find continuous windows where altitude >= MW_MIN_ALT_DEG
  const visibleSamples = samples.filter(s => s.altitude >= MW_MIN_ALT_DEG);

  if (visibleSamples.length === 0) {
    return {
      window: null,
      samples,
      peakAlt: peak?.altitude ?? null,
      peakAz: peak?.azimuth ?? null,
      peakTime: peak?.time ?? null,
      neverVisible: true,
    };
  }

  // Find the first and last visible times
  const mwStart = visibleSamples[0].time;
  const mwEnd = visibleSamples[visibleSamples.length - 1].time;

  return {
    window: { start: mwStart, end: mwEnd },
    samples,
    peakAlt: peak.altitude,
    peakAz: peak.azimuth,
    peakTime: peak.time,
    neverVisible: false,
  };
}
