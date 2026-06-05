# PlaceShelf

V1 web para pedir recomendaciones de sitios, guardarlas en listas propias y abrir cada lugar con un enlace oficial de Google Maps.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lucide-react
- Firebase Auth + Firestore
- Google Places API
- Vercel AI Gateway

## Modo demo

La app funciona sin claves con datos demo. Al configurar `.env.local`, `/api/recommend` usará Places API y Vercel AI Gateway cuando estén disponibles.

## Arranque local

```bash
npm install
npm run dev
```

## Variables

Copia `.env.example` a `.env.local` y añade las claves reales. La app no escribe en listas nativas de Google Maps; guarda listas propias y abre fichas de Maps con:

```text
https://www.google.com/maps/search/?api=1&query=NOMBRE&query_place_id=PLACE_ID
```
