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
  semanticSimilarity?: number
  candidateSocialPreference?: string | null
  mySocialPreference?: string | null
  candidateAvailability?: string | null
  myAvailability?: string | null
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
    social: number
    activity: number
    trust: number
    feedback: number
    semanticAssist: number
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

  // 2. Interests score (up to 20 pts). Embedding similarity can assist at
  // most 20% of this signal; it can never replace explicit/taxonomy overlap.
  const taxonomySimilarity = semanticOverlap(input.myInterests, input.candidateInterests)
  const semanticAssist = Math.max(0, Math.min(1, input.semanticSimilarity ?? taxonomySimilarity))
  const interestSimilarity = input.semanticSimilarity == null
    ? taxonomySimilarity
    : taxonomySimilarity * 0.8 + semanticAssist * 0.2
  const interests = Math.round(interestSimilarity * 20)

  // 3. Geographic score (up to 10 pts) - Local-first rule
  let locationScore = 2
  let geographicTier: MatchScoreResult['geographicTier'] = 'international'

  const sameCity =
    Boolean(input.myCity && input.candidateCity && norm(input.myCity) === norm(input.candidateCity))
  const sameCountry =
    Boolean(input.myCountry && input.candidateCountry && norm(input.myCountry) === norm(input.candidateCountry))

  if (sameCity) {
    locationScore = 10
    geographicTier = 'same_city'
  } else if (sameCountry) {
    locationScore = 6
    geographicTier = 'same_country'
  }

  // 4. Social style and connection goal compatibility (up to 15 pts).
  const goalsMatch = Boolean(input.myGoal && input.candidateGoal && norm(input.myGoal) === norm(input.candidateGoal))
  const socialStyleKnown = Boolean(input.mySocialPreference && input.candidateSocialPreference)
  const socialStyleMatch = socialStyleKnown && norm(input.mySocialPreference!) === norm(input.candidateSocialPreference!)
  const social = goalsMatch && (!socialStyleKnown || socialStyleMatch)
    ? 15
    : goalsMatch || socialStyleMatch
      ? 12
      : socialStyleKnown
        ? 5
        : 10
  const community = Math.min(10, (input.sharedCommunities || 0) * 5)
  const availabilityKnown = Boolean(input.myAvailability && input.candidateAvailability)
  const activity = availabilityKnown
    ? norm(input.myAvailability!) === norm(input.candidateAvailability!) ? 5 : 1
    : 3
  const trust = Math.min(5, Math.max(0, input.candidateTrust ?? 3))
  const feedback = input.behavioralAffinity == null
    ? 2
    : Math.round(Math.max(0, Math.min(1, input.behavioralAffinity)) * 5)

  const overall = Math.min(100, values + interests + social + community + locationScore + activity + trust + feedback)

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
      social,
      activity,
      trust,
      feedback,
      semanticAssist: Math.round(semanticAssist * 100) / 100,
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
