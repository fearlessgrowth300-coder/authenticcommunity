import { supabase } from '@/integrations/supabase/client'
import { recordFeedInteraction } from '@/features/feed/feedApi'

export type FollowStatus = 'not_following' | 'following' | 'requested'
export type ConnectionStatus = 'none' | 'pending_outgoing' | 'pending_incoming' | 'connected'

export type SocialProfileStats = {
  followersCount: number
  followingCount: number
  connectionsCount: number
}

export type SocialMember = {
  userId: string
  name: string
  avatar: string | null
  city: string
  bio: string
  isFollowing: boolean
  isFollower: boolean
  connectionStatus: ConnectionStatus
  matchPercentage: number
  interests: string[]
}

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85'

/**
 * Get the precise social graph relationship state between two users.
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

  const [followingRes, followerRes, followReqRes, connRes, matchRes] = await Promise.all([
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
    (supabase as any)
      .from('follow_requests')
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
    supabase
      .from('matches')
      .select('user_id_1, user_id_2, status')
      .or(`and(user_id_1.eq.${currentUserId},user_id_2.eq.${targetUserId}),and(user_id_1.eq.${targetUserId},user_id_2.eq.${currentUserId})`)
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
    const rawStatus = (connRes.data.status || 'active').toLowerCase()
    if (rawStatus === 'active' || rawStatus === 'accepted') {
      connectionStatus = 'connected'
    } else if (rawStatus === 'pending') {
      if (connRes.data.connection_type?.startsWith('requested_by:')) {
        const requesterId = connRes.data.connection_type.replace('requested_by:', '')
        connectionStatus = requesterId === currentUserId ? 'pending_outgoing' : 'pending_incoming'
      } else if (matchRes.data && matchRes.data.status === 'pending') {
        connectionStatus = matchRes.data.user_id_1 === currentUserId ? 'pending_outgoing' : 'pending_incoming'
      } else {
        connectionStatus = 'pending_outgoing'
      }
    }
  } else if (matchRes.data && matchRes.data.status === 'pending') {
    connectionStatus = matchRes.data.user_id_1 === currentUserId ? 'pending_outgoing' : 'pending_incoming'
  } else if (matchRes.data && matchRes.data.status === 'accepted') {
    connectionStatus = 'connected'
  }

  return {
    followStatus,
    isFollower,
    connectionStatus,
  }
}

/**
 * Fetch live profile counts for followers, following, and connections.
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
 * Follow a user. If target profile is private, creates a follow_request; otherwise immediate follow.
 */
export async function followUser(targetUserId: string): Promise<FollowStatus> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to follow members.')
  const currentUserId = auth.user.id

  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself.')
  }

  // Check target user visibility
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('profile_visibility')
    .eq('user_id', targetUserId)
    .maybeSingle()

  const isPrivate = targetProfile?.profile_visibility === 'private'

  if (isPrivate) {
    // Upsert follow request
    const { error } = await (supabase as any).from('follow_requests').upsert(
      {
        requester_id: currentUserId,
        target_id: targetUserId,
        status: 'pending',
      },
      { onConflict: 'requester_id,target_id' }
    )
    if (error) throw error

    // Create notification for target user
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow_request',
      title: 'New Follow Request',
      message: 'requested to follow you.',
    })

    return 'requested'
  } else {
    // Immediate follow
    const { error } = await supabase.from('user_follows').insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    })
    if (error && !error.message.includes('duplicate')) throw error

    await recordFeedInteraction({
      interactionType: 'follow',
      metadata: { targetUserId },
    })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow',
      title: 'New Follower',
      message: 'started following you.',
    })

    return 'following'
  }
}

/**
 * Unfollow a user or cancel a pending follow request.
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
 * Remove a follower from following the current user.
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
 * Get pending follow requests for the authenticated user (private profiles).
 */
