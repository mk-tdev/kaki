# KAKI Azure deployment guide

Production: **https://kaki-dun.vercel.app**. Vercel hosts the Next.js frontend and forwards authenticated HTTPS requests to a standalone NestJS API on Azure App Service. The API reaches PostgreSQL through a private endpoint and makes all OpenAI calls. Supabase is no longer part of the running application.

## Disposable Azure boundary

All newly provisioned Azure resources belong to **rg-kaki-azure-pilot**, Southeast Asia (Singapore). PostgreSQL server **kaki-pg-64cc2118**, database **kaki**: Burstable Standard_B1ms, PostgreSQL 17, 32 GiB storage, seven-day backups, no geo-redundant backup. This is a small pilot configuration, not a high-availability deployment.

Accounts, opaque sessions, quotas, missions, messages and consent records live in PostgreSQL. There is no Entra tenant, app registration, Key Vault or Web PubSub dependency to clean up separately. Entra External ID is tenant-scoped and was deliberately replaced by app-managed pilot accounts to meet the single-resource-group requirement. Live screens poll every 4–5 seconds and on focus; updates are not instant WebSocket delivery.

Vercel and OpenAI are existing external services and remain outside the resource group. Deleting Azure removes this branch's backend, not those accounts or deployments. Treat group deletion as irreversible data loss; export anything you want to retain first. Azure may retain service-managed recovery data according to its service retention rules.

## Architecture and resources

```text
Browser → Vercel Next.js → HTTPS → Azure NestJS API → VNet/private endpoint → PostgreSQL
```

The Next.js server handles the HttpOnly session cookie and forwards requests to NestJS. Browsers never receive the bridge key or database credentials. This same-origin bridge preserves server rendering and avoids cross-origin cookie/CORS requirements.

| Resource | Name |
| --- | --- |
| Resource group | `rg-kaki-azure-pilot` |
| Linux App Service plan (B1) | `plan-kaki-api` |
| NestJS App Service (Node 24) | `kaki-api-64cc2118` |
| VNet | `vnet-kaki-api` |
| App integration subnet | `api-integration`, `10.42.0.0/24` |
| Database endpoint subnet | `database-endpoint`, `10.42.1.0/24` |
| PostgreSQL private endpoint | `pe-kaki-postgres` |
| Private DNS zone | `privatelink.postgres.database.azure.com` |

API origin: **https://kaki-api-64cc2118.azurewebsites.net**. `/health` is public process readiness; `/api/health` requires the private bridge key and checks database connectivity. PostgreSQL public access is disabled. The deployed API resolves the database to `10.42.1.4` inside the VNet. Vercel needs no database firewall rule or static outbound IP.

### Request and secret flow

1. The browser calls `/api/*` on the same Vercel origin. It never calls Azure or PostgreSQL directly.
2. Next.js reads the opaque HttpOnly session cookie and forwards the request to Azure over HTTPS.
3. Next.js adds `API_BRIDGE_KEY` to prove the request came from the trusted frontend. The key never enters browser JavaScript.
4. NestJS validates the bridge key, resolves the user session, applies business and safety rules, and opens a restricted PostgreSQL transaction.
5. PostgreSQL is resolved through private DNS to the private endpoint. Its public network access is disabled.
6. NestJS calls OpenAI when a feature needs generation, suggestions, transcription, translation or matching. Only the Azure API reads `OPENAI_API_KEY`; it is never sent to the browser.

| Secret or setting | Required in Vercel | Required in Azure App Service | Operator copy |
| --- | --- | --- | --- |
| `APP_ORIGIN` | Yes | No | No |
| `API_BASE_URL` | Yes | No | No |
| `API_BRIDGE_KEY` | Yes | Yes | Local copy |
| `DATABASE_URL` (`kaki_app`) | No | Yes | Local copy |
| `DATABASE_ADMIN_URL` | No | **Never** | Yes |
| `AUTH_INVITE_CODE` | No | Yes | Local copy |
| `OPENAI_API_KEY` and model settings | No | Yes | Local source copy |

## End-to-end setup

Prerequisites are Node.js 24, npm, Python 3, Azure CLI and Vercel CLI. Authenticate both providers first:

```sh
az login
vercel login
```

For a brand-new disposable deployment, start from a machine whose current public IP may temporarily reach PostgreSQL for migrations:

```sh
npm ci
npm ci --prefix services/api
python3 scripts/azure/provision.py
npm run db:migrate
python3 scripts/azure/provision-api.py
```

Both provisioning scripts use `rg-kaki-azure-pilot`. The first creates PostgreSQL and the restricted runtime/admin credentials. The second creates the VNet, subnets, private DNS, private endpoint, App Service plan and NestJS app. They store generated identifiers and credentials in `.env.azure.local`, which is gitignored and mode 0600.

Add the OpenAI configuration to the gitignored `.env.local`, then deploy the API:

