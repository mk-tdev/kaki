# KAKI

**One small favour. One real neighbour.**

KAKI is a mobile-first neighbour action network for Pek Kio, Singapore. It turns a natural-language need into a safe, bite-sized community mission, matches it to a nearby helper, guides the interaction, and makes completed moments visible through a living community mural.

## Product flows

- Public campaign landing page and downloadable event poster
- Supabase email/password authentication and role onboarding
- English, Mandarin, Malay and Tamil request entry
- Browser speech recognition with typed-input fallback
- OpenAI structured mission generation with Zod validation
- Live OpenAI assistance suggestions as a resident types
- Offline-safe local mission generation when no API key is configured
- Helper mission discovery, search and category filters
- Explainable matching and three-step volunteer guidance
- Mission acceptance, start, chat, completion and sharing consent
- Animated Kampung Bloom wall with live impact metrics
- Helper profile, skills, language and availability settings
- Organiser queue, safety review and impact dashboard
- Installable PWA manifest, service worker and offline route
- Supabase Postgres schema, explicit Data API grants and RLS policies

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4
- OpenAI Responses API with structured output
- Supabase Auth, Postgres and Row Level Security
- Motion for the community mural
- Vitest for AI rule and schema tests

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:5026](http://localhost:5026).

The application connects directly to the hosted Supabase project configured in
`.env.local`; starting a local Supabase stack is not required.

The public `/demo` routes contain clearly labelled sample content. Product routes require a real Supabase account and only use cloud-backed records. Without `OPENAI_API_KEY`, live AI suggestions are hidden and mission creation uses clearly labelled, deterministic safety-aware local rules.

## Connect Supabase

1. Create or select a Supabase project.
2. Copy the project URL and publishable key into `.env.local`.
3. Link the CLI and apply the migration:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migrations under `supabase/migrations` create profiles, missions, messages, mission events, availability, blooms and notifications. Every exposed table has RLS enabled. New-table Data API privileges are granted explicitly to account for Supabase’s 2026 API exposure changes.

For local Supabase development, start Docker Desktop and run:

```bash
npx supabase start
npx supabase db reset
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `OPENAI_API_KEY` | Server-only suggestions and mission generation |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5-mini` |

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Key routes

| Route | Purpose |
| --- | --- |
| `/` | Public product story |
| `/home` | Personal community dashboard |
| `/ask` | Voice/text request creation |
| `/discover` | Helper mission board |
| `/missions/[id]` | Mission coordination and completion |
| `/bloom` | Live community impact mural |
| `/organiser` | Operations and safety dashboard |
| `/profile` | Skills, availability and settings |
| `/poster` | Campaign poster preview/download |
| `/demo` | Clearly labelled sample product tour |
| `/share` | Presentation QR code for the deployed app |
| `/ai-use` | Transparent runtime and build-time AI explanation |

## Safety model

KAKI organises community support; it does not provide clinical, emergency or professional advice. Requests involving crisis, abuse, urgent medical symptoms, money transfer, private-home access or unsafe electrical work are routed for organiser review. Matching defaults to an approved public meeting point and never exposes home addresses.

## Campaign assets

- `public/assets/kaki-event-poster.png`
- `public/assets/kaki-community-hero.png`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

The raster artwork was generated specifically for KAKI. The logo and UI category icons are code-native vectors for crisp rendering and easy iteration.