export async function getPendingFollowRequests(userId: string): Promise<SocialMember[]> {
  const { data: reqs } = await (supabase as any)
    .from('follow_requests')
    .select('requester_id')
    .eq('target_id', userId)
    .eq('status', 'pending')

  const requesterIds = (reqs || []).map((r: any) => r.requester_id)
  if (requesterIds.length === 0) return []

  return loadSocialMembers(requesterIds, userId)
}

/**
 * Accept an incoming follow request.
 */
export async function acceptFollowRequest(requesterUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage follow requests.')
  const currentUserId = auth.user.id

  await (supabase as any)
    .from('follow_requests')
    .delete()
    .eq('requester_id', requesterUserId)
    .eq('target_id', currentUserId)

  const { error } = await supabase.from('user_follows').insert({
    follower_id: requesterUserId,
    following_id: currentUserId,
  })
  if (error && !error.message.includes('duplicate')) throw error

  await supabase.from('notifications').insert({
    user_id: requesterUserId,
    actor_id: currentUserId,
    type: 'follow_request_accepted',
    title: 'Follow Request Accepted',
    message: 'accepted your follow request.',
  })
}

/**
 * Reject an incoming follow request.
 */
export async function rejectFollowRequest(requesterUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage follow requests.')
  const currentUserId = auth.user.id

  await (supabase as any)
    .from('follow_requests')
    .delete()
    .eq('requester_id', requesterUserId)
    .eq('target_id', currentUserId)
}

/**
 * Send a connection request to a target user.
 */
export async function sendConnectionRequest(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to connect with members.')
  const currentUserId = auth.user.id

  if (currentUserId === targetUserId) {
    throw new Error('You cannot connect with yourself.')
  }

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  // Check if connection already exists
  const { data: existingConn } = await supabase
    .from('connections')
    .select('id, status')
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)
    .maybeSingle()

  if (existingConn) {
    if (existingConn.status === 'active' || existingConn.status === 'accepted') {
      throw new Error('You are already connected with this member.')
    }
  }

  // Insert or update connection with 'pending' status and track initiator
  const { error: connError } = await supabase.from('connections').upsert(
    {
      user_id_1: u1,
      user_id_2: u2,
      status: 'pending',
      connection_type: `requested_by:${currentUserId}`,
    },
    { onConflict: 'user_id_1,user_id_2' }
  )

  if (connError) throw connError

  // Record match request tracking
  await supabase.from('matches').upsert(
    {
      user_id_1: currentUserId,
      user_id_2: targetUserId,
      status: 'pending',
      match_score: 90,
    },
    { onConflict: 'user_id_1,user_id_2' }
  )

  // Notify recipient
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    actor_id: currentUserId,
    type: 'connection_request',
    title: 'Connection Request',
    message: 'sent you a connection request.',
  })
}

/**
 * Accept a connection request.
 */
export async function acceptConnectionRequest(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to accept connection.')
  const currentUserId = auth.user.id

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  const { error } = await supabase
    .from('connections')
    .update({ status: 'active', connection_type: 'friendship' })
    .eq('user_id_1', u1)
    .eq('user_id_2', u2)

  if (error) throw error

  await supabase
    .from('matches')
    .update({ status: 'accepted' })
    .or(`and(user_id_1.eq.${u1},user_id_2.eq.${u2}),and(user_id_1.eq.${u2},user_id_2.eq.${u1})`)

  // Notify sender
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    actor_id: currentUserId,
    type: 'connection_accepted',
    title: 'Connection Accepted',
    message: 'accepted your connection request! You are now connected.',
  })
}

/**
 * Decline or cancel a connection request.
 */
export async function declineOrCancelConnection(targetUserId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to manage connections.')
  const currentUserId = auth.user.id

  const u1 = currentUserId < targetUserId ? currentUserId : targetUserId
  const u2 = currentUserId < targetUserId ? targetUserId : currentUserId

  await Promise.all([
    supabase.from('connections').delete().eq('user_id_1', u1).eq('user_id_2', u2),
    supabase
      .from('matches')
      .delete()
      .or(`and(user_id_1.eq.${u1},user_id_2.eq.${u2}),and(user_id_1.eq.${u2},user_id_2.eq.${u1})`),
  ])
}