```dotenv
OPENAI_API_KEY=your-private-key
OPENAI_MODEL=gpt-5-mini
# Optional overrides; omit them to use the defaults shown below.
OPENAI_SUGGESTIONS_MODEL=gpt-4.1-nano
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_TRANSLATION_MODEL=gpt-4.1-mini
```

```sh
npm run api:deploy
```

After the API health check proves that PostgreSQL resolves privately, close the temporary public database path:

```sh
az postgres flexible-server update \
  --resource-group rg-kaki-azure-pilot \
  --name kaki-pg-64cc2118 \
  --public-access Disabled
```

Finally, link the frontend, add the three Vercel settings documented below, and deploy production. Do not put database or OpenAI credentials in the frontend deployment.

## Credentials and local development

`.env.azure.local` is a gitignored operator file (mode 0600) with Azure identifiers, runtime/admin database credentials, invitation and bridge key. `.env.frontend.local` contains only the frontend's API settings. Never commit either file.

```sh
npm ci
npm ci --prefix services/api
npm run azure:frontend-env
npm run azure:dev
```

The local frontend opens at http://localhost:5027 and uses the deployed Azure API. It uses `.next-azure`, leaving port 5026 available. Local laptops cannot directly reach the private database. For fully local backend development, use a separately configured local PostgreSQL database and the variables in `services/api/.env.example`.

To redeploy backend changes after `az login`:

```sh
npm run api:deploy
```

The deployment builds NestJS, packages production dependencies and deploys to the existing App Service. It securely applies runtime settings from `.env.azure.local` and existing `.env.local` AI settings. Administrator credentials are never deployed. Verify `/health` and the authenticated database health endpoint after deployment.

`npm run db:migrate` and the account operator commands require database network access: run them from a controlled VNet-connected operator environment with the private operator credentials. They no longer work directly from an ordinary laptop. Do not reopen public database access for routine application use. Migrations are checksum-tracked, locked and transactional; changing an applied migration is rejected. `supabase/migrations` is historical reference only.

## OpenAI configuration

OpenAI is configured on the NestJS App Service, not in Next.js. During `npm run api:deploy`, `scripts/azure/deploy-api.mjs` loads `.env.azure.local` first and `.env.local` second. Existing shell variables take precedence. It creates a private temporary JSON settings file, applies the selected values with Azure CLI, redacts known secrets from errors, deploys the compiled API, removes the temporary bundle, and waits for the database health check.

Before this migration, the Vercel project already contained `OPENAI_API_KEY` and `OPENAI_MODEL`. Those legacy copies remain present but the current Next.js frontend never reads them. The active key used by KAKI was copied independently into Azure by the deployment script. Remove the Vercel copies after any older deployment that used the former all-in-one Next.js backend is no longer needed.

The currently deployed App Service has `OPENAI_API_KEY` and `OPENAI_MODEL`. The other model variables are optional and currently use these code defaults:

| Feature | Setting | Default |
| --- | --- | --- |
| Mission structure, safety triage and match introduction | `OPENAI_MODEL` | `gpt-5-mini` |
| Live request suggestions | `OPENAI_SUGGESTIONS_MODEL` | `gpt-4.1-nano` |
| Voice transcription | `OPENAI_TRANSCRIPTION_MODEL` | `gpt-transcribe` |
| Translation | `OPENAI_TRANSLATION_MODEL` | `gpt-4.1-mini` |

If `OPENAI_API_KEY` is absent, mission drafting falls back to local rules. Suggestions, transcription, translation and AI match introductions report that the feature is unavailable. Quotas are enforced in PostgreSQL before paid AI calls.

To rotate the key, replace `OPENAI_API_KEY` in the private local source file or export it in the current shell, run `npm run api:deploy`, verify an AI request, and then revoke the old key in the OpenAI dashboard. Never paste the key into documentation, commit it, put it in a `NEXT_PUBLIC_*` variable, or pass it to Vercel. Azure app-setting commands can reveal values if queried without a name-only filter, so avoid copying raw CLI output into tickets or logs.

## Authentication differences

- Guests join instantly, receive a seven-day opaque HttpOnly cookie, and cannot recover access on another browser. The database stores only its SHA-256 hash.
- Permanent pilot accounts use email/password plus an organiser invitation (`AUTH_INVITE_CODE`). Share the invite privately with intended testers. Email ownership is **not verified**; these accounts remain unverified in the UI.
- Passwords use salted scrypt. Login, registration and guest creation have database-backed rate limits. Mutating API calls require the same Origin as the application.
- Password recovery is operator-assisted in this pilot. Set `KAKI_ACCOUNT_PASSWORD` privately in your shell and run `node --env-file=.env.azure.local scripts/azure/account.mjs reset EMAIL`. This revokes the account's existing sessions. The `create EMAIL NAME` action provisions an account directly.
- For a sustained public service, add verified email/recovery or adopt a managed identity provider as a separate scope decision. The current account flow is intended for the disposable pilot.

An administrator can enable/disable guest access with:

```sql
update public.demo_settings set guest_enabled = false where id = true;
```

Existing guest sessions stop resolving immediately on their next request. Set it back to `true` to reopen the event. To grant organiser access after independently checking the account, use the admin connection:

