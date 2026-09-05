# KAKI

**One small favour. One real neighbour.**

KAKI is a mobile-first neighbour action network for Pek Kio, Singapore. It turns a natural-language need into a safe, bite-sized community mission, lets a neighbour choose to help, guides the interaction, and makes completed moments visible through a living community mural.

## Product flows

- Public campaign landing page and downloadable event poster
- Switchable instant guest entry with anonymous Supabase sessions; normal email/password accounts remain available
- English, Mandarin, Malay and Tamil request entry
- Browser speech recognition with typed-input fallback
- OpenAI structured mission generation with Zod validation
- Live OpenAI assistance suggestions as a resident types
- Offline-safe local mission generation when no API key is configured
- Helper mission discovery, search and category filters
- Explainable matching and three-step volunteer guidance
- Mission acceptance, start, chat, completion and sharing consent
- Animated Kampung Bloom wall with live impact metrics
- Optional helper name, skills and language; availability is confirmed in chat
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

The public `/demo` routes contain clearly labelled sample content. Product routes use cloud-backed records. During guest mode, a temporary Supabase identity is created silently in the browser. Outside guest mode, normal sign-in/onboarding applies. Without `OPENAI_API_KEY`, live AI suggestions are hidden and mission creation uses clearly labelled, deterministic safety-aware local rules.

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

The app always uses Supabase cloud. The isolated PGlite tests run PostgreSQL in memory for schema/permission checks, not as an application backend.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `OPENAI_API_KEY` | Server-only suggestions and mission generation |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-5-mini` |
| `OPENAI_SUGGESTIONS_MODEL` | Independent fast autocomplete model; defaults to `gpt-4.1-nano` |

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
| `/profile` | Optional identity, skills, language and settings |
| `/poster` | Campaign poster preview/download |
| `/demo` | Clearly labelled sample product tour |
| `/share` | Separate ask/help QR codes for two phones |\n| `/live` | Public, jointly-consented Bloom projection wall |\n| `/demo/journey` | Labelled animated journey rehearsal (no writes) |
| `/ai-use` | Transparent runtime and build-time AI explanation |

## Safety model

KAKI organises community support; it does not provide clinical, emergency or professional advice. Requests involving crisis, abuse, urgent medical symptoms, money transfer, private-home access or unsafe electrical work are routed for organiser review. AI drafts suggest a public community meeting point; participants must confirm it. AI triage is not a guarantee of safety or an emergency response. Guest identities are not verified. The app does not collect GPS coordinates; people must avoid posting private details.

## Event activation and shutdown

The `guest_journey` migration is prepared locally; cloud activation requires approval before deployment. Do not deploy this code ahead of its schema migration.

1. Apply the reviewed `guest_journey` migration to cloud project `kaki` (`hiisylhgisawznisqtfp`). It adds the event switch, guest tags, presence/consent records, shared AI quotas and an atomic Bloom trigger. Existing records are not deleted.
2. Enable **Allow anonymous sign-ins** in Supabase Authentication → Sign In / Providers. Keep email confirmation enabled for normal accounts.
3. Deploy the app, open `/share`, and use separate phones/browser profiles for requester and helper. Browser tabs normally share one identity.
4. Ask → publish → other phone accepts → optional AI introduction → chat → each checks in → helper starts → helper completes. A public Bloom requires each participant to opt in separately before completion.
5. Project `/live` to show real, consented stories. Use `/demo/journey` only for labelled visual rehearsal; it does not create data.

After the event, an authorised administrator can turn off the cloud switch:

```sql
update public.demo_settings set guest_enabled = false where id = true;
```

This blocks existing anonymous JWTs through restrictive RLS and prevents new guest-profile creation. Also disable anonymous sign-ins in the Auth dashboard. Permanent account sign-in stays available. Turn the switch back to `true` and re-enable anonymous sign-ins for a later event. No deployment is needed for the switch.

Guest requests are tagged `missions.is_demo`; do not mix event activity with independently verified community impact. Data is retained, not automatically deleted. Review specific event records before any cleanup; mission ownership prevents blindly deleting anonymous auth users. Users cannot recover guest access after signing out, clearing browser data, or changing devices.

Limits: three published guest requests per 15 minutes; 60 AI calls per identity per clock hour and 1,000 app-wide per clock hour. Supabase also rate-limits anonymous signups by IP (default 30/hour): shared event Wi-Fi may hit this, so plan network capacity or use mobile data. For ongoing public access, add invisible CAPTCHA and review quotas. Existing public stories created before this migration retain their original consent status; this change does not retrospectively certify two-party consent for those records.

PWA caching is limited to public static assets and the offline notice. Private pages, messages and API responses are never cached by the service worker. Mutations require a connection and are not queued offline.

## Campaign artwork

- `public/assets/kaki-event-poster.png`
- `public/assets/kaki-community-hero.png`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

The raster artwork was generated specifically for KAKI. The logo and UI category icons are code-native vectors for crisp rendering and easy iteration.
