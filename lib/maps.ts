export function buildGoogleMapsUrl(name: string, placeId: string) {
  const query = encodeURIComponent(name);
  const id = encodeURIComponent(placeId);
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${id}`;
}

export function compactAddress(address: string) {
  return address.replace(/\s+/g, " ").trim();
}
