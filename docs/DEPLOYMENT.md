# Deploying Matchmelo later

The public preview is hosted at `https://matchmelo.crispchime4.chatgpt.site/` with `APP_ENV=preview`. `/preview` uses fictional browser data and collects no account information or selfies. The real account system stays available in the code and local development. The hosted auth secret and canonical origin are configured separately from source. Real registration and email recovery require the verified sending domain and provider key below, followed by `APP_ENV=production`. No custom DNS or email provider account has been configured.

## 1. Choose the host and prepare accounts

This checkout uses Vinext/React on Cloudflare Workers, D1 (`DB`), and private R2 (`BUCKET`). You can publish through Sites later, preserving `.openai/hosting.json`, or use your own Cloudflare account with the standalone configuration below. Choose one target and use a separate staging database first.

For your own Cloudflare account, install dependencies with `npm run install:ci`, then authenticate the Wrangler CLI with `npx wrangler login`. Create a D1 database and an R2 bucket with `npx wrangler d1 create matchmelo-production` and `npx wrangler r2 bucket create matchmelo-private`. Save the returned database UUID. Keep the bucket private; do not enable an R2 public URL.

Set up a sending domain in Resend and complete its DNS verification. The email adapter needs an API key and a sender on that verified domain. See [Resend’s Workers guide](https://resend.com/docs/send-with-cloudflare-workers). Registering and recovering accounts fail closed when production email settings are absent. Delivery failures emit `account_email_delivery_failed`; monitor those errors and the email provider dashboard. Members can resend a confirmation link.

Choose a real reviewer mailbox. Register and confirm that account normally; only confirmed emails in `REVIEWER_EMAIL` (or comma-separated `REVIEWER_EMAILS`) can use `/review`. There is no client-side role switch. Reviewers cannot approve their own profile.

## 2. Build and prepare standalone configuration

Run `npm run typecheck`, `npm test`, and `npm run build`. Then replace the example values in this command:

```powershell
node scripts/prepare-deploy.mjs --app-url https://your-domain.example --database-id YOUR-D1-UUID --database-name matchmelo-production --bucket-name matchmelo-private --reviewer-email reviewer@your-domain.example
```

This writes `dist/server/wrangler.production.json` with the built Worker, assets, real bindings, and a 15-minute maintenance trigger. It does not deploy. Re-run it after every build, because `dist` is generated. Configure your chosen HTTPS domain on the Worker and make `APP_URL` match that single canonical origin. Redirect alternate origins before serving the application. Do not put production secrets in `.dev.vars`, source control, command arguments, or frontend code.

Use Wrangler’s interactive secret prompts, with `--config dist/server/wrangler.production.json`, to set `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, and `EMAIL_FROM`. Generate a unique cryptographically random auth secret with at least 32 characters in your password manager. Never reuse the local secret. Keep it stable across deployments; changing it invalidates signed sessions and links.

```powershell
npx wrangler secret put BETTER_AUTH_SECRET --config dist/server/wrangler.production.json
npx wrangler secret put RESEND_API_KEY --config dist/server/wrangler.production.json
npx wrangler secret put EMAIL_FROM --config dist/server/wrangler.production.json
```

## 3. Configure video relay

The current adapter supports coturn’s REST shared-secret credentials. Set `TURN_URLS` to your comma-separated TURN/TURNS endpoints and `TURN_SHARED_SECRET` to the matching coturn `static-auth-secret`. Configure coturn with `use-auth-secret`, a realm, TLS certificate where applicable, and appropriate network/firewall settings. See the [official coturn server reference](https://github.com/coturn/coturn/blob/master/README.turnserver).

The server issues credentials lasting ten minutes. When both settings exist, calls use relay-only transport. Without them, the app uses STUN and direct peer connections, which can fail on restrictive networks and expose peer network addresses. A Cloudflare Realtime TURN API key is **not** interchangeable with this coturn shared-secret adapter. Test relay connectivity on two real devices using different networks before inviting members. Account for relay bandwidth and Worker CPU/storage usage; this implementation does not guarantee a zero-cost production service.

## 4. Migrate and deploy when ready

Back up any existing database before applying migrations. Do not edit applied migrations, import local SQLite/R2 state, or run the local demo seeder against production. Migration `0000` preserves the earlier passport schema; `0001` adds accounts/social data `0002` adds retryable media cleanup, and `0003` blocks self-connections and invalid message senders at the database boundary. Existing ChatGPT-based passport records are not silently assigned to new email accounts. A migration between those identities requires a deliberate ownership check later.

For a standalone Worker, the launch commands are:

```powershell
npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.production.json
npx wrangler deploy --config dist/server/wrangler.production.json
```

These are instructions for later; they have not been executed. For Sites hosting instead, set equivalent production runtime variables through Sites, preserve its D1/R2 bindings, and publish through the native Sites workflow. Do not use the standalone database IDs to overwrite Sites-managed bindings. Confirm how maintenance is invoked on that host; the standalone Cron Trigger configuration is not an assertion that Sites has installed a schedule.

## 5. Confirm before opening the pilot

Test signup and confirmation delivery, password recovery, secure cookies on HTTPS, session revocation, and anonymous access rejection. Submit a new member profile with a separate public photo and private selfie; approve it from the reviewer account. Test mutual matching, messaging, reporting, suspension, block/unmatch, export, and deletion across two member accounts. Confirm that private API, account, and media responses return `private, no-store` and that the R2 bucket has no public access.

Verify the maintenance trigger runs. It clears expired sessions and reset records, stale rate windows, local test emails, expired call signaling, and pending file deletions. New uploads are staged in a durable deletion queue for one hour until attached to a record; failed deletes stay queued for retry. Do not configure a broad lifecycle rule that deletes active profile photos or selfies.

Set a responsible operator/support contact, actual retention and backup policy, review coverage, and incident response process for the pilot. Review the displayed privacy/terms copy for your operation before collecting real members. Manual selfie review and declared age do not verify government identity, legal age, or liveness.

Use Cloudflare database export/restore facilities and test recovery in staging. See [D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/). File backups need a separate private R2 plan. A database rollback alone cannot restore a deleted file. Roll back application code through the host’s versions while keeping migrations forward-compatible; never blindly reverse a schema migration on live member data.

## What has been tested locally

Unit checks and TypeScript pass. Real-cookie HTTP integration covers account confirmation, resets and replay rejection, sliding sessions, revocation, throttling, private selfies, review invalidation, data isolation, ten-profile limits, reciprocal matching, shared chat, consented call signaling, feedback, moderation suspension, blocking, export, and deletion cleanup. Actual camera/microphone calls across networks and production email delivery remain deployment-stage checks. The final browser automation attempt could not initialize, so the last layout changes still need a visual check.
