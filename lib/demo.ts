import { buildGoogleMapsUrl } from "@/lib/maps";
import type { PlaceIntent, PlaceList, PlaceResult } from "@/lib/types";

export const starterLists: PlaceList[] = [
  {
    id: "madrid-cenas",
    name: "Madrid cenas",
    description: "Sitios con buen ambiente para noches sin improvisar.",
    isPublic: true,
    createdAt: new Date("2026-06-01T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-01T12:00:00.000Z").toISOString(),
    places: []
  },
  {
    id: "lisboa-viaje",
    name: "Lisboa viaje",
    description: "Reservas mentales para un finde con hambre.",
    isPublic: false,
    createdAt: new Date("2026-06-02T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-02T12:00:00.000Z").toISOString(),
    places: []
  },
  {
    id: "quiero-probar",
    name: "Quiero probar",
    description: "La caja de ideas antes de decidir ciudad.",
    isPublic: false,
    createdAt: new Date("2026-06-03T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-06-03T12:00:00.000Z").toISOString(),
    places: []
  }
];

const demoCandidates = [
  {
    placeId: "ChIJbYstO6YoQg0Rc84s6B7gkQ4",
    name: "Chuka Ramen Bar",
    address: "Calle de Echegaray, 9, Madrid",
    rating: 4.4,
    priceLevel: 2,
    lat: 40.4151,
    lng: -3.6994,
    types: ["restaurant", "ramen", "japanese"]
  },
  {
    placeId: "ChIJC1n8NkooQg0RIRaRyUHG2cM",
    name: "Yokaloka",
    address: "Mercado de Antón Martín, Madrid",
    rating: 4.5,
    priceLevel: 2,
    lat: 40.4116,
    lng: -3.6991,
    types: ["restaurant", "japanese"]
  },
  {
    placeId: "ChIJ0Wmx17QoQg0RQjYpJ64R4i4",
    name: "La Musa Latina",
    address: "Costanilla de San Andrés, 12, Madrid",
    rating: 4.2,
    priceLevel: 2,
    lat: 40.4115,
    lng: -3.7107,
    types: ["restaurant", "tapas"]
  },
  {
    placeId: "ChIJA6eNq2AoQg0RdDuNv6LO5zQ",
    name: "Sala de Despiece",
    address: "Calle de Ponzano, 11, Madrid",
    rating: 4.4,
    priceLevel: 3,
    lat: 40.4419,
    lng: -3.6995,
    types: ["restaurant", "creative"]
  },
  {
    placeId: "ChIJN0zp5oMpQg0R6He4qY7au6A",
    name: "Casa Dani",
    address: "Calle de Ayala, 28, Madrid",
    rating: 4.3,
    priceLevel: 1,
    lat: 40.4271,
    lng: -3.6865,
    types: ["restaurant", "spanish"]
  },
  {
    placeId: "ChIJi6m9XVgoQg0RkVTh4EEERUw",
    name: "Honest Greens Hortaleza",
    address: "Calle de Hortaleza, 100, Madrid",
    rating: 4.4,
    priceLevel: 2,
    lat: 40.4248,
    lng: -3.6978,
    types: ["restaurant", "healthy"]
  }
];

export function inferDemoIntent(prompt: string): PlaceIntent {
  const lower = prompt.toLowerCase();
  return {
    city: lower.includes("lisboa") ? "Lisboa" : lower.includes("barcelona") ? "Barcelona" : "Madrid",
    area: lower.includes("chamberí") ? "Chamberí" : lower.includes("malasaña") ? "Malasaña" : undefined,
    cuisine: lower.includes("ramen") ? "ramen" : lower.includes("taco") ? "tacos" : lower.includes("tapas") ? "tapas" : "cena",
    vibe: lower.includes("cita") || lower.includes("cozy") ? "cozy" : lower.includes("barato") ? "casual" : "curado",
    price: lower.includes("barato") ? "bajo" : lower.includes("caro") ? "alto" : "medio",
    constraints: lower.includes("terraza") ? ["terraza"] : []
  };
}

export function demoRecommendations(prompt: string): PlaceResult[] {
  const intent = inferDemoIntent(prompt);
  return demoCandidates.slice(0, 5).map((place, index) => ({
    ...place,
    mapsUrl: buildGoogleMapsUrl(place.name, place.placeId),
    reason:
      index === 0
        ? `Buen primer candidato para ${intent.cuisine ?? "comer"}: ficha reconocible, ambiente directo y fácil de validar en Maps.`
        : `Encaja con una lista ${intent.vibe ?? "curada"} por mezcla de valoración, zona y utilidad para decidir rápido.`
  }));
}
