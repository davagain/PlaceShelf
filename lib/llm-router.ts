import type { PlaceIntent, PlaceResult } from "@/lib/types";
import { inferDemoIntent } from "@/lib/demo";

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

async function gatewayJson<T>(model: string, messages: ChatMessage[], fallback: T): Promise<T> {
  const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY;
  if (!apiKey) return fallback;

  const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return fallback;

  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function parseIntent(prompt: string): Promise<PlaceIntent> {
  const fallback = inferDemoIntent(prompt);
  return gatewayJson<PlaceIntent>(
    process.env.AI_GATEWAY_PARSE_MODEL ?? "google/gemini-2.5-flash-lite",
    [
      {
        role: "system",
        content:
          "Extrae intención para recomendar sitios de comida. Devuelve JSON estricto con city, area, cuisine, vibe, price y constraints array. No inventes si no está claro."
      },
      { role: "user", content: prompt }
    ],
    fallback
  );
}

export async function rankPlaces(prompt: string, intent: PlaceIntent, places: PlaceResult[]): Promise<PlaceResult[]> {
  if (!process.env.VERCEL_AI_GATEWAY_API_KEY || places.length === 0) return places;

  const fallback = places;
  const ranked = await gatewayJson<{ places: Array<{ placeId: string; reason: string; rank: number }> }>(
    process.env.AI_GATEWAY_RANK_MODEL ?? "anthropic/claude-sonnet-4",
    [
      {
        role: "system",
        content:
          "Rankea restaurantes para una app de listas. Devuelve JSON con places: [{placeId, rank, reason}]. Reason debe ser una frase corta en español, concreta y no promocional."
      },
      {
        role: "user",
        content: JSON.stringify({ prompt, intent, places })
      }
    ],
    { places: fallback.map((place, index) => ({ placeId: place.placeId, reason: place.reason, rank: index + 1 })) }
  );

  const byId = new Map(places.map((place) => [place.placeId, place]));
  return ranked.places
    .sort((a, b) => a.rank - b.rank)
    .map((item) => {
      const place = byId.get(item.placeId);
      return place ? { ...place, reason: item.reason || place.reason } : undefined;
    })
    .filter((place): place is PlaceResult => Boolean(place));
}
