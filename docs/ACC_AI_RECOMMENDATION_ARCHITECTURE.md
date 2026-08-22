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

The live Phase AI-0 migration succeeded on 2026-08-22. `GEMINI_API_KEY` was not configured during the audit, so Gemini-backed work remains unavailable until the secret is added. Deterministic product behavior remains available.

