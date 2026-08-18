import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getRelationshipState,
  getProfileSocialStats,
  followUser,
  unfollowUser,
  removeFollower,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineOrCancelConnection,
  removeConnection,
  acceptFollowRequest,
  rejectFollowRequest,
} from '@/features/social/socialGraphApi'
import { supabase } from '@/integrations/supabase/client'

vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = vi.fn()
  const mockAuth = {
    getUser: vi.fn(),
  }
  return {
    supabase: {
      from: mockFrom,
      auth: mockAuth,
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
          getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://avatar.url' } })),
        })),
      },
    },
  }
})

describe('Phase 4: Social Graph & Relationship Engine', () => {
  const currentUserId = 'user-current-111'
  const targetUserId = 'user-target-222'

  beforeEach(() => {
    vi.clearAllMocks()
    ;(supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: currentUserId } },
      error: null,
    })
  })

  describe('Relationship State Resolution', () => {
    it('returns default disconnected state when viewing own profile', async () => {
      const state = await getRelationshipState(currentUserId, currentUserId)
      expect(state).toEqual({
        followStatus: 'not_following',
        isFollower: false,
        connectionStatus: 'none',
      })
    })

    it('identifies following and mutual connection correctly', async () => {
      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'user_follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation((col: string, val: string) => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({
                data: col === 'follower_id' && val === currentUserId ? { id: 'f-1' } : null,
              }),
            })),
          }
        }
        if (table === 'follow_requests') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }
        }
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'conn-1', status: 'active', connection_type: 'friendship' },
            }),
          }
        }
        if (table === 'matches') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { status: 'accepted' },
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const state = await getRelationshipState(currentUserId, targetUserId)
      expect(state.followStatus).toBe('following')
      expect(state.connectionStatus).toBe('connected')
    })

    it('identifies outgoing pending connection request', async () => {
      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'conn-pending-1',
                status: 'pending',
                connection_type: `requested_by:${currentUserId}`,
              },
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const state = await getRelationshipState(currentUserId, targetUserId)
      expect(state.connectionStatus).toBe('pending_outgoing')
    })

    it('identifies incoming pending connection request', async () => {
      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'conn-pending-2',
                status: 'pending',
                connection_type: `requested_by:${targetUserId}`,
              },
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const state = await getRelationshipState(currentUserId, targetUserId)
      expect(state.connectionStatus).toBe('pending_incoming')
    })
  })

  describe('Rule: Mutual follows must NOT automatically create a connection', () => {
    it('mutual follows leave connection status as none', async () => {
      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'user_follows') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'follow-row' } }),
            })),
          }
        }
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const state = await getRelationshipState(currentUserId, targetUserId)
      expect(state.followStatus).toBe('following')
      expect(state.isFollower).toBe(true)
      expect(state.connectionStatus).toBe('none')
    })
  })

  describe('Follow System', () => {
    it('immediately follows a public profile and records notification and interaction', async () => {
      const insertFollowMock = vi.fn().mockResolvedValue({ error: null })
      const insertNotificationMock = vi.fn().mockResolvedValue({ error: null })
      const insertInteractionMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { profile_visibility: 'public' },
            }),
          }
        }
        if (table === 'user_follows') {
          return { insert: insertFollowMock }
        }
        if (table === 'notifications') {
          return { insert: insertNotificationMock }
        }
        if (table === 'feed_interactions') {
          return { insert: insertInteractionMock }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const result = await followUser(targetUserId)
      expect(result).toBe('following')
      expect(insertFollowMock).toHaveBeenCalledWith({
        follower_id: currentUserId,
        following_id: targetUserId,
      })
      expect(insertNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: targetUserId,
          type: 'follow',
        })
      )
    })

    it('creates follow request when target profile is private', async () => {
      const upsertRequestMock = vi.fn().mockResolvedValue({ error: null })
      const insertNotificationMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { profile_visibility: 'private' },
            }),
          }
        }
        if (table === 'follow_requests') {
          return { upsert: upsertRequestMock }
        }
        if (table === 'notifications') {
          return { insert: insertNotificationMock }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      const result = await followUser(targetUserId)
      expect(result).toBe('requested')
      expect(upsertRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requester_id: currentUserId,
          target_id: targetUserId,
          status: 'pending',
        }),
        expect.any(Object)
      )
      expect(insertNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: targetUserId,
          type: 'follow_request',
        })
      )
    })

    it('unfollows a user by deleting follow and request rows', async () => {
      const deleteFollowMock = vi.fn().mockReturnThis()
      const deleteReqMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockReturnThis()

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'user_follows') {
          return { delete: deleteFollowMock, eq: eqMock }
        }
        if (table === 'follow_requests') {
          return { delete: deleteReqMock, eq: eqMock }
        }
        return { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
      })

      await unfollowUser(targetUserId)
      expect(deleteFollowMock).toHaveBeenCalled()
      expect(deleteReqMock).toHaveBeenCalled()
    })

    it('removes a follower', async () => {
      const deleteFollowMock = vi.fn().mockReturnThis()
      const eqMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'user_follows') {
          return {
            delete: () => ({
              eq: () => ({
                eq: eqMock,
              }),
            }),
          }
        }
        return { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() }
      })

      await removeFollower(targetUserId)
      expect(eqMock).toHaveBeenCalled()
    })

    it('accepts and rejects follow requests', async () => {
      const deleteReqMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
      const insertFollowMock = vi.fn().mockResolvedValue({ error: null })
      const insertNotificationMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'follow_requests') {
          return { delete: deleteReqMock }
        }
        if (table === 'user_follows') {
          return { insert: insertFollowMock }
        }
        if (table === 'notifications') {
          return { insert: insertNotificationMock }
        }
        return {}
      })

      await acceptFollowRequest(targetUserId)
      expect(insertFollowMock).toHaveBeenCalledWith({
        follower_id: targetUserId,
        following_id: currentUserId,
      })

      await rejectFollowRequest(targetUserId)
      expect(deleteReqMock).toHaveBeenCalled()
    })
  })

  describe('Connection System', () => {
    it('sends connection request with initiator metadata', async () => {
      const upsertConnMock = vi.fn().mockResolvedValue({ error: null })
      const upsertMatchMock = vi.fn().mockResolvedValue({ error: null })
      const insertNotificationMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            upsert: upsertConnMock,
          }
        }
        if (table === 'matches') {
          return { upsert: upsertMatchMock }
        }
        if (table === 'notifications') {
          return { insert: insertNotificationMock }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }
      })

      await sendConnectionRequest(targetUserId)
      expect(upsertConnMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          connection_type: `requested_by:${currentUserId}`,
        }),
        expect.any(Object)
      )
      expect(insertNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: targetUserId,
          type: 'connection_request',
        })
      )
    })

    it('accepts connection request and activates mutual status', async () => {
      const updateConnMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
      const updateMatchMock = vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ error: null }),
      })
      const insertNotificationMock = vi.fn().mockResolvedValue({ error: null })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'connections') {
          return { update: updateConnMock }
        }
        if (table === 'matches') {
          return { update: updateMatchMock }
        }
        if (table === 'notifications') {
          return { insert: insertNotificationMock }
        }
        return {}
      })

      await acceptConnectionRequest(targetUserId)
      expect(updateConnMock).toHaveBeenCalledWith({
        status: 'active',
        connection_type: 'friendship',
      })
      expect(insertNotificationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: targetUserId,
          type: 'connection_accepted',
        })
      )
    })

    it('declines, cancels, or removes connection', async () => {
      const deleteConnMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })
      const deleteMatchMock = vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ error: null }),
      })

      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'connections') {
          return { delete: deleteConnMock }
        }
        if (table === 'matches') {
          return { delete: deleteMatchMock }
        }
        return {}
      })

      await declineOrCancelConnection(targetUserId)
      expect(deleteConnMock).toHaveBeenCalled()
      expect(deleteMatchMock).toHaveBeenCalled()

      await removeConnection(targetUserId)
      expect(deleteConnMock).toHaveBeenCalled()
    })
  })

  describe('Social Counts', () => {
    it('retrieves accurate follower, following, and connection counts', async () => {
      ;(supabase.from as any).mockImplementation((table: string) => {
        if (table === 'user_follows') {
          return {
            select: vi.fn().mockImplementation((_cols: string, opts?: any) => ({
              eq: vi.fn().mockImplementation((col: string) => ({
                count: col === 'following_id' ? 42 : 18,
              })),
            })),
          }
        }
        if (table === 'connections') {
          return {
            select: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ count: 9 }),
              }),
            }),
          }
        }
        return {}
      })

      const stats = await getProfileSocialStats(currentUserId)
      expect(stats.followersCount).toBe(42)
      expect(stats.followingCount).toBe(18)
      expect(stats.connectionsCount).toBe(9)
    })
  })
})
