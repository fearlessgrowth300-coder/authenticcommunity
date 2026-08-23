# ACC Algorithm Versions

Algorithm names are stable observability contracts. Mobile clients submit the version returned by the server with safe recommendation events; clients do not choose weights.

| Version | Activated | Surface | Weights / contract | Major changes | Status |
| --- | --- | --- | --- | --- | --- |
| `feed_foryou_v1` | 2026-08-22 | Home / For You | explicit .22, learned .13, relationship .18, community .12, local .10, quality .10, freshness .10, exploration .05 | Relevance plus diversity and bounded exploration | Active |
| `feed_following_v1` | 2026-08-22 | Home / Following | relationship .45, freshness .35, quality .15, community .05 | Mostly chronological relationship-first feed | Active |
| `feed_nearby_v1` | 2026-08-22 | Home / Nearby | local .45, interests .15, community .15, freshness .10, quality .10, exploration .05 | Coarse-location ordering without coordinate exposure | Active |
| `stories_v1` | 2026-08-22 | Stories | relationship .35, interest .20, community .15, freshness .20, unseen .10 | Unseen and close-relationship story ordering | Active |
| `video_v1` | 2026-08-22 | Videos | interest .25, relationship .20, community .15, watch quality .20, recency .10, local .05, exploration .05 | Meaningful-action video ranking | Active |
| `people_v1` | 2026-08-23 | People / Matches | values .30, interests .20, social .15, community .10, location .10, availability .05, trust .05, feedback .05 | Semantic contribution capped inside interests | Active |
| `communities_local_v1` | 2026-08-23 | Local communities | geography .25, interests .20, social .15, activity .15, events .10, quality .10, exploration .05 | Local and hybrid community eligibility | Active |
| `communities_global_v1` | 2026-08-23 | Online communities | interests .30, activity .20, quality .20, social .15, events .10, exploration .05 | Online/global community discovery | Active |
| `events_v1` | 2026-08-23 | Events | proximity .30, interests .20, community .15, schedule .10, social .10, quality .10, exploration .05 | Future-only local-first events | Active |
| `search_v1` | 2026-08-23 | Search | text .45, semantic .30, type relevance .15, freshness/quality .10 | Hybrid multi-category retrieval with text fallback | Active |
| `notifications_v1` | 2026-08-23 | Notifications | DM 1.00, accepted .95, request .85, event reminder .80, community reply .70, follower .55, community activity .50, recommendation .25 | Quiet hours and daily fatigue controls; no per-item LLM | Active |

## Versioning rules

- Change the version when weights, eligibility semantics, candidate sources, or diversity/exploration behavior change materially.
- Copy the old implementation before a material version change; do not silently redefine historical metrics.
- Record activation date, weights/configuration, major changes, and status in `recommendation_algorithm_versions` through a migration.
- Never store or expose internal risk, moderation, or trust values in client reason codes.
- Experiment assignment must be server controlled and logged with the returned version.

## Reason-code contract

Initial user-facing reasons include selected interest, learned interest, shared value, relationship strength, following, shared community, nearby, local event, friends attending, fresh content, quality content, and discovery. The mobile UI converts codes to plain-language explanations; raw internal feature values remain server-only.
