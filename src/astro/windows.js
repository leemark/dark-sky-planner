/**
 * Window intersection logic.
 * Each window = { start: Date, end: Date } | null
 */

export function intersect(a, b) {
  if (!a || !b) return null;
  const start = new Date(Math.max(a.start.getTime(), b.start.getTime()));
  const end   = new Date(Math.min(a.end.getTime(),   b.end.getTime()));
  return start < end ? { start, end } : null;
}

/**
 * Compute the optimal shooting window.
 * shootingWindow = intersect(intersect(darkness, moonDown), mwWindow)
 *
 * @param {object|null} darknessWindow
 * @param {object|null} moonDownWindow
 * @param {object|null} mwWindow
 * @returns {object|null} - { start, end, durationMinutes } or null
 */
export function computeShootingWindow(darknessWindow, moonDownWindow, mwWindow) {
  const step1 = intersect(darknessWindow, moonDownWindow);
  const step2 = intersect(step1, mwWindow);

  if (!step2) return null;

  const durationMinutes = (step2.end.getTime() - step2.start.getTime()) / (60 * 1000);
  if (durationMinutes <= 0) return null;

  return {
    start: step2.start,
    end: step2.end,
    durationMinutes,
  };
}
