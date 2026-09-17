# Skincare Playground — playable prototype

A browser mini-game prototype built with Next.js, TypeScript, and Tailwind CSS. It uses the supplied character PNG assets only and keeps all game state local in React.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current flow

1. Intro / dryness setup
2. Cleansing — select cleanser, pointer-drag across five invisible face zones
3. Toner — tap each invisible zone three times
4. Serum select — Calming / Hydration / Brightening; Hydration is marked Best Match for dryness
5. Serum application — drag over three serum drop zones until absorbed
6. Cream — blend five cream dots by dragging
7. Result — glowing supplied character asset, stats, XP, recommendation button

## Input

Gameplay uses Pointer Events, so the same face interactions work with mouse, pen, and touch.

## Main code

- `components/skincare-game.tsx` — playable flow and presentation
- `lib/game.ts` — step model, face-zone coordinates, serum mock data, game helpers
- `app/globals.css` — Y2K / Korean browser-game styling and feedback animations
- `public/assets/` — renamed copies of the supplied PNG assets

## Future integration points

The prototype intentionally does not include a database, authentication, AI, Supabase, or ecommerce APIs. `selectedSerum`, the mock `SERUMS` data, and the final recommendation button are clean handoff points for a later skin profile, recommendation engine, product database, and character dialogue layer.
