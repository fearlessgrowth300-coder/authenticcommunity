import { supabase } from '../../../src/integrations/supabase/client'
import { scoreLocalRecommendation } from '../../../src/lib/recommendations'
import { formatDistanceToNow } from 'date-fns'

export type FeedTab = 'For You' | 'Following' | 'Nearby'

export type PostFeedItem = {
  id: string
  type: 'post'
  contentType: 'text' | 'image' | 'video' | 'carousel' | 'event_share' | 'community_share'
  authorId: string
  authorName: string
  authorAvatar: string | null
  isVerified: boolean
  createdAt: string
  timeAgo: string
  tag: string
  text: string
  media: Array<{ url: string; type: 'image' | 'video' }>
  communityName?: string
  communityId?: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
  isFollowingAuthor: boolean
  locationLabel?: string
  score: number
}

export type SuggestedProfileFeedItem = {
  id: string
  type: 'suggested_profile'
  userId: string
  name: string
  avatar: string | null
  city: string
  distance: string
  matchPercentage: number
  role: string
  interests: string[]
  isFollowing: boolean
}

export type SuggestedCommunityFeedItem = {
  id: string
  type: 'suggested_community'
  communityId: string
  name: string
  image: string
  membersCount: number
  distance: string
  category: string
  description: string
  isJoined: boolean
}

export type SuggestedEventFeedItem = {
  id: string
  type: 'suggested_event'
  eventId: string
  title: string
  image: string
  date: string
  time: string
  distance: string
  attendeesCount: number
  isRsvped: boolean
}

export type FeedItem =
  | PostFeedItem
  | SuggestedProfileFeedItem
  | SuggestedCommunityFeedItem
  | SuggestedEventFeedItem

export type CommentRecord = {
  id: string
  postId: string
  userId: string
  authorName: string
  authorAvatar: string | null
  content: string
  createdAt: string
  timeAgo: string
}

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85'
const fallbackCommunityImg =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85'
const fallbackEventImg =
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1100&q=85'

const recordedImpressions = new Set<string>()

/**
 * Record user interactions (impressions, clicks, profile_open, etc.) in feed_interactions.
 */
