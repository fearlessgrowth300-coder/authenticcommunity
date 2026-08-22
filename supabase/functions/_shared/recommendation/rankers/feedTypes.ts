import type { RecommendationReasonCode } from '../types.ts'

export type FeedCandidate = {
  id: string
  authorId: string
  createdAt: string
  primaryTopic?: string
  explicitInterestScore: number
  learnedInterestScore: number
  relationshipScore: number
  communityScore: number
  localScore: number
  engagementQuality: number
  contentQuality: number
  explorationBoost: number
}

export type RankedFeedCandidate = FeedCandidate & {
  score: number
  reasonCodes: RecommendationReasonCode[]
}

export function boundedScore(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function reasonCodesFor(candidate: FeedCandidate): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = []
  if (candidate.explicitInterestScore > 0) reasons.push('explicit_interest')
  if (candidate.relationshipScore > 0.4) reasons.push('relationship_strength')
  if (candidate.localScore > 0.5) reasons.push('nearby')
  if (candidate.communityScore > 0) reasons.push('shared_community')
  if (candidate.learnedInterestScore > 0.2) reasons.push('learned_interest')
  if (candidate.contentQuality > 0.55 || candidate.engagementQuality > 0.55) reasons.push('quality_content')
  if (candidate.explorationBoost > 0) reasons.push('discovery')
  reasons.push('fresh_content')
  return [...new Set(reasons)].slice(0, 4)
}
