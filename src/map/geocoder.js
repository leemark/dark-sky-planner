let debounceTimer = null;

/**
 * Reverse geocode a lat/lng to a place name using Nominatim.
 * Debounced to avoid rapid consecutive requests.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} place name
 */
export function reverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'DarkSkyPlanner/1.0' },
        });
        if (!res.ok) throw new Error('Nominatim error');
        const data = await res.json();
        // Prefer a short name: city/town/village + state/country
        const addr = data.address || {};
        const parts = [
          addr.city || addr.town || addr.village || addr.hamlet || addr.county,
          addr.state || addr.country,
        ].filter(Boolean);
        resolve(parts.length ? parts.join(', ') : data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } catch {
        resolve(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
      }
    }, 500);
  });
}
