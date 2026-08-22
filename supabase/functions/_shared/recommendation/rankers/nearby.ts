import { freshnessScore } from '../freshness.ts'
import { boundedScore, reasonCodesFor, type FeedCandidate, type RankedFeedCandidate } from './feedTypes.ts'

export function rankNearby(candidate: FeedCandidate): RankedFeedCandidate {
  const freshness = freshnessScore(candidate.createdAt, 30)
  const score =
    candidate.localScore * 0.42 +
    Math.max(candidate.explicitInterestScore, candidate.learnedInterestScore) * 0.18 +
    candidate.relationshipScore * 0.14 +
    candidate.communityScore * 0.10 +
    freshness * 0.10 +
    candidate.contentQuality * 0.06
  return { ...candidate, score: boundedScore(score), reasonCodes: reasonCodesFor(candidate) }
}

