/**
 * Quality scoring for a night's astrophotography conditions.
 * Returns: 'excellent' | 'good' | 'fair' | 'poor' | 'none'
 */

export const QUALITY = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  NONE: 'none',
};

/**
 * Score a night based on:
 * - Whether a shooting window exists
 * - Duration of the shooting window
 * - Moon illumination
 *
 * @param {object} nightData
 * @returns {string} quality enum value
 */
export function scoreNight(nightData) {
  if (!nightData || !nightData.shootingWindow) return QUALITY.NONE;

  const { durationMinutes } = nightData.shootingWindow;
  const moonFraction = nightData.lunar?.fraction ?? 1;

  if (durationMinutes <= 0) return QUALITY.NONE;

  // Excellent: >= 3 hours and low moon interference
  if (durationMinutes >= 180 && moonFraction < 0.25) return QUALITY.EXCELLENT;

  // Good: >= 2 hours and moon < 50%, or >= 3 hours with moderate moon
  if (durationMinutes >= 120 && moonFraction < 0.50) return QUALITY.GOOD;
  if (durationMinutes >= 180 && moonFraction < 0.50) return QUALITY.GOOD;

  // Fair: >= 1 hour
  if (durationMinutes >= 60) return QUALITY.FAIR;

  // Poor: any window exists but short
  return QUALITY.POOR;
}
