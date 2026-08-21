import { supabase } from './supabase'

export type MatchInput = {
  candidateId: string
  candidateInterests: string[]
  candidateValues: string[]
  candidateCity?: string | null
  candidateCountry?: string | null
  candidateGoal?: string | null
  candidateTrust?: number
  myInterests: string[]
  myValues: string[]
  myCity?: string | null
  myCountry?: string | null
  myGoal?: string | null
  sharedCommunities?: number
  behavioralAffinity?: number
}

const norm = (value: string) => value.trim().toLowerCase()

const clusters = [
  ['startups', 'entrepreneurship', 'business', 'saas', 'freelancing', 'e-commerce', 'marketing', 'sales'],
  ['programming', 'software', 'coding', 'ai', 'technology', 'design'],
  ['fitness', 'gym', 'running', 'hiking', 'yoga', 'cycling', 'nutrition'],
  ['meditation', 'mindfulness', 'mental health', 'wellness'],
  ['photography', 'art', 'film', 'writing', 'music', 'creativity'],
  ['books', 'reading', 'learning', 'languages'],
]

function semanticOverlap(a: string[], b: string[]) {
  const left = a.map(norm)
  const right = b.map(norm)
  if (!left.length || !right.length) return 0
  let total = 0
  for (const interest of left) {
    const exact = right.includes(interest)
    const related = clusters.some(
      (cluster) => cluster.includes(interest) && right.some((value) => cluster.includes(value))
    )
    total += exact ? 1 : related ? 0.65 : 0
  }
  return Math.min(1, total / Math.max(1, Math.min(left.length, right.length)))
}

export type MatchScoreResult = {
  overall: number
  reasons: string[]
  sharedInterests: string[]
  sharedValues: string[]
  breakdown: {
    values: number
    interests: number
    location: number
    community: number
    goals: number
    trust: number
  }
  geographicTier: 'same_city' | 'same_region' | 'same_country' | 'international'
}

/**
 * Deterministic local-first matching algorithm.
 * Hierarchy: same city/nearby -> same region -> same country -> international
 */
export function calculateMatchScore(input: MatchInput): MatchScoreResult {
  const normMyValues = input.myValues.map(norm)
  const normCandValues = input.candidateValues.map(norm)
  const sharedValues = input.myValues.filter((v) => normCandValues.includes(norm(v)))

  const normMyInterests = input.myInterests.map(norm)
  const normCandInterests = input.candidateInterests.map(norm)
  const sharedInterests = input.myInterests.filter((i) => normCandInterests.includes(norm(i)))

  // 1. Values score (up to 30 pts)
  const valuesRatio =
    sharedValues.length / Math.max(1, Math.min(input.myValues.length, input.candidateValues.length))
  const values = Math.round(valuesRatio * 30)

  // 2. Interests score (up to 20 pts)
  const interestSimilarity = semanticOverlap(input.myInterests, input.candidateInterests)
  const interests = Math.round(interestSimilarity * 20)

  // 3. Geographic score (up to 20 pts) - Local-first rule
  let locationScore = 4
  let geographicTier: MatchScoreResult['geographicTier'] = 'international'

  const sameCity =
    Boolean(input.myCity && input.candidateCity && norm(input.myCity) === norm(input.candidateCity))
  const sameCountry =
    Boolean(input.myCountry && input.candidateCountry && norm(input.myCountry) === norm(input.candidateCountry))

  if (sameCity) {
    locationScore = 20
    geographicTier = 'same_city'
  } else if (sameCountry) {
    locationScore = 12
    geographicTier = 'same_country'
  }

  // 4. Shared Goals & Community
  const goals =
    input.myGoal && input.candidateGoal && input.myGoal === input.candidateGoal
      ? 15
      : 8
  const community = Math.min(10, (input.sharedCommunities || 0) * 5)
  const trust = Math.min(5, Math.max(0, input.candidateTrust ?? 3))

  const overall = Math.min(100, values + interests + locationScore + goals + community + trust)

  const reasons: string[] = []
  if (sharedValues.length > 0) {
    reasons.push(`You both value ${sharedValues.slice(0, 2).join(' and ')}`)
  }
  if (sameCity) {
    reasons.push(`You both live in ${input.myCity}`)
  }
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests in ${sharedInterests.slice(0, 2).join(' and ')}`)
  } else if (interestSimilarity >= 0.6) {
    reasons.push('Your passions and hobbies strongly overlap')
  }

  if (reasons.length === 0) {
    reasons.push('A new perspective within your community')
  }

  return {
    overall,
    reasons: reasons.slice(0, 3),
    sharedInterests,
    sharedValues,
    breakdown: {
      values,
      interests,
      location: locationScore,
      community,
      goals,
      trust,
    },
    geographicTier,
  }
}

/**
 * Invoke Gemini Edge Function for AI-assisted match reasoning and suggestions
 */
export async function fetchGeminiMatchSuggestions(currentUserId: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('match-suggestions', {
      body: { userId: currentUserId },
    })
    if (error) return null
    return data
  } catch {
    return null
  }
}
