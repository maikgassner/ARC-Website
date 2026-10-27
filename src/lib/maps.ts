// Reading pins out of Google Maps links, "lat, lng" text and Plus Codes
// (admin Places editor, Tunnel check).

// Name / search text in a Google Maps link (…/maps/place/Skydive+Hohenems/@…
// or …/maps?q=…) — the address fallback when the pin has no street address.
export function placeFromMapsUrl(text: string): string {
  try {
    const u = new URL(text);
    const m = u.pathname.match(/\/maps\/(?:place|search)\/([^/@]+)/);
    const raw = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : (u.searchParams.get('q') ?? u.searchParams.get('query') ?? '');
    return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(raw.trim()) ? '' : raw.trim();
  } catch { return ''; }
}
export const isShortMapsLink = (text: string) => /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(text.trim());
// A link pasted next to old address text still counts — take the URL itself.
export const urlIn = (text: string) => text.match(/https?:\/\/\S+/i)?.[0] ?? null;

// A pasted "47.38, 9.69" or Google Maps link also works in the address field.
export function parseCoords(text: string): [number, number] | null {
  const pats = [/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /[?&](?:q|ll|query)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /^\s*(-?\d{1,3}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*$/];
  for (const p of pats) {
    const m = text.match(p);
    if (m) { const lat = +m[1], lng = +m[2]; if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng]; }
  }
  return plusCodeToCoords(text);
}

// Google often puts only a Plus Code in a place link (…!20s8Q995PVV%2BFCM,
// no @lat,lng), or people paste one ("8Q995PVV+FCM"): decode the full
// Open Location Code to the centre of its cell (~14 × 14 m, 11 chars ~3 m).
const OLC = '23456789CFGHJMPQRVWX';
export function plusCodeToCoords(text: string): [number, number] | null {
  let t = text;
  try { t = decodeURIComponent(text); } catch { /* keep as is */ }
  const m = t.match(/(?:^|[^23456789CFGHJMPQRVWX])([23456789CFGHJMPQRVWX]{8})\+([23456789CFGHJMPQRVWX]{2,3})(?![23456789CFGHJMPQRVWX])/i);
  if (!m) return null;
  const code = (m[1] + m[2]).toUpperCase();
  let lat = -90, lng = -180, res = 20;
  for (let i = 0; i < 10; i += 2) {
    lat += OLC.indexOf(code[i]) * res; lng += OLC.indexOf(code[i + 1]) * res;
    if (i < 8) res /= 20;
  }
  let latCell = res, lngCell = res;
  if (code.length > 10) { // 11th char: the cell split into 5 rows × 4 columns
    const d = OLC.indexOf(code[10]); latCell = res / 5; lngCell = res / 4;
    lat += Math.floor(d / 4) * latCell; lng += (d % 4) * lngCell;
  }
  return [+(lat + latCell / 2).toFixed(6), +(lng + lngCell / 2).toFixed(6)];
}

// ---------- Address search (OpenStreetMap — free, no key) ----------
// Photon for search-as-you-type (Nominatim's policy forbids autocomplete),
// Nominatim for single lookups — pin → address, and Enter in the field —
// because Photon's public server is sometimes ~30 s slow. Both time out.
export type Geo = { lat: number; lng: number; p: Record<string, any> };
export const cityOf = (p: Record<string, any>) => p.city ?? p.town ?? p.village ?? p.locality ?? p.district ?? p.county ?? '';
export function formatAddress(p: Record<string, any>): string {
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const town = [p.postcode, cityOf(p)].filter(Boolean).join(' ');
  return [p.name && p.name !== p.street ? p.name : '', street, town, p.country].filter(Boolean).join(', ');
}
export const toGeo = (f: any): Geo => ({ lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], p: f.properties ?? {} });
export const getJson = async (url: string, ms: number) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  return res.ok ? res.json() : null;
};
// Nominatim result → the same shape as Photon's properties.
export const fromNominatim = (n: any): Geo => {
  const a = n.address ?? {};
  return {
    lat: Number(n.lat), lng: Number(n.lon),
    p: {
      name: n.name || undefined, street: a.road ?? a.pedestrian ?? a.footway, housenumber: a.house_number, postcode: a.postcode,
      city: a.city ?? a.town ?? a.village ?? a.hamlet ?? a.municipality, county: a.county, country: a.country, countrycode: a.country_code,
    },
  };
};
export const NOMINATIM = 'https://nominatim.openstreetmap.org';
export async function searchAddress(q: string): Promise<Geo[]> {
  const d = await getJson(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`, 8000);
  return (d?.features ?? []).map(toGeo);
}
export async function searchAddressNow(q: string): Promise<Geo[]> {
  const d = await getJson(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=jsonv2&addressdetails=1&limit=6&accept-language=en`, 8000);
  return Array.isArray(d) ? d.map(fromNominatim) : [];
}
export async function reverseGeocode(lat: number, lng: number): Promise<Geo | null> {
  try {
    const n = await getJson(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&accept-language=en`, 6000);
    if (n && !n.error) return { ...fromNominatim(n), lat, lng };
  } catch {}
  try {
    const f = (await getJson(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`, 8000))?.features?.[0];
    return f ? { lat, lng, p: f.properties ?? {} } : null;
  } catch { return null; }
}
