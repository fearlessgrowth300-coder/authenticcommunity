import type { RecommendationReasonCode } from '../types.ts'
import { boundedScore } from './feedTypes.ts'

export type EventCandidate = {
  id: string
  distanceGeography: number
  dateTimeSuitability: number
  interestMatch: number
  socialAttendance: number
  communityRelevance: number
  eventQuality: number
  freshnessTrending: number
}

export function rankEvent(candidate: EventCandidate) {
  const score = boundedScore(
    candidate.distanceGeography * 0.30 + candidate.dateTimeSuitability * 0.20 +
    candidate.interestMatch * 0.20 + candidate.socialAttendance * 0.10 +
    candidate.communityRelevance * 0.10 + candidate.eventQuality * 0.05 +
    candidate.freshnessTrending * 0.05,
  )
  const reasonCodes: RecommendationReasonCode[] = []
  if (candidate.distanceGeography > 0.5) reasonCodes.push('nearby')
  if (candidate.interestMatch > 0.25) reasonCodes.push('explicit_interest')
  if (candidate.socialAttendance > 0) reasonCodes.push('relationship_strength')
  if (candidate.communityRelevance > 0) reasonCodes.push('shared_community')
  if (candidate.dateTimeSuitability > 0.75) reasonCodes.push('fresh_content')
  return { ...candidate, score, reasonCodes: reasonCodes.slice(0, 4) }
}