```sql
update public.profiles set role='organiser'
where id=(select id from auth.users where email='YOUR-ORGANISER-EMAIL');
```

## Security and database implementation

The runtime login is `NOINHERIT`, owns no application tables and has no direct access to identity tables. For each data operation the app opens a transaction, selects `anon` or `authenticated` using `SET LOCAL ROLE`, and supplies server-validated identity claims on that same connection. Commit/rollback clears both the role and identity before returning the connection to the pool. PostgreSQL RLS, column grants, triggers and atomic quotas remain active.

The `auth` schema is now application-owned PostgreSQL code; its familiar `auth.uid()` and `auth.jwt()` function names preserve the reviewed policies without any Supabase service connection. Runtime credentials are trusted server secrets: do not expose SQL endpoints or accept identity claims from clients.

TLS certificate validation is enabled. Use the generated URL without `sslmode` overrides. Each NestJS process has at most three database connections by default. Account for aggregate concurrency before increasing traffic; B1ms has limited memory/connections. Migrations always use the separate administrator connection.

## Vercel frontend configuration

The repository is linked to `muthukumars-projects-69200587/kaki`. Set these server-only variables for Production; use the matching stable alias for Preview if testing a branch:

| Variable | Value |
| --- | --- |
| `API_BASE_URL` | `https://kaki-api-64cc2118.azurewebsites.net` (no `/api` suffix) |
| `API_BRIDGE_KEY` | Copy from private `.env.frontend.local` |
| `APP_ORIGIN` | `https://kaki-dun.vercel.app` in Production |

Do not prefix these with `NEXT_PUBLIC_`. The bridge key authenticates the Next.js server to NestJS; opaque user sessions provide user identity separately. The frontend does not need `DATABASE_URL`, `DATABASE_ADMIN_URL`, `AUTH_INVITE_CODE` or `OPENAI_*`; those runtime secrets belong on Azure (except the admin URL, which belongs only with operators). Legacy Supabase and OpenAI settings in Vercel are unused and may be removed after confirming no older deployment depends on them.

The project root remains the repository root and uses the normal Next.js build. Deploy NestJS separately with `npm run api:deploy`. New builds require `npm ci --prefix services/api` only for backend builds and the combined repository tests, not for the Vercel frontend build.

Environment changes affect new deployments, so redeploy after updating a value. `APP_ORIGIN` must include `https://` and must exactly match the browser origin. A mismatch deliberately returns 403 for mutating API requests. The production deployment was verified with guest creation, session-cookie issuance, authenticated profile access and logout through the Vercel-to-Azure path.

## Existing Supabase data

This Azure pilot starts empty; it does not pretend old accounts or sessions migrated. The old database remains intact. Before a production replacement:

1. Inventory deployed schema versions and data counts, then export application rows plus the minimum identity mapping under controlled access.
2. Preserve UUIDs and relations. Create app identities before restoring profiles and dependent rows; account for the profile-creation trigger when importing existing profiles.
3. Do not import Supabase auth schemas, JWTs, password hashes or active cookies wholesale. Arrange new passwords for permanent accounts or implement a reviewed credential migration. Guest access requires a deliberate session transfer or fresh event entry.
4. Rehearse import and validate counts, ownership, consent, private messages and organiser roles.
5. Pause writes for final transfer and switch the production environment only after acceptance. Once Azure accepts new writes, rollback requires reconciling them.

## Verification

```sh
npm run api:build
npm run typecheck
npm run lint
npm test
KAKI_DIST_DIR=.next-azure npm run build -- --webpack
```

Database tests execute the actual Azure migrations in PostgreSQL/PGlite, including the restricted runtime role, transaction identity cleanup, row permissions, concurrent-claim guards, presence upserts, private chat, quotas, cancellation and joint consent. Also exercise the actual Azure-backed app with separate requester/helper sessions before deployment.

## Provisioning another disposable pilot

The current resources are already provisioned. `python3 scripts/azure/provision.py` is for a fresh setup after `az login`; it refuses to overwrite an existing group or credential file. It creates the named group and PostgreSQL resources. Then run `python3 scripts/azure/provision-api.py` to add the API, VNet and private endpoint in the same group. Deploy and verify private connectivity before disabling PostgreSQL public access with `az postgres flexible-server update -g rg-kaki-azure-pilot -n kaki-pg-64cc2118 --public-access Disabled`. If provisioning is interrupted, inspect the existing resources and resume the failed step; do not discard the credential file. The script uses Azure CLI and incurs Azure charges while the server exists.

## Teardown

First export any data you need and stop the local Azure server/disable its Vercel preview. Then run:

```sh
az group delete --name rg-kaki-azure-pilot --yes --no-wait
az group exists --name rg-kaki-azure-pilot
```

The second command eventually returns `false`. Remove the branch's Vercel secrets and delete the local `.env.azure.local` and `.env.frontend.local` when no longer needed. These secret copies are not Azure resources and are not deleted with the group. No teardown runs automatically.