/**
 * Remove an existing accepted connection.
 */
export async function removeConnection(targetUserId: string): Promise<void> {
  await declineOrCancelConnection(targetUserId)
}

/**
 * Get full list of followers for a user.
 */
export async function getFollowersList(userId: string): Promise<SocialMember[]> {
  const { data: followRows } = await supabase
    .from('user_follows')
    .select('follower_id')
    .eq('following_id', userId)

  const followerIds = (followRows || []).map(r => r.follower_id)
  if (followerIds.length === 0) return []

  return loadSocialMembers(followerIds, userId)
}

/**
 * Get full list of users followed by a user.
 */
export async function getFollowingList(userId: string): Promise<SocialMember[]> {
  const { data: followRows } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = (followRows || []).map(r => r.following_id)
  if (followingIds.length === 0) return []

  return loadSocialMembers(followingIds, userId)
}

/**
 * Get full list of active connections for a user.
 */
export async function getConnectionsList(userId: string): Promise<SocialMember[]> {
  const { data: connRows } = await supabase
    .from('connections')
    .select('user_id_1, user_id_2')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .in('status', ['active', 'accepted'])

  const connIds = (connRows || []).map(r =>
    r.user_id_1 === userId ? r.user_id_2 : r.user_id_1
  )
  if (connIds.length === 0) return []

  return loadSocialMembers(connIds, userId)
}

/**
 * Helper to enrich member profiles with interests, values, and connection states.
 */
async function loadSocialMembers(
  memberIds: string[],
  currentUserId: string
): Promise<SocialMember[]> {
  const [profilesRes, interestsRes, myFollowingRes, myFollowersRes, connsRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, profile_image_url, location_city, bio')
        .in('user_id', memberIds),
      supabase
        .from('user_interests')
        .select('user_id, interest_name')
        .in('user_id', memberIds),
      supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', memberIds),
      supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', currentUserId)
        .in('follower_id', memberIds),
      supabase
        .from('connections')
        .select('user_id_1, user_id_2, status, connection_type')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`)
        .in('status', ['active', 'accepted', 'pending']),
    ])

  const myFollowingSet = new Set((myFollowingRes.data || []).map(r => r.following_id))
  const myFollowersSet = new Set((myFollowersRes.data || []).map(r => r.follower_id))

  const connMap = new Map<string, ConnectionStatus>()
  ;(connsRes.data || []).forEach((c: any) => {
    const otherId = c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1
    const rawStatus = (c.status || 'active').toLowerCase()
    if (rawStatus === 'active' || rawStatus === 'accepted') {
      connMap.set(otherId, 'connected')
    } else if (rawStatus === 'pending') {
      if (c.connection_type?.startsWith('requested_by:')) {
        const requesterId = c.connection_type.replace('requested_by:', '')
        connMap.set(otherId, requesterId === currentUserId ? 'pending_outgoing' : 'pending_incoming')
      } else {
        connMap.set(otherId, 'pending_outgoing')
      }
    }
  })

  const interestMap = new Map<string, string[]>()
  ;(interestsRes.data || []).forEach((i: any) => {
    if (!interestMap.has(i.user_id)) interestMap.set(i.user_id, [])
    interestMap.get(i.user_id)!.push(i.interest_name)
  })

  return (profilesRes.data || []).map((p: any) => ({
    userId: p.user_id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Community Member',
    avatar: p.profile_image_url || fallbackAvatar,
    city: p.location_city || 'Local area',
    bio: p.bio || 'Authentic community member',
    isFollowing: myFollowingSet.has(p.user_id),
    isFollower: myFollowersSet.has(p.user_id),
    connectionStatus: connMap.get(p.user_id) || 'none',
    matchPercentage: 92,
    interests: interestMap.get(p.user_id) || ['Growth', 'Community'],
  }))
}
