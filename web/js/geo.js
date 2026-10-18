// Location helpers: GPS, distance and place search.
import { CONFIG } from "./config.js";

export function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371000, toR = x => x * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Ask the phone for its location. Needs HTTPS (or localhost) and the user's permission.
export function locate() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("This browser can’t share location. Type your location instead."));
    navigator.geolocation.getCurrentPosition(
      p => resolve([p.coords.longitude, p.coords.latitude]),
      err => reject(new Error(err.code === 1
        ? "Location permission is off. Type your location instead."
        : "Couldn’t get your location. Type it instead.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

// Keep following the user as they move (used while a trip is active).
export function watch(onMove) {
  if (!("geolocation" in navigator)) return null;
  return navigator.geolocation.watchPosition(
    p => onMove([p.coords.longitude, p.coords.latitude]),
    () => {},
    { enableHighAccuracy: true, maximumAge: 15000 }
  );
}

// Search the app's own place list first, then (optionally) OpenStreetMap Nominatim.
export async function search(query, places) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const local = places.find(p => p.name.toLowerCase() === q) || places.find(p => p.name.toLowerCase().includes(q));
  if (local) return local;
  if (!CONFIG.geocoder.nominatim) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${CONFIG.geocoder.countryCodes}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const [hit] = await res.json();
  return hit ? { name: hit.display_name.split(",").slice(0, 2).join(","), coord: [+hit.lon, +hit.lat] } : null;
}
