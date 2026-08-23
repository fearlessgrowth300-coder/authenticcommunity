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

The Gemini secret is configured only in Supabase Edge Function Secrets. A temporary isolated server health check confirmed HTTP 200 from Flash-Lite generation and Embedding 2 with exactly 768 dimensions; the health function was deleted immediately. A production enrichment invocation then claimed and completed one queued public-content job successfully.

Required production operations:

1. Keep `AI_ENABLED=false` available as the operational kill switch.
2. Run the two-account physical Android validation matrix below.

## Automated verification

- TypeScript: root `npx tsc --noEmit` passes.
- Vitest: provider, embeddings, retries, privacy sanitizer, eligibility, score weights, diversity, feedback, reset, RLS source contracts, Search, Notifications, and mobile integrations pass without a real Gemini call.
- Android: Expo production export succeeds.
- Secret scan: no Google-style Gemini key pattern is tracked.
- Live authenticated smoke: all recommendation/search endpoints returned HTTP 200 and their expected algorithm versions. Local/global cold-start results correctly returned available Communities and Events; empty surfaces returned valid empty arrays rather than errors.
- Live Gemini: generation, 768-dimensional embedding, and one queued public-content enrichment completed successfully.
- Test hygiene: the temporary authentication member and temporary AI health function were removed.

## Physical Android validation still required

Use Account A and Account B on physical Android devices. Validate Home personalization/fallbacks, follows, blocks, connection requests, story order, video watch telemetry, community membership/bans, future/nearby events, Search queries “startup people near me” and “yoga this weekend,” and behavior with `AI_ENABLED=false`. This is not marked complete by automated source tests.

## Rollback

Redeploy the prior Edge Function commit and reactivate the prior algorithm version. Leave additive columns/tables in place until writers, account deletion, aggregation, and retention jobs are moved. Never roll back with destructive table drops.

## Final status

Code, live schema, Edge deployment, Gemini generation/embedding, and authenticated algorithm smoke tests are production-structured. Final release acceptance remains gated only on physical two-account Android testing.
