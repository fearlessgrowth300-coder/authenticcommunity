import { freshnessScore } from '../freshness.ts'
import { boundedScore, reasonCodesFor, type FeedCandidate, type RankedFeedCandidate } from './feedTypes.ts'

export function rankForYou(candidate: FeedCandidate): RankedFeedCandidate {
  const freshness = freshnessScore(candidate.createdAt)
  const score =
    candidate.relationshipScore * 0.25 +
    Math.max(candidate.explicitInterestScore, candidate.learnedInterestScore) * 0.20 +
    candidate.communityScore * 0.15 +
    candidate.engagementQuality * 0.10 +
    freshness * 0.10 +
    candidate.localScore * 0.10 +
    candidate.contentQuality * 0.05 +
    candidate.explorationBoost
  return { ...candidate, score: boundedScore(score), reasonCodes: reasonCodesFor(candidate) }
}