export async function recordFeedInteraction(params: {
  interactionType:
    | 'impression'
    | 'like'
    | 'comment'
    | 'save'
    | 'share'
    | 'profile_open'
    | 'follow'
    | 'community_join'
    | 'event_rsvp'
    | 'hidden'
    | 'reported'
  postId?: string
  storyId?: string
  metadata?: Record<string, any>
}) {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    // Prevent excessive duplicate impressions in the same session
    if (params.interactionType === 'impression' && params.postId) {
      const key = `${auth.user.id}-${params.postId}`
      if (recordedImpressions.has(key)) return
      recordedImpressions.add(key)
    }

    await (supabase as any).from('feed_interactions').insert({
      user_id: auth.user.id,
      post_id: params.postId || null,
      story_id: params.storyId || null,
      interaction_type: params.interactionType,
      metadata: params.metadata || {},
    })
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Fetch and construct the real personalized feed according to the active tab.
 */
export async function loadFeedPage(params: {
  tab: FeedTab
  page: number
  pageSize?: number
}): Promise<{ items: FeedItem[]; hasMore: boolean }> {
  const { tab, page, pageSize = 8 } = params
  const { data: auth } = await supabase.auth.getUser()
  const currentUserId = auth?.user?.id || null

  // 1. Fetch current user context (profile, interests, follows, blocked, dismissals)
  let myProfile: any = null
  let myInterests: string[] = []
  const followSet = new Set<string>()
  const blockedSet = new Set<string>()
  const dismissedSet = new Set<string>()

  if (currentUserId) {
    const [pRes, iRes, fRes, bRes, dRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('location_city, location_state, location_country, latitude, longitude')
        .eq('user_id', currentUserId)
        .maybeSingle(),
      supabase.from('user_interests').select('interest_name').eq('user_id', currentUserId),
      supabase.from('user_follows').select('following_id').eq('follower_id', currentUserId),
      supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
      (supabase as any)
        .from('content_dismissals')
        .select('content_id')
        .eq('user_id', currentUserId),
    ])

    myProfile = pRes.data
    myInterests = (iRes.data || []).map((row: any) => row.interest_name)
    ;(fRes.data || []).forEach((row: any) => followSet.add(row.following_id))
    ;(bRes.data || []).forEach((row: any) => {
      if (row.blocker_id === currentUserId) blockedSet.add(row.blocked_id)
      if (row.blocked_id === currentUserId) blockedSet.add(row.blocker_id)
    })
    ;(dRes.data || []).forEach((row: any) => dismissedSet.add(row.content_id))
  }

  // 2. Fetch raw active posts from Supabase
  let postsQuery = (supabase as any)
    .from('posts')
    .select('id, user_id, community_id, content, content_type, visibility, interest_tags, location_label, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)

  if (tab === 'Following' && currentUserId) {
    const followedList = Array.from(followSet)
    if (followedList.length === 0) {
      return { items: [], hasMore: false }
    }
    postsQuery = postsQuery.in('user_id', followedList)
  }

  const { data: postsData, error: postsError } = await postsQuery
  const rawPosts = postsData || []

  // Filter out blocked authors and dismissed posts
  const filteredPosts = rawPosts.filter(
    (p: any) => !blockedSet.has(p.user_id) && !dismissedSet.has(p.id)
  )

  const postIds = filteredPosts.map((p: any) => p.id)
  const authorIds = Array.from(new Set(filteredPosts.map((p: any) => p.user_id)))

  // 3. Fetch related post media, authors, likes, saves, and comments count
  const [mediaRes, authorsRes, likesRes, savesRes, commentsRes, commsRes] = await Promise.all([
    postIds.length > 0
      ? (supabase as any).from('post_media').select('post_id, media_url, media_type, sort_order').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    authorIds.length > 0
      ? supabase
          .from('profiles')
          .select('user_id, first_name, last_name, profile_image_url, location_city, location_state, location_country, is_active, account_status')
          .in('user_id', authorIds)
      : Promise.resolve({ data: [] }),
    currentUserId && postIds.length > 0
      ? (supabase as any).from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    currentUserId && postIds.length > 0
      ? (supabase as any).from('post_saves').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? (supabase as any).from('post_comments').select('post_id')
      : Promise.resolve({ data: [] }),
    (supabase as any).from('communities').select('id, community_name').eq('is_active', true),
  ])

  const mediaMap = new Map<string, Array<{ url: string; type: 'image' | 'video' }>>()
  ;(mediaRes.data || []).forEach((m: any) => {
    if (!mediaMap.has(m.post_id)) mediaMap.set(m.post_id, [])
    mediaMap.get(m.post_id)!.push({ url: m.media_url, type: m.media_type })
  })

  const authorMap = new Map<string, any>()
  ;(authorsRes.data || []).forEach((a: any) => {
    // Only include active and non-suspended profiles
    if (a.is_active !== false && a.account_status !== 'suspended' && a.account_status !== 'deleted') {
      authorMap.set(a.user_id, a)
    }
  })

  const myLikedPostIds = new Set((likesRes.data || []).map((l: any) => l.post_id))
  const mySavedPostIds = new Set((savesRes.data || []).map((s: any) => s.post_id))

  const commentCountMap = new Map<string, number>()
  ;(commentsRes.data || []).forEach((c: any) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
  })

  const communityNameMap = new Map<string, string>()
  ;(commsRes.data || []).forEach((c: any) => communityNameMap.set(c.id, c.community_name))

  // 4. Build post feed items
  const postItems: PostFeedItem[] = []

  for (const post of filteredPosts) {
    const author = authorMap.get(post.user_id)
    // If author account is inactive/suspended, skip post
    if (!author) continue

    const authorName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Community Member'
    const postMedia = mediaMap.get(post.id) || []
    const isFollowing = followSet.has(post.user_id)
    const isLiked = myLikedPostIds.has(post.id)
    const isSaved = mySavedPostIds.has(post.id)
    const commentsCount = commentCountMap.get(post.id) || 0

    let timeAgo = 'Just now'
    try {
      timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false }) + ' ago'
    } catch {
      timeAgo = 'Recently'
    }

    const postCity = post.location_label || author.location_city || null
    const sameCity = Boolean(myProfile?.location_city && postCity && myProfile.location_city.toLowerCase() === postCity.toLowerCase())

    const rec = scoreLocalRecommendation({
      itemCity: postCity,
      itemCategory: (post.interest_tags && post.interest_tags[0]) || 'community',
      memberCount: (post.likes_count || 0) * 2 + commentsCount,
      myCity: myProfile?.location_city,
      myInterests,
    })

    const score =
      (isFollowing ? 50 : 0) +
      (sameCity ? 30 : 0) +
      rec.score +
      (tab === 'Nearby' && sameCity ? 100 : 0)

    let finalContentType = post.content_type || 'text'
    if (postMedia.length > 1) finalContentType = 'carousel'
    else if (postMedia.length === 1) finalContentType = postMedia[0].type === 'video' ? 'video' : 'image'

    postItems.push({
      id: post.id,
      type: 'post',
      contentType: finalContentType,
      authorId: post.user_id,
      authorName,
      authorAvatar: author.profile_image_url || null,
      isVerified: false,
      createdAt: post.created_at,
      timeAgo,
      tag: post.community_id ? communityNameMap.get(post.community_id) || 'Community' : (post.interest_tags && post.interest_tags[0]) || 'General',
      text: post.content || '',
      media: postMedia,
      communityName: post.community_id ? communityNameMap.get(post.community_id) : undefined,
      communityId: post.community_id || undefined,
      likesCount: (post.likes_count || 0) + (isLiked ? 1 : 0),
      commentsCount,
      isLiked,
      isSaved,
      isFollowingAuthor: isFollowing,
      locationLabel: postCity || undefined,
      score,
    })
  }

  // 5. Seed fallback posts if feed in development database is currently sparse
  if (postItems.length === 0 && tab !== 'Following') {
    postItems.push(
      {
        id: 'seed-post-1',
        type: 'post',
        contentType: 'image',
        authorId: 'seed-author-maya',
        authorName: 'Maya Patel',
        authorAvatar: fallbackAvatar,
        isVerified: true,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        timeAgo: '2h ago',
        tag: 'Austin Hikers',
        text: 'Perfect Saturday with the Austin Trail Crew 🌿 Great views, even better conversations. Local community really matters.',
        media: [
          {
            url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1100&q=85',
            type: 'image',
          },
        ],
        communityName: 'Austin Hikers',
        communityId: 'seed-comm-1',
        likesCount: 24,
        commentsCount: 6,
        isLiked: false,
        isSaved: false,
        isFollowingAuthor: followSet.has('seed-author-maya'),
        locationLabel: 'Austin, Texas',
        score: 95,
      },
      {
        id: 'seed-post-2',
        type: 'post',
        contentType: 'text',
        authorId: 'seed-author-alex',
        authorName: 'Alex Johnson',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
        isVerified: true,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        timeAgo: '5h ago',
        tag: 'Startup Circle',
        text: "Tonight's founder coffee meetup starts at 7 PM. First-timers are very welcome! Come curious, leave with at least one new person you know.",
        media: [],
        communityName: 'Startup Circle',
        communityId: 'seed-comm-2',
        likesCount: 18,
        commentsCount: 4,
        isLiked: false,
        isSaved: false,
        isFollowingAuthor: followSet.has('seed-author-alex'),
        locationLabel: 'Austin, Texas',
        score: 80,
      }
    )
  }

  // 6. Sort post items based on tab
  if (tab === 'Following') {
    postItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (tab === 'Nearby') {
    postItems.sort((a, b) => b.score - a.score)
  } else {
    // For You: balanced recommendation
    postItems.sort((a, b) => b.score - a.score)
  }

  // 7. For 'For You' or 'Nearby', interleave suggested discovery items (Profiles, Communities, Events)
  const combinedItems: FeedItem[] = []

  if (tab === 'For You' || tab === 'Nearby') {
    const [profilesRes, commsListRes, eventsListRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, profile_image_url, location_city, bio, looking_for')
        .neq('user_id', currentUserId || '')
        .eq('is_active', true)
        .limit(3),
      (supabase as any)
        .from('communities')
        .select('id, community_name, description, category, profile_image_url, location_city, member_count')
        .eq('is_active', true)
        .limit(2),
      supabase
        .from('events')
        .select('id, title, description, event_date, location_name, location_city, image_url')
        .eq('is_active', true)
        .order('event_date', { ascending: true })
        .limit(2),
    ])

    const suggestedProfiles = (profilesRes.data || [])
      .filter((p: any) => !blockedSet.has(p.user_id) && !dismissedSet.has(p.user_id))
      .map(
        (p: any): SuggestedProfileFeedItem => ({
          id: `profile-${p.user_id}`,
          type: 'suggested_profile',
          userId: p.user_id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'New Member',
          avatar: p.profile_image_url || fallbackAvatar,
          city: p.location_city || 'Local area',
          distance: p.location_city && myProfile?.location_city === p.location_city ? 'Near you' : 'In your region',
          matchPercentage: 91,
          role: p.bio || 'Authentic community member',
          interests: ['Community', 'Growth', 'Learning'],
          isFollowing: followSet.has(p.user_id),
        })
      )

    const suggestedCommunities = (commsListRes.data || []).map(
      (c: any): SuggestedCommunityFeedItem => ({
        id: `community-${c.id}`,
        type: 'suggested_community',
        communityId: c.id,
        name: c.community_name,
        image: c.profile_image_url || fallbackCommunityImg,
        membersCount: c.member_count || 12,
        distance: c.location_city ? `Near ${c.location_city}` : 'Local community',
        category: c.category || 'Community',
        description: c.description || 'A welcoming space for local connections.',
        isJoined: false,
      })
    )

    const suggestedEvents = (eventsListRes.data || []).map(
      (e: any): SuggestedEventFeedItem => ({
        id: `event-${e.id}`,
        type: 'suggested_event',
        eventId: e.id,
        title: e.title,
        image: e.image_url || fallbackEventImg,
        date: e.event_date ? new Date(e.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Upcoming',
        time: '7:00 PM',
        distance: e.location_city ? `${e.location_city}` : 'Nearby',
        attendeesCount: 16,
        isRsvped: false,
      })
    )

    // Interleave discovery cards seamlessly into the feed stream
    let profileIdx = 0
    let commIdx = 0
    let eventIdx = 0

    postItems.forEach((post, i) => {
      combinedItems.push(post)
      if (i === 0 && suggestedProfiles[profileIdx]) {
        combinedItems.push(suggestedProfiles[profileIdx++])
      } else if (i === 1 && suggestedCommunities[commIdx]) {
        combinedItems.push(suggestedCommunities[commIdx++])
      } else if (i === 2 && suggestedEvents[eventIdx]) {
        combinedItems.push(suggestedEvents[eventIdx++])
      }
    })

    // If there were fewer posts, push remaining suggestions
    while (profileIdx < suggestedProfiles.length) combinedItems.push(suggestedProfiles[profileIdx++])
    while (commIdx < suggestedCommunities.length) combinedItems.push(suggestedCommunities[commIdx++])
    while (eventIdx < suggestedEvents.length) combinedItems.push(suggestedEvents[eventIdx++])
  } else {
    combinedItems.push(...postItems)
  }

  // 8. Apply pagination slice
  const start = (page - 1) * pageSize
  const paginatedItems = combinedItems.slice(start, start + pageSize)
  const hasMore = start + pageSize < combinedItems.length

  // 9. Asynchronously track impressions
  paginatedItems.forEach(item => {
    if (item.type === 'post' && !item.id.startsWith('seed-')) {
      recordFeedInteraction({ interactionType: 'impression', postId: item.id })
    }
  })

  return { items: paginatedItems, hasMore }
}

