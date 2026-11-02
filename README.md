# Matchmelo

A mobile-first dating project with a public website, real hosted account sign-in, private Digital Passports, profile pages, and a fictional social preview.

## Available now

- Public landing page with how it works, Digital Passport explanation, privacy and safety content, FAQs, and pilot terms.
- Dedicated sign-in page using Sites-managed Continue with ChatGPT. Google and email-password sign-in are not configured.
- Protected Digital Passport, My Profile, and discovery routes. Anonymous API calls return 401.
- User-owned D1 passport records with validated introductions, adult self-declaration, policy consent, and private R2 selfie storage.
- Camera capture or JPEG/PNG/WebP upload with explicit consent. Selfies are visible only to the member and configured reviewer.
- Authorized review queue, member-visible decisions, stale-review protection, and transactionally recorded review history. Profile edits invalidate prior review approval.
- Selfie removal and complete passport deletion.
- Responsive fictional discovery, likes, matches, local conversation drafts, and video preparation. The safety/about block sits at the dashboard bottom-right without covering controls; mobile layouts stack it below content.
- Five user-supplied demo photos in the first fictional profile gallery, with demo imagery on landing and sign-in pages.

## Important scope

A Digital Passport is a profile and trust-status record. It is not government identity verification, an independent age check, or guaranteed selfie liveness. Real member discovery, shared messaging, live calls, operational abuse handling, and public dating-network launch readiness remain future work. Sample social messages and reports are not sent to real people.

## Runtime and storage

The supplied Vinext/React Sites starter runs on Cloudflare Workers. Preserve the Sites Vite integration and dispatch-owned authentication. The production gateway provides trusted `oai-authenticated-user-id` and `oai-authenticated-user-email` headers. Native Worker API routes use those headers; protected server pages use the supplied ChatGPT auth helpers. Browser state never establishes identity.

`.openai/hosting.json` retains the existing Site ID and declares D1 binding `DB` and private R2 binding `BUCKET`. Schema lives in `db/schema.ts`; `drizzle/0000_illegal_darwin.sql` is the generated initial migration. Do not edit an applied migration. APIs enforce ownership and same-origin writes. Bounded request bodies are consumed at the Worker boundary before routing to avoid orphaned request streams. Private responses disable caching.

The native Sites environment stores `REVIEWER_EMAIL` as a secret, configured for the current Site owner. Reviewers sign in at `/review`; other accounts cannot view the queue or its photos. The setting does not verify identity or age. Do not commit live secrets or local `.dev.vars` files.

## Local development

Install through the Sites dependency helper, then use `npm run dev -- --port 4183 --hostname 127.0.0.1`. The portable starter simulates ChatGPT sign-in as `seedy@sites.test` only on local development requests. Production authentication is owned by Sites dispatch.

Generate future migrations with `npm run db:generate`. Build through the Sites build helper, then apply each new migration once locally with the documented Wrangler D1 command using `dist/server/wrangler.json` and `.wrangler/state`. Hosted migrations are applied during Sites deployment.

## Validation

- `node --test tests/model.test.js tests/passport.test.js`: discovery behavior, matching, blocking, passport validation, image signatures, and same-origin writes.
- `node node_modules/typescript/bin/tsc --noEmit`: TypeScript checking.
- `node --check public/legacy/app.js`: standalone dashboard syntax.
- `python tests/integration.py`: local built-Worker HTTP tests at 127.0.0.1:4184. These use fake trusted identity headers only against local test infrastructure and remove their test records. Run the local built preview with REVIEWER_EMAIL=seedy@sites.test for the reviewer fixture. Tests cover account separation, private photos, reviews, invalidated approvals, deletion, and rejected image content.
- Browser checks cover landing, sign-in redirect, passport persistence, real profile data, responsive layouts, the supplied photo gallery, and the dashboard safety block.

## Assets

`public/assets/demo-1.png` through `demo-5.png` are user-provided temporary demo photos. Other sample portraits are Unsplash assets, recorded by `download-assets.py`. All sample dating identities and incoming interactions are fictional.
