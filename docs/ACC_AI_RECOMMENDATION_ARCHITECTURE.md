# ACC AI Recommendation Architecture

## Product objective

ACC recommends content, people, communities, events, stories, videos, search results, and notifications in service of meaningful relationships. It does not optimize primarily for endless viewing or popularity.

The north-star outcome is a recommendation that leads to a healthy connection, continued conversation, community participation, or event attendance.

## System boundary

Every surface follows the same ordered pipeline:

1. Authenticate the current member on the server.
2. Apply hard eligibility (blocks, privacy, account/content status, membership, event availability, and geographic rules).
3. Generate bounded candidates.
4. Build deterministic and precomputed semantic signals.
5. Apply the surface-specific ranker.
6. Apply quality, diversity, freshness, and bounded exploration.
7. Return public result data, algorithm version, and user-facing reason codes.
8. Batch safe feedback events from mobile into a validated authenticated RPC.

Hard restrictions always run before ranking. Gemini never decides eligibility, trust, bans, verification, or authenticity.

## Two brains

- The deterministic recommendation engine owns eligibility, scoring, ranking, diversity, exploration, and measurable behavior.
- Gemini enriches eligible public content, creates embeddings, and may produce grounded explanations or optional conversation starters after deterministic ranking.

The product continues working if Gemini is disabled, unconfigured, rate-limited, or unavailable.

## AI provider contract

Shared modules live under `supabase/functions/_shared/ai`.

- Generative model: `gemini-3.5-flash-lite`
- Embedding model: `gemini-embedding-2`
- Embedding dimension: 768
- Maximum retries: 2
- Public text only in V1; public multimodal enrichment is disabled initially.

`GEMINI_API_KEY` is read only from Supabase Edge Function Secrets. It must never appear in Expo variables, mobile bundles, database rows, analytics, logs, tests, documentation examples, or Git.

## Privacy boundary

Gemini may receive sanitized, eligible public content and coarse city/country labels when relevant. It must not receive private messages, community private chat, credentials, OTPs, tokens, phone secrets, identity or liveness data, exact coordinates, home addresses, payment data, private reports, reporter identity, or sensitive attributes.

ACC never infers hidden sensitive profiles. Explicit interests and values remain user-owned and are not overwritten by learned affinities.

## Persistence

Phase AI-0 introduces:

- `recommendation_events`: validated safe interaction history.
- `recommendation_item_metadata`: cached topics, quality features, and 768-d embeddings.
- `user_topic_affinities`: explicit and learned topic weights kept as separate sources.
- `user_recommendation_profiles`: cached preference embedding and reset state.
- `ai_enrichment_jobs`: idempotent public-content processing jobs.
- `ai_usage_daily`: provider/model/task counters without prompts.
- `recommendation_metrics_daily`: surface/version outcome counters.
- `recommendation_algorithm_versions`: immutable release identities and change notes.

Derived tables have RLS enabled and no member write policies. `log_recommendation_events(jsonb)` derives `auth.uid()`, limits a batch to 50, validates enums/lengths, and only retains a small safe metadata allowlist.

## Cost and latency

Gemini is not called during impressions, scrolling, candidate scoring, Likes, Follows, notifications, or every view. Eligible public content is enriched once when created or materially changed. A content hash prevents duplicate work. Ranking uses PostgreSQL, pgvector, deterministic logic, and cached enrichment.

The current dataset is small, so vector similarity uses exact cosine search. An HNSW/IVFFlat index should be introduced only after production row volume and query plans justify it.

## Reset behavior

“Reset Recommendations” clears learned topic affinities and the cached preference embedding, records a reset timestamp, and preserves explicit interests/values. Raw events remain immutable for safety/audit, but rankers ignore behavior before the reset timestamp.

## Deployment state

All forward migrations through AI-8 were validated against the production Supabase database on 2026-08-23. Content enrichment and all seven recommendation/search Edge endpoints were deployed and verified `ACTIVE` with JWT enforcement. `GEMINI_API_KEY` was not configured during the audit, so Gemini-backed work remains unavailable until the secret is added. Deterministic fallbacks remain available.

## Surface rankers

Home uses separate For You, Following, and Nearby rankers. Stories, Videos, People, local Communities, global Communities, Events, Search, and Notifications each have their own algorithm version and scoring contract. Eligibility precedes every ranker. Server-returned reason codes power “Why am I seeing this?” without exposing internal safety or risk values.

## Affinity learning and event retention

Mobile batches a bounded safe event vocabulary. A rate-limited server RPC joins those events only to cached public-content topics, applies a 30-day exponential decay, and writes `source = learned` affinities separately from explicit interests. Private message or community-chat content is never read. Daily metrics aggregate outcomes by surface and algorithm version. Raw recommendation events have a 180-day operational retention target and can only be purged through a service-role function after aggregate metrics are refreshed.

## Search and notifications

Search performs deterministic intent parsing first, rate-limits ambiguous Gemini intent and query embedding calls, combines trigram text retrieval with cached vectors, and falls back to text-only retrieval. Notification ordering is fully deterministic: direct messages, accepted connections, and requests outrank community activity and recommended content. Category preferences, quiet hours, high-priority suppression, and daily fatigue caps are applied server-side; no LLM is called per notification.

## Monitoring and failure behavior

`ai_usage_daily` stores provider/model/task counts without prompts. `recommendation_metrics_daily` stores surface/version outcomes. AI provider errors use bounded, non-secret codes; the provider has timeouts, retry/backoff, and a circuit breaker. If Gemini is disabled, missing, rate-limited, malformed, or unavailable, publishing continues, Home/People/Community/Event rankers remain deterministic, explanations use structured reasons, and Search falls back to text.

## Rollback considerations

Migrations are forward-only. A ranker rollback activates the prior algorithm implementation/version rather than rewriting historical weights. Edge Functions can be redeployed to a prior commit independently. Newly added nullable or defaulted columns can remain during rollback. Do not drop recommendation tables while metrics or account-deletion jobs depend on them; retire versions and stop writers first.

## Future ML path

No custom model is trained in V1. When ACC has sufficient consented beta outcomes, the stable event, feature, ranker, and algorithm-version interfaces can support offline models for meaningful actions. Redis, feature stores, event streaming, and dedicated model serving are intentionally deferred until measured scale requires them.
