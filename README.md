# KAKI

**One small favour. One real neighbour.**

KAKI is a mobile-first neighbour action network for Pek Kio, Singapore. It turns a natural-language need into a safe, bite-sized community mission, lets a neighbour choose to help, guides the interaction, and makes completed moments visible through a living community mural.

## Product flows

- Public campaign landing page and downloadable event poster
- Switchable instant guest entry with opaque server-managed sessions; normal email/password accounts remain available
- English, Mandarin, Malay and Tamil request entry
- Recorded speech transcription with typed-input fallback
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
- Azure PostgreSQL schema with restricted runtime roles and RLS policies

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS 4
- OpenAI Responses API with structured output
- Azure NestJS API, private Azure PostgreSQL, server-managed sessions and Row Level Security
- Motion for the community mural
- Vitest for AI rule and schema tests

## Azure deployment

Production uses a Vercel Next.js frontend, an HTTPS NestJS API on Azure App Service, and Azure PostgreSQL reached through a private endpoint. The API owns database access, sessions, business rules and OpenAI calls.

See the [complete Azure deployment guide](docs/AZURE.md) for the architecture, provisioning order, OpenAI secret flow, Vercel configuration, private networking, verification and teardown.

```sh
npm ci
npm ci --prefix services/api
npm run azure:frontend-env
npm run azure:dev
```

The isolated Azure development server opens on http://localhost:5027. Product routes use the deployed Azure API; `/demo` remains labelled sample content. No existing Supabase data or sessions are automatically imported.

Permanent pilot accounts require an organiser invitation and do not verify email ownership. Guest entry remains instant. All newly created Azure resources are in `rg-kaki-azure-pilot`; deleting that group removes the backend.

The `.env.example` documents the frontend API settings; `services/api/.env.example` documents backend settings. Private operator credentials stay in `.env.azure.local`; generated `.env.frontend.local` contains only the API connection settings. PostgreSQL public access is disabled, so operator database tools require a VNet-connected environment. Audio is processed transiently and not stored.

## Quality checks

```bash
npm run api:build
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

## Event operation

See [the Azure guide](docs/AZURE.md) for the guest switch, organiser access, account resets and resource-group teardown. Guest request limits remain three per 15 minutes; AI quotas remain 60 per identity and 1,000 globally per hour.

PWA caching is limited to public assets and the offline notice. Private pages, messages and API responses are not cached, and offline mutations are not queued.

## Campaign artwork

- `public/assets/kaki-event-poster.png`
- `public/assets/kaki-community-hero.png`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

The raster artwork was generated specifically for KAKI. The logo and UI category icons are code-native vectors for crisp rendering and easy iteration.
