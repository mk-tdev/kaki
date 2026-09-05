# Azure PostgreSQL pilot

Branch: `feature/azure-postgres-backend`. Vercel continues hosting the app; Supabase is no longer used by this branch. Existing Supabase data and production deployments are not modified.

## Disposable Azure boundary

All newly provisioned Azure resources belong to **rg-kaki-azure-pilot**, Southeast Asia (Singapore). PostgreSQL server **kaki-pg-64cc2118**, database **kaki**: Burstable Standard_B1ms, PostgreSQL 17, 32 GiB storage, seven-day backups, no geo-redundant backup. This is a small pilot configuration, not a high-availability deployment.

Accounts, opaque sessions, quotas, missions, messages and consent records live in PostgreSQL. There is no Entra tenant, app registration, Key Vault or Web PubSub dependency to clean up separately. Entra External ID is tenant-scoped and was deliberately replaced by app-managed pilot accounts to meet the single-resource-group requirement. Live screens poll every 4–5 seconds and on focus; updates are not instant WebSocket delivery.

Vercel and OpenAI are existing external services and remain outside the resource group. Deleting Azure removes this branch's backend, not those accounts or deployments. Treat group deletion as irreversible data loss; export anything you want to retain first. Azure may retain service-managed recovery data according to its service retention rules.

## Credentials and local development

Provisioning writes **.env.azure.local** with mode 0600. It is gitignored and contains the admin connection, restricted runtime connection and registration invite. Never print or commit it, and never give the admin connection to Vercel.

```sh
npm ci
npm run db:migrate
npm run azure:dev
```

Open http://localhost:5027/share in separate browser profiles for requester and helper. The isolated server uses `.next-azure` and leaves port 5026 available. Existing `.env.local` supplies the existing OpenAI settings; the explicitly loaded Azure database variables take precedence. Keep secrets out of screenshots and terminal recordings.

`npm run db:migrate` applies checksum-tracked migrations under `db/migrations`, using an advisory lock and one transaction per migration. It then sets the `kaki_app` password from the runtime URL. Re-running it is safe; changing an applied migration is rejected. `supabase/migrations` remains historical reference only.

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

TLS certificate validation is enabled. Use the generated URL without `sslmode` overrides. Each Vercel instance has at most three database connections by default. Account for aggregate concurrency before increasing traffic; B1ms has limited memory/connections. Migrations always use the separate administrator connection.

## Network access and Vercel preview

The server uses a public endpoint with an explicit developer-IP firewall rule, not an allow-all rule. A local IP change requires updating `developer-current-ip` with your new public IPv4 address:

```sh
az postgres flexible-server firewall-rule update \
  --resource-group rg-kaki-azure-pilot \
  --server-name kaki-pg-64cc2118 --name developer-current-ip \
  --start-ip-address YOUR_IP --end-ip-address YOUR_IP
```

Before deploying this branch on Vercel, obtain [stable Vercel egress IPs](https://vercel.com/changelog/static-ips-are-now-available-for-more-secure-connectivity) for the selected deployment/region and add narrow rules for those addresses. Ordinary changing serverless egress addresses cannot be reliably allowlisted. Do not solve this by silently opening PostgreSQL to the internet. If static egress is unavailable in your Vercel plan, keep the local Azure pilot running and choose either the relevant Vercel network option or an Azure-hosted API in the same resource group before deploying.

Set these **branch-scoped Preview** environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Restricted `kaki_app` URL from the private file |
| `DATABASE_POOL_MAX` | `3` initially |
| `AUTH_INVITE_CODE` | Private organiser invitation |
| `APP_ORIGIN` | Exact HTTPS origin of the preview |
| Existing `OPENAI_*` settings | Existing AI configuration |

Never set `DATABASE_ADMIN_URL` on Vercel. Supabase public environment variables are unused by this branch and can be removed from that preview environment. Do not change production settings until the preview has passed the full journey. Keep the app and database geographically close and measure navigation latency before claiming a speed improvement.

## Existing Supabase data

This Azure pilot starts empty; it does not pretend old accounts or sessions migrated. The old database remains intact. Before a production replacement:

1. Inventory deployed schema versions and data counts, then export application rows plus the minimum identity mapping under controlled access.
2. Preserve UUIDs and relations. Create app identities before restoring profiles and dependent rows; account for the profile-creation trigger when importing existing profiles.
3. Do not import Supabase auth schemas, JWTs, password hashes or active cookies wholesale. Arrange new passwords for permanent accounts or implement a reviewed credential migration. Guest access requires a deliberate session transfer or fresh event entry.
4. Rehearse import and validate counts, ownership, consent, private messages and organiser roles.
5. Pause writes for final transfer and switch the production environment only after acceptance. Once Azure accepts new writes, rollback requires reconciling them.

## Verification

```sh
npm run typecheck
npm run lint
npm test
KAKI_DIST_DIR=.next-azure npm run build -- --webpack
```

Database tests execute the actual Azure migrations in PostgreSQL/PGlite, including the restricted runtime role, transaction identity cleanup, row permissions, concurrent-claim guards, presence upserts, private chat, quotas, cancellation and joint consent. Also exercise the actual Azure-backed app with separate requester/helper sessions before deployment.

## Provisioning another disposable pilot

The current resources are already provisioned. `python3 scripts/azure/provision.py` is for a fresh setup after `az login`; it refuses to overwrite an existing group or credential file. It creates only the named group and PostgreSQL resources. If provisioning is interrupted, inspect the existing resources and resume the failed step; do not discard the credential file. The script uses Azure CLI and incurs Azure charges while the server exists.

## Teardown

First export any data you need and stop the local Azure server/disable its Vercel preview. Then run:

```sh
az group delete --name rg-kaki-azure-pilot --yes --no-wait
az group exists --name rg-kaki-azure-pilot
```

The second command eventually returns `false`. Remove the branch's Vercel secrets and delete the local `.env.azure.local` when no longer needed. These secret copies are not Azure resources and are not deleted with the group. No teardown runs automatically.
