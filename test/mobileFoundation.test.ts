import { describe, expect, it } from 'vitest'
import { Colors, Radii, Spacing } from '../constants/theme'
import { calculateMatchScore } from '../services/matching'

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
    it('executes deterministic match ranking in mobile service', () => {
      const match = calculateMatchScore({
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
      expect(match.geographicTier).toBe('same_city')
    })
  })
})
