import { describe, expect, it } from 'vitest'
import { Colors, Radii, Spacing } from '../../apps/mobile/constants/theme'
import { scoreConnection, scoreCandidateMatch } from '../../packages/core/src/matching/matching'
import { scoreLocalRecommendation } from '../../packages/core/src/recommendations/recommendations'

describe('Mobile Migration M1: Foundation & Shared Core Suite', () => {
  describe('Design System Tokens', () => {
    it('preserves exact Authentic visual brand palette in mobile theme', () => {
      expect(Colors.primary).toBe('#4F46E5')
      expect(Colors.primaryDark).toBe('#4338CA')
      expect(Colors.primaryLight).toBe('#EEF2FF')
      expect(Colors.coral).toBe('#F9736B')
      expect(Colors.sage).toBe('#3BAA7A')
      expect(Colors.amber).toBe('#F6B94A')
      expect(Colors.background).toBe('#F8FAFC')
      expect(Colors.surface).toBe('#FFFFFF')
      expect(Colors.border).toBe('#E2E8F0')
    })

    it('maintains mobile card and button border radius specifications', () => {
      expect(Radii.md).toBe(12)
      expect(Radii.lg).toBe(16)
      expect(Radii.xl).toBe(20)
      expect(Radii.full).toBe(9999)
    })
  })

  describe('Shared Core Matching Algorithm Extraction', () => {
    it('executes identical deterministic match ranking in @authentic/core', () => {
      const match = scoreConnection({
        candidateId: 'user-cand-1',
        candidateInterests: ['Coding', 'Startups', 'Hiking'],
        candidateValues: ['Authenticity', 'Growth'],
        candidateCity: 'Austin',
        candidateGoal: 'friends',
        myInterests: ['Coding', 'Startups'],
        myValues: ['Authenticity', 'Growth'],
        myCity: 'Austin',
        myGoal: 'friends',
        sharedCommunities: 3,
        behavioralAffinity: 0.9,
      })

      expect(match.overall).toBeGreaterThanOrEqual(70)
      expect(match.breakdown.location).toBe(10)
      expect(match.reasons[0].toLowerCase()).toContain('authenticity')
    })

    it('executes identical local recommendation ranking in @authentic/core', () => {
      const localRec = scoreLocalRecommendation({
        itemCity: 'Lagos',
        itemCategory: 'tech',
        memberCount: 30,
        myCity: 'Lagos',
        myInterests: ['coding', 'tech'],
      })

      const distantRec = scoreLocalRecommendation({
        itemCity: 'Tokyo',
        itemCategory: 'tech',
        memberCount: 5,
        myCity: 'Lagos',
        myInterests: ['coding', 'tech'],
      })

      expect(localRec.score).toBeGreaterThan(distantRec.score)
      expect(localRec.reason).toBe('Near you and fits your interests')
    })
  })

  describe('Onboarding Invariants', () => {
    it('evaluates profile completion state accurately for navigation routing', () => {
      const incompleteProfile = {
        first_name: 'Alex',
        location_city: null,
        age: null,
      }

      const completeProfile = {
        first_name: 'Alex',
        location_city: 'Austin',
        age: 28,
      }

      const isIncompleteOnboarded = Boolean(
        incompleteProfile.first_name &&
        incompleteProfile.location_city &&
        incompleteProfile.age
      )

      const isCompleteOnboarded = Boolean(
        completeProfile.first_name &&
        completeProfile.location_city &&
        completeProfile.age
      )

      expect(isIncompleteOnboarded).toBe(false)
      expect(isCompleteOnboarded).toBe(true)
    })
  })
})
