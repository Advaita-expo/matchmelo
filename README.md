# Matchmelo

A mobile-first interactive dating platform prototype based on the user-supplied VIBE10 blueprint. The first release is a private review experience with fictional profiles and browser-local persistence.

## Run locally

From this directory, run `python -m http.server 4173 --directory dist --bind 127.0.0.1` and visit http://127.0.0.1:4173. No build or dependencies are required. Run `node --test tests/model.test.js` for the domain behavior checks.

## Implemented preview

- Responsive discovery with ten fictional profiles, local-day quota, pass/like, preferences, and profile details.
- Incoming likes, sent likes, mutual matches, withdrawal, and unmatching.
- Matched conversations with browser-local message drafts. Sample received messages are prewritten, with no simulated automatic replies.
- Broad-area exploration without GPS requests.
- Profile editing, 18+ self-declaration, honest trust statuses, and discovery visibility.
- Blocking, local report records, and reset controls.
- Video-date preparation with explicit local camera/microphone permission, mute controls, device failure handling, and track cleanup. No peer calls or recordings.

All people, likes, messages, and review statuses are fictional. Stock portraits are from Unsplash; `download-assets.py` records the source image identifiers. No real accounts, sign-in, server-enforced quota, shared messages, review delivery, or live calls are implemented. Browser-local quotas can be reset by clearing local storage. Do not use this preview for a real dating cohort.

## Next: connected pilot

1. Provision a Supabase project and Google OAuth app; configure sign-in and invite access. Keep service-role credentials on the server only.
2. Add PostgreSQL migrations for profiles, private preferences, daily batches, likes, matches, messages, blocks, reports, review actions, call invites, and audit logs. Enforce row-level security and moderator roles.
3. Implement transaction-safe daily batches and quotas, eligibility filters, pairwise unique matches, and immediate block checks in every read/write path. Never trust local browser state for these rules.
4. Connect private photo storage, signed URLs, upload validation/compression, consent and retention controls. Build the real review queue before displaying actual review badges.
5. Connect authenticated real-time messaging and presence, using server authorization. Implement account export, deletion, reporting delivery, appeals, and audit trails.
6. Add signed, expiring call invitations with independent acceptance, authenticated signaling, tested WebRTC, and TURN for networks that need a relay. Offer chat on connection failure. Do not record calls by default.
7. Test cross-account access, concurrency, abuse controls, report handling, deletion, camera cleanup, accessibility, and mobile layouts before inviting adult testers. A declaration and a basic selfie challenge are not verified age or identity proof; plan appropriate assurance and operational readiness before public launch.

## Cost planning

The prototype is static and has no third-party API usage. A small pilot may fit provider free tiers, subject to quotas and terms. Supabase currently lists a 500 MB database, 1 GB storage, and 5 GB egress on Free, with inactivity pausing. Cloudflare Pages static requests are free. Reliable TURN bandwidth, stronger verification, transactional email, moderation, and higher usage may introduce operating costs. These are infrastructure observations, not a guarantee of a zero-cost public service.

Official references checked during this implementation: https://supabase.com/pricing, https://developers.cloudflare.com/pages/functions/pricing/, https://webrtc.org/getting-started/turn-server.
