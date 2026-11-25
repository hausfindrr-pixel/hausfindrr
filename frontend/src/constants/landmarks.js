// Landmark config — edit this list to add or update points of interest.
// name: display label shown on the property page
// lat/lng: decimal degrees (WGS-84)
// tag: must match an entry in LISTING_TAGS
// radiusKm: a pin within this distance gets the tag pre-ticked in the form

export const LANDMARKS = [
  // Port Moresby (NCD)
  { name: 'UPNG',             lat: -9.4063, lng: 147.1953, tag: 'Near the university',  radiusKm: 1.5 },
  { name: 'General Hospital', lat: -9.4316, lng: 147.1891, tag: 'Near hospital',        radiusKm: 1.5 },
  { name: 'Gordons Market',   lat: -9.4252, lng: 147.1878, tag: 'Near market',          radiusKm: 1.0 },
  { name: 'Vision City',      lat: -9.4078, lng: 147.1953, tag: 'Near commercial zone', radiusKm: 1.2 },
  { name: 'Jackson Airport',  lat: -9.4433, lng: 147.2200, tag: 'Near airport',         radiusKm: 2.0 },
  { name: 'City Centre',      lat: -9.4438, lng: 147.1559, tag: 'Near the city',        radiusKm: 2.0 },
  { name: 'Ela Beach',        lat: -9.4582, lng: 147.1665, tag: 'Beachside',            radiusKm: 1.0 },
  { name: 'Koki',             lat: -9.4624, lng: 147.1849, tag: 'Beachside',            radiusKm: 0.8 },
];

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
