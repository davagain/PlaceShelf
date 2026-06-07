import { NextResponse } from "next/server";
import { demoRecommendations } from "@/lib/demo";
import { parseIntent, rankPlaces } from "@/lib/llm-router";
import { searchPlaces } from "@/lib/places";
import type { RecommendationResponse } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  const requestStartedAt = Date.now();
  const hasPlacesKey = Boolean(process.env.GOOGLE_PLACES_API_KEY);

  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    const intent = await parseIntent(prompt);
    const livePlaces = await searchPlaces(intent, prompt);
    const rawPlaces = livePlaces.length > 0 ? livePlaces : hasPlacesKey ? [] : demoRecommendations(prompt);
    const rankedPlaces = livePlaces.length > 0 ? await rankPlaces(prompt, intent, rawPlaces) : rawPlaces;

    const response: RecommendationResponse = {
      mode: livePlaces.length > 0 ? "live" : "demo",
      intent,
      places: rankedPlaces,
      runId: crypto.randomUUID(),
      diagnostic:
        livePlaces.length > 0
          ? `Places live (${Date.now() - requestStartedAt}ms)`
          : hasPlacesKey
            ? "Google Places no devolvió resultados live para esta búsqueda. Revisa restricciones/billing si ocurre siempre."
            : "Sin GOOGLE_PLACES_API_KEY; usando datos demo"
    };

    return NextResponse.json(response);
  } catch (error) {
    const fallbackPlaces = hasPlacesKey ? [] : demoRecommendations("fallback");
    const response: RecommendationResponse = {
      mode: "demo",
      intent: { city: "Madrid", cuisine: "cena", vibe: "curado", constraints: ["fallback por error externo"] },
      places: fallbackPlaces,
      runId: crypto.randomUUID(),
      diagnostic: error instanceof Error ? error.message : "Error externo desconocido"
    };

    return NextResponse.json(response, { status: 200 });
  }
}
