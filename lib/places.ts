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

type LegacyGooglePlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  price_level?: number;
  geometry?: { location?: { lat?: number; lng?: number } };
  types?: string[];
};

const priceMap: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4
};

function buildTextQuery(intent: PlaceIntent, prompt: string) {
  const lowerPrompt = prompt.toLowerCase();
  const additions = [intent.area, intent.city].filter(
    (item) => item && !lowerPrompt.includes(item.toLowerCase())
  );

  return [prompt, ...additions].filter(Boolean).join(" ");
}

async function searchPlacesNew(apiKey: string, query: string): Promise<PlaceResult[]> {
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
    const errorBody = await response.text();
    throw new Error(`Places API (New) error: ${response.status} ${errorBody.slice(0, 180)}`);
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
        reason: "Candidato real encontrado con Google Places.",
        types: place.types
      };
    });
}

async function searchPlacesLegacy(apiKey: string, query: string): Promise<PlaceResult[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", query);
  url.searchParams.set("language", "es");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Places API legacy HTTP error: ${response.status}`);
  }

  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: LegacyGooglePlace[];
  };

  if (payload.status && !["OK", "ZERO_RESULTS"].includes(payload.status)) {
    throw new Error(`Places API legacy error: ${payload.status} ${payload.error_message ?? ""}`.trim());
  }

  return (payload.results ?? [])
    .filter((place) => place.place_id && place.name && place.geometry?.location?.lat && place.geometry?.location?.lng)
    .slice(0, 8)
    .map((place) => {
      const name = place.name ?? "Sitio sin nombre";
      const placeId = place.place_id ?? name;
      return {
        placeId,
        name,
        address: compactAddress(place.formatted_address ?? ""),
        rating: place.rating,
        priceLevel: place.price_level,
        lat: place.geometry?.location?.lat ?? 0,
        lng: place.geometry?.location?.lng ?? 0,
        mapsUrl: buildGoogleMapsUrl(name, placeId),
        reason: "Candidato real encontrado con Google Places.",
        types: place.types
      };
    });
}

export async function searchPlaces(intent: PlaceIntent, prompt: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const query = buildTextQuery(intent, prompt);

  try {
    const newResults = await searchPlacesNew(apiKey, query);
    if (newResults.length > 0) return newResults;
  } catch (error) {
    console.warn(error);
  }

  return searchPlacesLegacy(apiKey, query);
}