/**
 * Toggle like for a post.
 */
export async function togglePostLike(postId: string, isCurrentlyLiked: boolean) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to like posts.')

  if (postId.startsWith('seed-')) {
    return !isCurrentlyLiked
  }

  if (isCurrentlyLiked) {
    const { error } = await (supabase as any)
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', auth.user.id)
    if (error) throw error
    return false
  } else {
    const { error } = await (supabase as any)
      .from('post_likes')
      .insert({ post_id: postId, user_id: auth.user.id })
    if (error) throw error
    recordFeedInteraction({ interactionType: 'like', postId })
    return true
  }
}

/**
 * Toggle bookmark / save for a post.
 */
export async function togglePostSave(postId: string, isCurrentlySaved: boolean) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to save posts.')

  if (postId.startsWith('seed-')) {
    return !isCurrentlySaved
  }

  if (isCurrentlySaved) {
    const { error } = await (supabase as any)
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', auth.user.id)
    if (error) throw error
    return false
  } else {
    const { error } = await (supabase as any)
      .from('post_saves')
      .insert({ post_id: postId, user_id: auth.user.id })
    if (error) throw error
    recordFeedInteraction({ interactionType: 'save', postId })
    return true
  }
}

/**
 * Toggle follow status for a user.
 */
export async function toggleUserFollow(targetUserId: string, isCurrentlyFollowing: boolean) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to follow members.')

  if (isCurrentlyFollowing) {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', auth.user.id)
      .eq('following_id', targetUserId)
    if (error) throw error
    return false
  } else {
    const { error } = await supabase
      .from('user_follows')
      .insert({ follower_id: auth.user.id, following_id: targetUserId })
    if (error) throw error
    recordFeedInteraction({ interactionType: 'follow', metadata: { targetUserId } })
    return true
  }
}

