import { buildGoogleMapsUrl, compactAddress } from "@/lib/maps";
import type { PlaceIntent, PlaceResult } from "@/lib/types";

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
};

const priceMap: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4
};

export async function searchPlaces(intent: PlaceIntent, prompt: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const query = [
    intent.cuisine,
    intent.vibe,
    "restaurantes",
    intent.area,
    intent.city,
    prompt.length < 90 ? prompt : ""
  ]
    .filter(Boolean)
    .join(" ");

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location,places.types"
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 8,
      languageCode: "es"
    })
  });

  if (!response.ok) {
    throw new Error(`Places API error: ${response.status}`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return (payload.places ?? [])
    .filter((place) => place.id && place.displayName?.text && place.location?.latitude && place.location?.longitude)
    .map((place) => {
      const name = place.displayName?.text ?? "Sitio sin nombre";
      const placeId = place.id ?? name;
      return {
        placeId,
        name,
        address: compactAddress(place.formattedAddress ?? ""),
        rating: place.rating,
        priceLevel: place.priceLevel ? priceMap[place.priceLevel] : undefined,
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
        mapsUrl: buildGoogleMapsUrl(name, placeId),
        reason: "Candidato real encontrado con Google Places; pendiente de ranking por el asistente.",
        types: place.types
      };
    });
}
