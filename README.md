# Matchmelo

Mobile-friendly dating website with a public landing page, email/password accounts, private Digital Passports, and database-backed member features. The public preview is published at [matchmelo.crispchime4.chatgpt.site](https://matchmelo.crispchime4.chatgpt.site/). Open [the interactive demo](https://matchmelo.crispchime4.chatgpt.site/preview) without an account. Source is maintained at [Advaita-expo/matchmelo](https://github.com/Advaita-expo/matchmelo).

## Public preview

The hosted preview runs with `APP_ENV=preview`. Its `/preview` experience shares the member dashboard UI and uses explicitly fictional browser data. Explore preferences, sample likes, matches, messages, profile/passport examples, date ideas, and demo coupons without supplying personal information. No demo messages reach real people, no selfies are uploaded, and live calls are not connected. It has no shared admin password or authentication bypass. Reset clears only the public demo’s own browser storage.

Real email/password accounts, D1/R2 records, manual review, and shared member conversations remain in the full application code. The preview’s sign-in screen directs visitors to the interactive demo. Configure a verified email sender and set `APP_ENV=production` to enable real registration and recovery; see the deployment guide. Local development retains the normal account system and seeded logins.

## Implemented

- Signup, email confirmation, login/logout, password recovery/change, seven-day sliding cookie sessions, device revocation, and database-backed throttling through Better Auth 1.7.15. Passwords are hashed; session tokens are not kept in localStorage.
- `/dates` planner with neighbourhood/city search, Google Maps links for cafés/restaurants/desserts/walks, and clearly labeled demo couple coupons. No live discount, free drink, or restaurant partnership is claimed.
- Public `/invest` page for founder Shlok Chauhan, equity fundraising, and a direct WhatsApp conversation link.
- Saved profiles, separately consented public profile photos, private selfie uploads or camera capture, expiring one-use submission prompts, manual review, and review invalidation after edits.
- Reviewer-only profile queue and reported-profile decisions, including session-revoking account suspension. Reviewers cannot approve themselves.
- Preferences and visibility, a saved batch of up to ten eligible introductions per account/day, likes, atomic mutual matches, shared messages with retry deduplication, blocking, unmatching, and reports.
- Accepted video invitations, private signaling, WebRTC device controls, optional coturn relay credentials, and private mutual follow-up choices. Calls are not recorded. Real two-device media connectivity still needs testing.
- Data export and account/passport deletion; private D1/R2 ownership checks, no-store responses, staged file uploads, and a durable retry queue for file deletion.
- Public content before sign-in, account/profile/settings pages, responsive layouts, portrait images, and a bottom-right safety footer in document flow. The hero passport card now occupies its own row below the portraits.

A Digital Passport is a profile and manual-review record. It does not verify government identity, legal age, or liveness.

## Run locally

Use Node.js 22.13 or newer and Python 3 for optional local fixtures/tests. From this folder:

```powershell
npm run install:ci
npm run setup:local
npm run build
npm run db:local
npm start -- --port 4183
```

Open http://127.0.0.1:4183/ while the server is running. The setup script generates a secret in ignored `.dev.vars`. Local email links are captured in the local database and shown by the auth UI; no real email is delivered. This mailbox route works only with development mode and a loopback request. Do not expose the development server to an untrusted network.

For editing, use `npm run dev -- --port 4183 --hostname 127.0.0.1` after setup/migration. Run only one server at that address. Both preview modes use `.wrangler/matchmelo-state`; the old prototype state is preserved separately.

## Try the supplied photos

While the local server runs, use a second terminal:

```powershell
npm run seed:local
```

The seed uses the real local APIs to create eleven fictional profiles from the eight extracted PDF portraits and three supplied boys’ photos, plus a demo member with a distinct illustrated avatar. The demo member’s avatar is separate from the prospect photos. Names, ages, reviews, interests, and conversation details are fixtures. Every demo biography identifies itself and the development UI displays a banner. The seed refuses a non-development server and is never part of deployment.

Local member: `demo-you@matchmelo.test`. Local reviewer: `admin@matchmelo.test`. Disposable password for these fixtures: `Local-Matchmelo-Only-2026!`. These credentials belong only to the local test database and must never be used for real accounts or production. The integration suite reuses a seeded reviewer and isolates test members in a separate fictional city.

## Validate

```powershell
npm run typecheck
npm test
npm run test:e2e
```

The real-cookie integration suite requires the built local Worker on port 4183. It creates and cleans disposable test accounts; it checks email confirmation, password reset/replay, sliding session cookies, revocation, login throttling, private selfie challenges, reviewer access, review invalidation, ownership, ten-profile quota, concurrent mutual likes, shared idempotent chat, call signaling, blocking, moderation suspension, export, and media cleanup. It never targets production. Fixture timestamp adjustments use only the known local SQLite database. `tests/integration.py` forwards to this current suite. Older browser-only sample model unit checks remain regression tests for the archived prototype.

TypeScript, the production build, 16 unit checks, and the expanded real-cookie integration suite pass locally. Production email delivery and real two-device calls remain launch checks. Browser automation could not initialize for the last visual check; inspect desktop and phone layouts before publication.

## Architecture and caching

`worker/index.ts` enforces bounded request bodies, dispatches native APIs, resolves cookie sessions, forwards refreshed cookies, and adds privacy/security headers. D1 holds accounts, sessions, profiles, photos’ references, reviews, discovery batches, likes, matches, messages, reports, call signals, and media cleanup tasks. R2 holds file bytes in a private bucket. Database batches protect reciprocal matching and review/media changes. Candidate/photo hydration avoids per-profile database queries.

Member APIs, protected pages, authentication, and photos use `Cache-Control: private, no-store` and `Vary: Cookie`. Session cookie caching is disabled so revocation takes effect immediately. Request-local session memoization never crosses requests. Public static assets may use the hosting cache; private data must not be placed in a CDN or shared cache. There is no Redis dependency.

Migrations live in `drizzle/` and are applied in order. Do not edit an applied migration. `db/schema.ts`, `db/auth-schema.ts`, and `db/member-schema.ts` describe the data. Migration `0003` adds database triggers that reject self-likes, self-matches, and messages from nonparticipants. Scheduled maintenance clears expired sessions/tokens, stale signals/rate windows, and queued file deletions. The standalone deployment config adds a 15-minute cron; confirm maintenance separately if using Sites.

## Deployment

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). `.env.example` lists the runtime settings. Deployment needs a canonical HTTPS origin, D1, private R2, a unique auth secret, a verified email sender/API key, and a confirmed reviewer account. Configure and test TURN for reliable cross-network video. Email, relay bandwidth, password-hashing CPU, storage, and hosting may incur costs.

The Sites Vite integration and existing `.openai/hosting.json` identity are preserved. This application authenticates members with its own email/password cookie sessions; old Sites identity headers do not authorize member APIs. Existing ChatGPT-based passports require a separate, verified migration if they are ever moved to new accounts.

Google Maps links follow the [official Maps URLs guide](https://developers.google.com/maps/documentation/urls/get-started) and use only the chosen broad area. No Maps API key or GPS collection is required for these external search links. `lib/date-ideas.js` defines the ideas and demo-only offers. Restaurant-approved venues, conditions, and redemption handling must be supplied before enabling real coupons.

## Assets

`public/assets/demo-1.png` through `demo-5.png`, `boy-demo-1.png` through `boy-demo-3.png`, and `girls-demo/portrait-01.png` through `portrait-08.png` are user-supplied temporary imagery. The PDF portrait manifest records extraction metadata without names or contact text. `demo-member-avatar.svg` is an original vector placeholder; its PNG derivative is used only for the demo member. No age, identity, verification, or membership claim is made about the pictured people. Other archived sample portraits are Unsplash assets recorded in `download-assets.py`. Replace or obtain suitable production permissions before a public launch.
