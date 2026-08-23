# ACC AI V1 Production Audit

Audit date: 2026-08-23
Branch: `codex/mobile-v2-production-repair-1-67`

## Verified implementation

- One shared server-side provider abstraction uses `gemini-3.5-flash-lite` and `gemini-embedding-2` at 768 dimensions.
- PostgreSQL/pgvector stores cached public-content metadata and embeddings; normal feed loading never waits on Gemini.
- Separate versioned rankers exist for For You, Following, Nearby, Stories, Videos, People, local Communities, global Communities, Events, Search, and Notifications.
- Eligibility, blocks, privacy, content/account status, bans, past-event filtering, and geographic scope run before scoring.
- Positive/negative feedback is bounded, authenticated, buffered, resettable, and decayed. Explicit preferences remain separate from learned affinities.
- Gemini input is restricted to sanitized public content and coarse location labels. Private DMs/chat, exact coordinates, credentials, verification artifacts, and sensitive inferred traits are excluded.
- Search has deterministic parsing and text fallback. Notification ranking uses no LLM.
- Daily AI usage and recommendation outcome metrics are versioned. Raw event retention is service controlled.

## Live database

Production migrations AI-0 through AI-8 were run successfully in project `sqzeghkabqhhhiuidnvd`. Live checks confirmed pgvector, 768-dimensional metadata, algorithm rows, service-only internal functions, authenticated self-only RPCs, and notification priorities.

## Deployment boundary

The database is live. `ai-process-enrichment`, `recommend-feed`, `recommend-stories`, `recommend-videos`, `recommend-people`, `recommend-communities`, `recommend-events`, and `search-recommendations` were deployed on 2026-08-23. Supabase reports every function `ACTIVE` with JWT verification enabled, and an unauthenticated probe against every endpoint returned HTTP 401.

The Gemini secret is not configured. Until it is added, Gemini enrichment, semantic query embedding, AI explanations, and AI conversation starters remain unavailable; mobile services and Edge endpoints retain deterministic/text fallbacks.

Required production operations:

1. Configure `GEMINI_API_KEY` in Supabase Edge Function Secrets when the key is available.
2. Keep `AI_ENABLED=false` available as the operational kill switch.
3. Run the two-account physical Android validation matrix below.

## Automated verification

- TypeScript: root `npx tsc --noEmit` passes.
- Vitest: provider, embeddings, retries, privacy sanitizer, eligibility, score weights, diversity, feedback, reset, RLS source contracts, Search, Notifications, and mobile integrations pass without a real Gemini call.
- Android: Expo production export succeeds.
- Secret scan: no Google-style Gemini key pattern is tracked.

## Physical Android validation still required

Use Account A and Account B on physical Android devices. Validate Home personalization/fallbacks, follows, blocks, connection requests, story order, video watch telemetry, community membership/bans, future/nearby events, Search queries “startup people near me” and “yoga this weekend,” and behavior with `AI_ENABLED=false`. This is not marked complete by automated source tests.

## Rollback

Redeploy the prior Edge Function commit and reactivate the prior algorithm version. Leave additive columns/tables in place until writers, account deletion, aggregation, and retention jobs are moved. Never roll back with destructive table drops.

## Final status

Code, live schema, and Edge deployment are production-structured. Full AI acceptance remains gated on Gemini secret configuration and physical two-account Android testing.
