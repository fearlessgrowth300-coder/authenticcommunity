import type { RecommendationReasonCode } from '../types.ts'
import { boundedScore } from './feedTypes.ts'

export type VideoCandidate = {
  id: string
  topicRelevance: number
  watchQuality: number
  savesAndShares: number
  socialRelevance: number
  creatorQuality: number
  communityRelevance: number
  locationRelevance: number
  exploration: number
}

export type RankedVideoCandidate = VideoCandidate & {
  score: number
  reasonCodes: RecommendationReasonCode[]
}

export function rankVideo(candidate: VideoCandidate): RankedVideoCandidate {
  const score =
    candidate.topicRelevance * 0.25 +
    candidate.watchQuality * 0.15 +
    candidate.savesAndShares * 0.15 +
    candidate.socialRelevance * 0.15 +
    candidate.creatorQuality * 0.10 +
    candidate.communityRelevance * 0.10 +
    candidate.locationRelevance * 0.05 +
    candidate.exploration
  const reasonCodes: RecommendationReasonCode[] = []
  if (candidate.topicRelevance > 0.25) reasonCodes.push('explicit_interest')
  if (candidate.socialRelevance > 0.35) reasonCodes.push('relationship_strength')
  if (candidate.communityRelevance > 0) reasonCodes.push('shared_community')
  if (candidate.locationRelevance > 0.5) reasonCodes.push('nearby')
  if (candidate.creatorQuality > 0.55 || candidate.watchQuality > 0.55) reasonCodes.push('quality_content')
  if (candidate.exploration > 0) reasonCodes.push('discovery')
  return { ...candidate, score: boundedScore(score), reasonCodes: [...new Set(reasonCodes)].slice(0, 4) }
}
