import type { RecommendationReasonCode } from '../types.ts'
import { boundedScore } from './feedTypes.ts'

export type CommunityCandidate = {
  id: string
  mode: 'local' | 'online' | 'hybrid'
  interestRelevance: number
  geographicRelevance: number
  connectionOverlap: number
  topicValueFit: number
  communityActivity: number
  quality: number
  exploration: number
}

export type RankedCommunityCandidate = CommunityCandidate & {
  score: number
  reasonCodes: RecommendationReasonCode[]
  algorithmVersion: 'communities_local_v1' | 'communities_global_v1'
}

export function rankCommunity(candidate: CommunityCandidate): RankedCommunityCandidate {
  const isOnline = candidate.mode === 'online'
  const score = boundedScore(isOnline
    ? candidate.interestRelevance * 0.35 + candidate.topicValueFit * 0.20 +
      candidate.connectionOverlap * 0.15 + candidate.communityActivity * 0.15 +
      candidate.quality * 0.10 + candidate.exploration * 0.05
    : candidate.interestRelevance * 0.25 + candidate.geographicRelevance * 0.25 +
      candidate.connectionOverlap * 0.15 + candidate.topicValueFit * 0.10 +
      candidate.communityActivity * 0.10 + candidate.quality * 0.10 +
      candidate.exploration * 0.05)
  const reasonCodes: RecommendationReasonCode[] = []
  if (candidate.interestRelevance > 0.25) reasonCodes.push('explicit_interest')
  if (!isOnline && candidate.geographicRelevance > 0.5) reasonCodes.push('nearby')
  if (candidate.connectionOverlap > 0) reasonCodes.push('shared_community')
  if (candidate.communityActivity > 0.5) reasonCodes.push('quality_content')
  if (candidate.exploration > 0) reasonCodes.push('discovery')
  return {
    ...candidate, score, reasonCodes: reasonCodes.slice(0, 4),
    algorithmVersion: isOnline ? 'communities_global_v1' : 'communities_local_v1',
  }
}
