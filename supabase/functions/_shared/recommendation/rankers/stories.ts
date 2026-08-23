import { freshnessScore } from '../freshness.ts'
import type { RecommendationReasonCode } from '../types.ts'
import { boundedScore } from './feedTypes.ts'

export type StoryCandidate = {
  id: string
  createdAt: string
  relationshipStrength: number
  recentInteraction: number
  storyEngagementHistory: number
  contentRelevance: number
  communityRelationship: number
  viewed: boolean
}

export type RankedStoryCandidate = StoryCandidate & {
  score: number
  reasonCodes: RecommendationReasonCode[]
}

export function rankStory(candidate: StoryCandidate): RankedStoryCandidate {
  const freshness = freshnessScore(candidate.createdAt, 12)
  const baseScore =
    candidate.relationshipStrength * 0.30 +
    candidate.recentInteraction * 0.25 +
    candidate.storyEngagementHistory * 0.15 +
    candidate.contentRelevance * 0.10 +
    candidate.communityRelationship * 0.10 +
    freshness * 0.10
  const reasonCodes: RecommendationReasonCode[] = []
  if (candidate.relationshipStrength > 0.35) reasonCodes.push('relationship_strength')
  if (candidate.contentRelevance > 0.2) reasonCodes.push('explicit_interest')
  if (candidate.communityRelationship > 0) reasonCodes.push('shared_community')
  reasonCodes.push('fresh_content')
  return {
    ...candidate,
    score: boundedScore(baseScore * (candidate.viewed ? 0.45 : 1)),
    reasonCodes: [...new Set(reasonCodes)].slice(0, 4),
  }
}
