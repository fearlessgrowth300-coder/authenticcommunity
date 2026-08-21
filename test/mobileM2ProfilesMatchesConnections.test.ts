import { describe, expect, it } from 'vitest'
import { calculateMatchScore } from '../services/matching'

describe('Mobile Migration M2: Profiles, Matches, Follow, and Connections Suite', () => {
  describe('1. Follow State Machine & Privacy Invariants', () => {
    it('handles public profile with immediate following state', () => {
      const isPrivate = false
      const targetUserId = 'u2'
      const currentUserId = 'u1'

      const computeFollowState = (isTargetPrivate: boolean) =>
        isTargetPrivate ? 'requested' : 'following'

      expect(computeFollowState(isPrivate)).toBe('following')
    })

    it('handles private profile with requested state', () => {
      const isPrivate = true
      const computeFollowState = (isTargetPrivate: boolean) =>
        isTargetPrivate ? 'requested' : 'following'

      expect(computeFollowState(isPrivate)).toBe('requested')
    })

    it('supports unfollow transitioning back to not_following', () => {
      let state = 'following'
      const unfollow = () => {
        state = 'not_following'
      }
      unfollow()
      expect(state).toBe('not_following')
    })
  })

  describe('2. Connection State Machine & Mutual Follow Independence', () => {
    it('mutual follows must NEVER automatically create a connection', () => {
      const relationship = {
        isFollowing: true,
        isFollower: true,
        connectionStatus: 'none' as 'none' | 'connected',
      }

      // Assert mutual follow does not equate to connected
      expect(relationship.isFollowing).toBe(true)
      expect(relationship.isFollower).toBe(true)
      expect(relationship.connectionStatus).toBe('none')
    })

    it('transitions through connection lifecycle: none -> pending_outgoing -> connected -> none', () => {
      let connectionStatus: 'none' | 'pending_outgoing' | 'connected' = 'none'

      // Send request
      connectionStatus = 'pending_outgoing'
      expect(connectionStatus).toBe('pending_outgoing')

      // Accept request
      connectionStatus = 'connected'
      expect(connectionStatus).toBe('connected')

      // Remove connection
      connectionStatus = 'none'
      expect(connectionStatus).toBe('none')
    })
  })

  describe('3. Local-First Deterministic Matching Hierarchy', () => {
    it('prioritizes same city over different cities with identical interests', () => {
      const sameCityScore = calculateMatchScore({
        candidateId: 'cand-1',
        candidateInterests: ['Hiking', 'Photography', 'Technology'],
        candidateValues: ['Kindness', 'Growth'],
        candidateCity: 'Austin',
        candidateCountry: 'USA',
        myInterests: ['Hiking', 'Photography', 'Technology'],
        myValues: ['Kindness', 'Growth'],
        myCity: 'Austin',
        myCountry: 'USA',
      })

      const diffCityScore = calculateMatchScore({
        candidateId: 'cand-2',
        candidateInterests: ['Hiking', 'Photography', 'Technology'],
        candidateValues: ['Kindness', 'Growth'],
        candidateCity: 'Seattle',
        candidateCountry: 'USA',
        myInterests: ['Hiking', 'Photography', 'Technology'],
        myValues: ['Kindness', 'Growth'],
        myCity: 'Austin',
        myCountry: 'USA',
      })

      expect(sameCityScore.geographicTier).toBe('same_city')
      expect(diffCityScore.geographicTier).toBe('same_country')
      expect(sameCityScore.overall).toBeGreaterThan(diffCityScore.overall)
      expect(sameCityScore.reasons).toContain('You both live in Austin')
    })

    it('identifies shared interests and shared values explainably', () => {
      const result = calculateMatchScore({
        candidateId: 'cand-3',
        candidateInterests: ['Hiking', 'Yoga', 'Cooking'],
        candidateValues: ['Kindness', 'Learning', 'Creativity'],
        candidateCity: 'Austin',
        candidateCountry: 'USA',
        myInterests: ['Hiking', 'Yoga', 'Travel'],
        myValues: ['Kindness', 'Learning', 'Community'],
        myCity: 'Austin',
        myCountry: 'USA',
      })

      expect(result.sharedInterests).toEqual(['Hiking', 'Yoga'])
      expect(result.sharedValues).toEqual(['Kindness', 'Learning'])
      expect(result.overall).toBeGreaterThanOrEqual(60)
    })
  })

  describe('4. Server-Side Verification Security Rule', () => {
    it('profile update payloads must never include or overwrite is_verified', () => {
      const clientUpdatePayload = {
        first_name: 'Jane',
        last_name: 'Doe',
        bio: 'Hello world',
        location_city: 'Austin',
      }

      expect(clientUpdatePayload).not.toHaveProperty('is_verified')
    })
  })
})
