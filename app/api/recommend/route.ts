import { NextResponse } from "next/server";
import { demoRecommendations } from "@/lib/demo";
import { parseIntent, rankPlaces } from "@/lib/llm-router";
import { searchPlaces } from "@/lib/places";
import type { RecommendationResponse } from "@/lib/types";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    const intent = await parseIntent(prompt);
    const livePlaces = await searchPlaces(intent, prompt);
    const rawPlaces = livePlaces.length > 0 ? livePlaces : demoRecommendations(prompt);
    const rankedPlaces = livePlaces.length > 0 ? await rankPlaces(prompt, intent, rawPlaces) : rawPlaces;

    const response: RecommendationResponse = {
      mode: livePlaces.length > 0 ? "live" : "demo",
      intent,
      places: rankedPlaces,
      runId: crypto.randomUUID()
    };

    return NextResponse.json(response);
  } catch (error) {
    const prompt = "fallback";
    const response: RecommendationResponse = {
      mode: "demo",
      intent: { city: "Madrid", cuisine: "cena", vibe: "curado", constraints: ["fallback por error externo"] },
      places: demoRecommendations(prompt),
      runId: crypto.randomUUID()
    };

    return NextResponse.json(response, { status: 200 });
  }
}
