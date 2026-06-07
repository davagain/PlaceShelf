# PlaceShelf

PlaceShelf is an AI-assisted place list app: ask for places, get real Google Places candidates, save them into your own lists, and open each place in Google Maps when you are ready to go.

It is intentionally **not** a Google Maps saved-list writer. Google does not expose a public API for writing to native Maps lists such as Favorites, Want to go, or custom saved lists. PlaceShelf keeps its own lists and uses Google Maps as the final place viewer.

## What It Does

- Turns prompts like `canelones in Barcelona` or `cozy dinner in Chamberi` into place recommendations.
- Resolves real places with Google Places API.
- Saves places into local PlaceShelf lists.
- Opens each place with an official Google Maps URL.
- Exports lists through email, TXT, and JSON.
- Keeps a small LLM router layer ready for Vercel AI Gateway and future providers such as OpenRouter.

## Current V1 Scope

Implemented:

- Next.js app deployed on Vercel.
- Google Places lookup with Places API New and legacy fallback.
- Demo mode when no Places key is configured.
- Local list storage with `localStorage`.
- List actions: save, remove, mark as opened in Maps, mark as saved manually in Maps.
- Share/export actions: public view route, copy link, email, TXT, JSON.

Not implemented yet:

- Native Google Maps list import/export.
- User accounts as a required flow.
- Firestore persistence as the default storage.
- OpenRouter provider.
- Domain setup for `placeshelf.com`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react
- Google Places API
- Vercel AI Gateway-ready LLM router
- Firebase Auth/Firestore scaffolding, currently optional

## Architecture

```text
User prompt
  -> /api/recommend
  -> parseIntent()
  -> Google Places Text Search
  -> rankPlaces()
  -> place cards with Google Maps URLs
  -> local PlaceShelf list
```

The app tries Google Places API New first:

```text
POST https://places.googleapis.com/v1/places:searchText
```

If that fails, it falls back to legacy Text Search:

```text
GET https://maps.googleapis.com/maps/api/place/textsearch/json
```

## Google Maps Limitation

PlaceShelf cannot programmatically save places into a user's native Google Maps lists. The supported flow is:

```text
Save in PlaceShelf
  -> Open in Google Maps
  -> User manually clicks Save in Google Maps
```

Each place uses an official URL:

```text
https://www.google.com/maps/search/?api=1&query=NOMBRE&query_place_id=PLACE_ID
```

## Environment Variables

Minimal live setup:

```bash
GOOGLE_PLACES_API_KEY=
```

Optional AI Gateway setup:

```bash
VERCEL_AI_GATEWAY_API_KEY=
AI_GATEWAY_PARSE_MODEL=google/gemini-2.5-flash-lite
AI_GATEWAY_RANK_MODEL=anthropic/claude-sonnet-4
```

Firebase is optional for now:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Run checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## AI Router Notes

The router is intentionally small. It separates tasks from providers/models:

```text
parse_intent -> cheap/fast model
rank_places  -> better reasoning/copy model
```

Today it uses Vercel AI Gateway defaults if no model env vars are set. Future work can add:

- OpenRouter provider for Qwen, DeepSeek, Kimi, GLM, MiniMax, etc.
- Fallback rules per task.
- Cost logging.
- User-tier routing.
- Prompt caching for long repeated context.

## Product Direction

PlaceShelf is a learning-friendly product shell for experimenting with:

- AI gateways
- model routing
- Google Places
- place-list UX
- export/share flows
- cost and fallback strategy

The product thesis:

```text
Google Maps tells you where a place is.
PlaceShelf helps you decide what deserves to be on your list.
```
