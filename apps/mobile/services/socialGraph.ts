import { supabase } from './supabase'

export type FollowStatus = 'not_following' | 'following' | 'requested'
export type ConnectionStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected'

export type SocialProfileStats = {
  followersCount: number
  followingCount: number
  connectionsCount: number
}

export type SocialUser = {
  id: string
  userId: string
  name: string
  avatarUrl: string | null
  city: string | null
  country: string | null
  bio: string | null
  isVerified: boolean
  isFollowing: boolean
  isFollower: boolean
  connectionStatus: ConnectionStatus
  matchScore?: number
  interests?: string[]
  values?: string[]
}

/**
 * Get the precise social relationship state between current user and target user.
 */
export async function getRelationshipState(
  currentUserId: string,
  targetUserId: string
): Promise<{
  followStatus: FollowStatus
  isFollower: boolean
  connectionStatus: ConnectionStatus
}> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return {
      followStatus: 'not_following',
      isFollower: false,
      connectionStatus: 'none',
    }
  }

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  const [followingRes, followerRes, followReqRes, connRes] = await Promise.all([
    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle(),
    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', targetUserId)
      .eq('following_id', currentUserId)
      .maybeSingle(),
    supabase
      .from('follow_requests' as any)
      .select('id, status')
      .eq('requester_id', currentUserId)
      .eq('target_id', targetUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('connections')
      .select('id, user_id_1, user_id_2, status, connection_type')
      .eq('user_id_1', u1)
      .eq('user_id_2', u2)
      .maybeSingle(),
  ])

  let followStatus: FollowStatus = 'not_following'
  if (followingRes.data) {
    followStatus = 'following'
  } else if (followReqRes.data) {
    followStatus = 'requested'
  }

  const isFollower = Boolean(followerRes.data)

  let connectionStatus: ConnectionStatus = 'none'
  if (connRes.data) {
    const rawStatus = (connRes.data.status || '').toLowerCase()
    if (rawStatus === 'active' || rawStatus === 'accepted') {
      connectionStatus = 'connected'
    } else if (rawStatus === 'pending') {
      const requesterId = connRes.data.connection_type?.replace('requested_by:', '')
      connectionStatus =
        requesterId === currentUserId ? 'pending_outgoing' : 'pending_incoming'
    }
  }

  return {
    followStatus,
    isFollower,
    connectionStatus,
  }
}

/**
 * Fetch counts for followers, following, and connections.
 */
export async function getProfileSocialStats(userId: string): Promise<SocialProfileStats> {
  const [followersRes, followingRes, connRes] = await Promise.all([
    supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .in('status', ['active', 'accepted']),
  ])

  return {
    followersCount: followersRes.count || 0,
    followingCount: followingRes.count || 0,
    connectionsCount: connRes.count || 0,
  }
}

/**
 * Follow a user. If target is private, sends a follow request.
 */
export async function followUser(targetUserId: string): Promise<FollowStatus> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to follow members.')
  const currentUserId = auth.user.id

  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.')
  }

  // Check target profile visibility
  const { data: targetProfile } = await (supabase as any)
    .from('profiles')
    .select('profile_visibility')
    .eq('user_id', targetUserId)
    .maybeSingle()

  const isPrivate = targetProfile?.profile_visibility === 'private'

  if (isPrivate) {
    const { error } = await (supabase as any).from('follow_requests').upsert(
      {
        requester_id: currentUserId,
        target_id: targetUserId,
        status: 'pending',
      },
      { onConflict: 'requester_id,target_id' }
    )
    if (error) throw error
    return 'requested'
  } else {
    const { error } = await supabase.from('user_follows').insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    })
    if (error && !error.message.includes('duplicate')) throw error
    return 'following'
  }
}

/**
 * Unfollow user or cancel pending follow request.
 */
export async function unfollowUser(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage follows.')
  const currentUserId = auth.user.id

  await Promise.all([
    supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId),
    (supabase as any)
      .from('follow_requests')
      .delete()
      .eq('requester_id', currentUserId)
      .eq('target_id', targetUserId),
  ])
}

/**
 * Remove a follower.
 */
export async function removeFollower(followerUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage followers.')
  const currentUserId = auth.user.id

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerUserId)
    .eq('following_id', currentUserId)

  if (error) throw error
}

/**
 * Send a connection request.
 * Mutual follows must NEVER automatically create a connection.
 */
export async function requestConnection(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to connect.')
  const currentUserId = auth.user.id

  if (currentUserId === targetUserId) {
    throw new Error('You cannot connect with yourself.')
  }

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  const { error } = await (supabase as any).from('connections').upsert(
    {
      user_id_1: u1,
      user_id_2: u2,
      status: 'pending',
      connection_type: `requested_by:${currentUserId}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id_1,user_id_2' }
  )

  if (error) throw error
}

/**
 * Accept a connection request.
 */
export async function acceptConnection(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to respond to connections.')
  const currentUserId = auth.user.id

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  const { error } = await (supabase as any)
    .from('connections')
    .update({
      status: 'active',
      connection_type: 'mutual',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)

  if (error) throw error
}

/**
 * Decline or remove a connection.
 */
export async function removeConnection(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage connections.')
  const currentUserId = auth.user.id

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)

  if (error) throw error
}
