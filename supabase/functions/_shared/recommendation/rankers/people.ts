import type { RecommendationReasonCode } from '../types.ts'
import { boundedScore } from './feedTypes.ts'

export type PeopleCandidate = {
  id: string
  valuesCompatibility: number
  interestCompatibility: number
  socialCompatibility: number
  sharedCommunitySignals: number
  geographicCompatibility: number
  activityAvailability: number
  trustAccountQuality: number
  recommendationFeedback: number
  sharedValues: string[]
  sharedInterests: string[]
}

export type RankedPeopleCandidate = PeopleCandidate & {
  score: number
  matchPercent: number
  reasonCodes: RecommendationReasonCode[]
}

export function rankPerson(candidate: PeopleCandidate): RankedPeopleCandidate {
  const score = boundedScore(
    candidate.valuesCompatibility * 0.30 +
    candidate.interestCompatibility * 0.20 +
    candidate.socialCompatibility * 0.15 +
    candidate.sharedCommunitySignals * 0.10 +
    candidate.geographicCompatibility * 0.10 +
    candidate.activityAvailability * 0.05 +
    candidate.trustAccountQuality * 0.05 +
    candidate.recommendationFeedback * 0.05,
  )
  const reasonCodes: RecommendationReasonCode[] = []
  if (candidate.sharedValues.length) reasonCodes.push('shared_value')
  if (candidate.sharedInterests.length || candidate.interestCompatibility > 0.3) reasonCodes.push('explicit_interest')
  if (candidate.sharedCommunitySignals > 0) reasonCodes.push('shared_community')
  if (candidate.geographicCompatibility > 0.5) reasonCodes.push('nearby')
  if (candidate.socialCompatibility > 0.7) reasonCodes.push('relationship_strength')
  return { ...candidate, score, matchPercent: Math.round(score * 100), reasonCodes: reasonCodes.slice(0, 4) }
}
