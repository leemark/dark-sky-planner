/**
 * Encode location + date into URL search params (replaces current history entry).
 */
export function encodeState({ lat, lng, date }) {
  const p = new URLSearchParams({
    lat: lat.toFixed(5),
    lng: lng.toFixed(5),
    date,
  });
  history.replaceState({}, '', '?' + p.toString());
}

/**
 * Decode location + date from current URL search params.
 * Returns null if params are missing or invalid.
 */
export function decodeState() {
  const p = new URLSearchParams(location.search);
  const lat = parseFloat(p.get('lat'));
  const lng = parseFloat(p.get('lng'));
  const date = p.get('date');

  if (isNaN(lat) || isNaN(lng) || !date) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng, date };
}
