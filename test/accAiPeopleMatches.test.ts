import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rankPerson } from '../supabase/functions/_shared/recommendation/rankers/people'
import { calculateMatchScore } from '../services/matching'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI-4 People and Matches', () => {
  it('uses the documented deterministic weights and keeps trust modest', () => {
    const ranked = rankPerson({
      id: 'candidate', valuesCompatibility: 1, interestCompatibility: 1,
      socialCompatibility: 1, sharedCommunitySignals: 1,
      geographicCompatibility: 1, activityAvailability: 1,
      trustAccountQuality: 0, recommendationFeedback: 1,
      sharedValues: ['Growth'], sharedInterests: ['AI'],
    })
    expect(ranked.matchPercent).toBe(95)
    expect(ranked.reasonCodes).toContain('shared_value')
    expect(ranked.reasonCodes).toContain('shared_community')
  })

  it('caps semantic assistance at twenty percent of the interest signal', () => {
    const score = calculateMatchScore({
      candidateId: 'candidate', candidateInterests: ['Opera'], candidateValues: [],
      myInterests: ['Running'], myValues: [], semanticSimilarity: 1,
    })
    expect(score.breakdown.interests).toBe(4)
    expect(score.breakdown.semanticAssist).toBe(1)
  })

  it('makes the migration safe for skipped legacy tables and restricts feedback writes', () => {
    const migration = source('supabase/migrations/20260823000100_acc_ai4_people_matches.sql')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.recommendation_scores')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.recommendation_feedback')
    expect(migration).toContain('log_people_recommendation_feedback')
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.log_people_recommendation_feedback(UUID, TEXT) FROM anon')
    expect(migration).toContain('"values_compatibility": 0.30')
    expect(migration).toContain('"semantic_share_of_interest_signal_max": 0.20')
  })

  it('applies eligibility before scoring and never lets Gemini set the score', () => {
    const fn = source('supabase/functions/recommend-people/index.ts')
    expect(fn.indexOf('const eligible =')).toBeLessThan(fn.indexOf('const ranked ='))
    expect(fn).toContain('rankPerson(candidate)')
    expect(fn).toContain('shared_values:')
    expect(fn).toContain('GEMINI_API_KEY must be configured in Supabase Edge Function Secrets.')
    expect(fn).not.toMatch(/messages[^\n]+content/)
    expect(fn).not.toMatch(/return\s+\{[^}]*latitude/s)
    expect(fn).not.toMatch(/return\s+\{[^}]*longitude/s)
    expect(fn).not.toMatch(/Gemini[^\n]*(score|rank)/i)
  })

  it('wires Discover and profile actions to authenticated recommendation feedback', () => {
    const discover = source('app/(tabs)/discover.tsx')
    const profile = source('app/profile/[id].tsx')
    const service = source('services/discover.ts')
    expect(discover).toContain("recordPeopleRecommendationFeedback(cand.id, 'passed'")
    expect(discover).toContain("recordPeopleRecommendationFeedback(cand.id, 'saved'")
    expect(profile).toContain("recordPeopleRecommendationFeedback(id, 'connection_requested'")
    expect(profile).toContain('Suggestions are never sent automatically.')
    expect(service).toContain("rpc('log_people_recommendation_feedback'")
    expect(service).not.toContain("conversation_started: 'message_sent'")
  })
})