/**
 * Dismiss a feed item from showing again.
 */
export async function dismissFeedItem(contentId: string, contentType: 'post' | 'story' | 'user' | 'community') {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return

  await (supabase as any).from('content_dismissals').upsert(
    {
      user_id: auth.user.id,
      content_id: contentId,
      content_type: contentType,
    },
    { onConflict: 'user_id,content_type,content_id' }
  )

  if (contentType === 'post') {
    recordFeedInteraction({ interactionType: 'hidden', postId: contentId })
  }
}

/**
 * Load comments for a specific post.
 */
export async function loadPostComments(postId: string): Promise<CommentRecord[]> {
  if (postId.startsWith('seed-')) {
    return [
      {
        id: 'seed-comment-1',
        postId,
        userId: 'seed-user-1',
        authorName: 'Alex Johnson',
        authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
        content: 'Such a great group! Will be there next weekend.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        timeAgo: '1h ago',
      },
    ]
  }

  const { data, error } = await (supabase as any)
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const userIds = Array.from(new Set(data.map((c: any) => c.user_id)))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, profile_image_url')
    .in('user_id', userIds)

  const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))

  return data.map((c: any) => {
    const p = profileMap.get(c.user_id)
    const name = `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Community Member'
    let timeAgo = 'Just now'
    try {
      timeAgo = formatDistanceToNow(new Date(c.created_at), { addSuffix: false }) + ' ago'
    } catch {
      timeAgo = 'Recently'
    }
    return {
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      authorName: name,
      authorAvatar: p?.profile_image_url || null,
      content: c.content,
      createdAt: c.created_at,
      timeAgo,
    }
  })
}

/**
 * Add a comment to a post.
 */
export async function addPostComment(postId: string, content: string): Promise<CommentRecord> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to leave a comment.')

  if (postId.startsWith('seed-')) {
    return {
      id: `seed-c-${Date.now()}`,
      postId,
      userId: auth.user.id,
      authorName: 'You',
      authorAvatar: null,
      content,
      createdAt: new Date().toISOString(),
      timeAgo: 'Just now',
    }
  }

  const { data, error } = await (supabase as any)
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: auth.user.id,
      content: content.trim(),
    })
    .select('id, post_id, user_id, content, created_at')
    .single()

  if (error) throw error

  recordFeedInteraction({ interactionType: 'comment', postId })

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, profile_image_url')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  const authorName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'You'

  return {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    authorName,
    authorAvatar: profile?.profile_image_url || null,
    content: data.content,
    createdAt: data.created_at,
    timeAgo: 'Just now',
  }
}

export type CreatePostInput = {
  content?: string
  mediaFiles?: File[]
  visibility?: 'public' | 'followers' | 'connections' | 'community' | 'private'
  communityId?: string | null
  locationLabel?: string | null
  interestTags?: string[]
  onProgress?: (status: string) => void
}

/**
 * Validate media, upload to Supabase Storage under {user_id}/{post_id}/,
 * create post and post_media records, and rollback on failure.
 */
export async function createPostWithMedia(input: CreatePostInput): Promise<string> {
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || !auth?.user) {
    throw new Error('You must be signed in to create a post.')
  }
  const userId = auth.user.id

  // 1. Validation
  const text = (input.content || '').trim()
  const files = input.mediaFiles || []

  if (!text && files.length === 0) {
    throw new Error('Please enter text or attach media to post.')
  }

  // Validate files
  const allowedImageMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/jpg']
  const allowedVideoMime = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/ogg']
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024 // 15MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

  let hasVideo = false
  let hasImage = false

  for (const file of files) {
    const isImg = allowedImageMime.includes(file.type.toLowerCase()) || file.type.startsWith('image/')
    const isVid = allowedVideoMime.includes(file.type.toLowerCase()) || file.type.startsWith('video/')

    if (!isImg && !isVid) {
      throw new Error(`Unsupported file type: ${file.name}. Please upload JPEG, PNG, WEBP, GIF, or MP4/WebM.`)
    }

    if (isImg) {
      hasImage = true
      if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(`Image ${file.name} exceeds the 15MB size limit.`)
      }
    }
    if (isVid) {
      hasVideo = true
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(`Video ${file.name} exceeds the 100MB size limit.`)
      }
    }
  }

  if (hasVideo && files.length > 1) {
    throw new Error('Videos must be uploaded individually.')
  }
  if (files.length > 8) {
    throw new Error('You can upload at most 8 images per carousel post.')
  }

  let contentType: 'text' | 'image' | 'video' | 'carousel' | 'community_share' = 'text'
  if (hasVideo) contentType = 'video'
  else if (files.length > 1) contentType = 'carousel'
  else if (files.length === 1) contentType = 'image'

  input.onProgress?.('Creating post record...')

  // 2. Insert post record with status 'active'
  const { data: postRecord, error: postError } = await (supabase as any)
    .from('posts')
    .insert({
      user_id: userId,
      community_id: input.communityId || null,
      content: text || null,
      content_type: contentType,
      visibility: input.visibility || 'public',
      interest_tags: input.interestTags || ['General', 'Community'],
      location_label: input.locationLabel || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (postError || !postRecord) {
    throw new Error(postError?.message || 'Failed to create post record.')
  }

  const postId = postRecord.id
  const uploadedStoragePaths: string[] = []

  // 3. Upload media files if any
  try {
    const postMediaRows: Array<{
      post_id: string
      media_url: string
      media_type: 'image' | 'video'
      sort_order: number
    }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isVid = file.type.startsWith('video/')
      const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg')
      const safePath = `${userId}/${postId}/media_${i}_${Date.now()}.${ext}`

      input.onProgress?.(`Uploading media ${i + 1} of ${files.length}...`)

      const { error: uploadError } = await supabase.storage
        .from('community-posts')
        .upload(safePath, file, {
          upsert: true,
          contentType: file.type || (isVid ? 'video/mp4' : 'image/jpeg'),
        })

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
      }

      uploadedStoragePaths.push(safePath)
      const { data: urlData } = supabase.storage.from('community-posts').getPublicUrl(safePath)
      const publicUrl = urlData?.publicUrl || safePath

      postMediaRows.push({
        post_id: postId,
        media_url: publicUrl,
        media_type: isVid ? 'video' : 'image',
        sort_order: i,
      })
    }

    // 4. Insert post_media rows
    if (postMediaRows.length > 0) {
      input.onProgress?.('Linking post media...')
      const { error: mediaInsertError } = await (supabase as any)
        .from('post_media')
        .insert(postMediaRows)

      if (mediaInsertError) {
        throw new Error(`Failed to save post media: ${mediaInsertError.message}`)
      }
    }

    input.onProgress?.('Finished!')
    return postId
  } catch (err: any) {
    // 5. Rollback on failure: clean up post record and uploaded storage items
    input.onProgress?.('Encountered an error, cleaning up...')
    await (supabase as any).from('posts').delete().eq('id', postId)
    if (uploadedStoragePaths.length > 0) {
      await supabase.storage.from('community-posts').remove(uploadedStoragePaths)
    }
    throw err
  }
}

