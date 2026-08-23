import { freshnessScore } from '../freshness.ts'
import { boundedScore, type FeedCandidate, type RankedFeedCandidate } from './feedTypes.ts'

export function rankFollowing(candidate: FeedCandidate): RankedFeedCandidate {
  const freshness = freshnessScore(candidate.createdAt, 24)
  const score = freshness * 0.8 + candidate.relationshipScore * 0.15 + candidate.contentQuality * 0.05
  return {
    ...candidate,
    score: boundedScore(score),
    reasonCodes: ['following', 'fresh_content'],
  }
}

