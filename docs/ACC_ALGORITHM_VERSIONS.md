# ACC Algorithm Versions

Algorithm names are stable observability contracts. Mobile clients submit the version returned by the server with safe recommendation events; clients do not choose weights.

| Version | Surface | Initial contract | Status |
| --- | --- | --- | --- |
| `feed_foryou_v1` | Home / For You | Relevance, relationship, quality, freshness, diversity, exploration | Active |
| `feed_following_v1` | Home / Following | Relationship-first and mostly chronological | Active |
| `feed_nearby_v1` | Home / Nearby | Strong coarse-location relevance without coordinate exposure | Active |
| `stories_v1` | Stories | Relationship strength, freshness, unseen/viewed state | Active |
| `video_v1` | Videos | Semantic relevance, watch quality, and relationship-producing actions | Active |
| `people_v1` | People / Matches | Deterministic values/interests/social/location/community/trust fit | Active |
| `communities_local_v1` | Local communities | Geography, overlap, activity quality, events, safety | Active |
| `communities_global_v1` | Online communities | Semantic overlap, activity quality, relationships, safety | Active |
| `events_v1` | Events | Eligibility, distance convenience, schedule, community and social context | Active |
| `search_v1` | Search | Text retrieval plus semantic retrieval with location-aware ordering | Active |
| `notifications_v1` | Notifications | Priority, recency, fatigue control, and member preferences | Active |

## Versioning rules

- Change the version when weights, eligibility semantics, candidate sources, or diversity/exploration behavior change materially.
- Copy the old implementation before a material version change; do not silently redefine historical metrics.
- Record activation date, weights/configuration, major changes, and status in `recommendation_algorithm_versions` through a migration.
- Never store or expose internal risk, moderation, or trust values in client reason codes.
- Experiment assignment must be server controlled and logged with the returned version.

## Reason-code contract

Initial user-facing reasons include selected interest, learned interest, shared value, relationship strength, following, shared community, nearby, local event, friends attending, fresh content, quality content, and discovery. The mobile UI converts codes to plain-language explanations; raw internal feature values remain server-only.

