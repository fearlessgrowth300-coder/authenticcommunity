import { supabase } from './supabase'

export type FeedStreamType = 'For You' | 'Following' | 'Nearby'

export interface MobilePostItem {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  isVerified: boolean
  location?: string
  topic?: string
  timeAgo: string
  text?: string
  images?: string[]
  videoUrl?: string
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
  isFollowing: boolean
  isConnection?: boolean
  score?: number
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  authorName: string
  authorAvatar: string | null
  isVerified: boolean
  text: string
  timeAgo: string
  likesCount: number
  isLiked?: boolean
}

/**
 * Record interaction telemetry in Supabase feed_interactions
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
    | 'connect'
    | 'rsvp'
  postId?: string
  targetUserId?: string
  communityId?: string
  eventId?: string
  dwellTimeMs?: number
}) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return

  try {
    await (supabase as any).from('feed_interactions').insert({
      user_id: auth.user.id,
      interaction_type: params.interactionType,
      post_id: params.postId || null,
      target_user_id: params.targetUserId || null,
      community_id: params.communityId || null,
      event_id: params.eventId || null,
      dwell_time_ms: params.dwellTimeMs || null,
    })
  } catch {
    // Telemetry errors fail silently without interrupting UI
  }
}

/**
 * Fetch real posts for Mobile Home feed with interest and value affinity scoring
 */
export async function fetchFeedPosts(params: {
  stream: FeedStreamType
  page?: number
  pageSize?: number
}): Promise<{ posts: MobilePostItem[]; hasMore: boolean }> {
  const { stream, page = 1, pageSize = 10 } = params
  const { data: auth } = await supabase.auth.getUser()
  const currentUserId = auth?.user?.id || null

  let myProfile: any = null
  const followSet = new Set<string>()
  const blockedSet = new Set<string>()
  const dismissedSet = new Set<string>()

  if (currentUserId) {
    const [pRes, fRes, bRes, dRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('location_city, location_state, location_country, interests, values')
        .eq('user_id', currentUserId)
        .maybeSingle(),
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
    ;(fRes.data || []).forEach((row: any) => followSet.add(row.following_id))
    ;(bRes.data || []).forEach((row: any) => {
      if (row.blocker_id === currentUserId) blockedSet.add(row.blocked_id)
      if (row.blocked_id === currentUserId) blockedSet.add(row.blocker_id)
    })
    ;(dRes.data || []).forEach((row: any) => dismissedSet.add(row.content_id))
  }

  // Build real posts query
  let query = (supabase as any)
    .from('posts')
    .select('id, user_id, community_id, content, content_type, visibility, interest_tags, location_label, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  if (stream === 'Following' && currentUserId) {
    const followedList = Array.from(followSet)
    if (followedList.length === 0) {
      return { posts: [], hasMore: false }
    }
    query = query.in('user_id', followedList)
  }

  const { data: rawPostsData, error: postsError } = await query
  if (postsError) throw postsError

  const filteredPosts = (rawPostsData || []).filter(
    (p: any) => !blockedSet.has(p.user_id) && !dismissedSet.has(p.id)
  )

  if (filteredPosts.length === 0) {
    return { posts: [], hasMore: false }
  }

  const postIds = filteredPosts.map((p: any) => p.id)
  const authorIds = Array.from(new Set(filteredPosts.map((p: any) => p.user_id))) as string[]

  // Parallel fetch media, authors, likes, saves, comments count
  const [mediaRes, authorsRes, likesRes, savesRes, commentsRes] = await Promise.all([
    (supabase as any).from('post_media').select('post_id, media_url, media_type, sort_order').in('post_id', postIds),
    authorIds.length > 0
      ? (supabase as any)
          .from('profiles')
          .select('id, user_id, first_name, last_name, profile_image_url, location_city, location_country, interests, values, is_verified, is_active, account_status')
          .in('user_id', authorIds)
      : Promise.resolve({ data: [] }),
    currentUserId
      ? (supabase as any).from('post_likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    currentUserId
      ? (supabase as any).from('post_saves').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    (supabase as any).from('post_comments').select('post_id').in('post_id', postIds),
  ])

  const mediaMap = new Map<string, { images: string[]; videoUrl?: string }>()
  ;(mediaRes.data || []).forEach((m: any) => {
    if (!mediaMap.has(m.post_id)) {
      mediaMap.set(m.post_id, { images: [] })
    }
    if (m.media_type === 'video') {
      mediaMap.get(m.post_id)!.videoUrl = m.media_url
    } else {
      mediaMap.get(m.post_id)!.images.push(m.media_url)
    }
  })

  const authorMap = new Map<string, any>()
  ;(authorsRes.data || []).forEach((a: any) => {
    if (a.is_active !== false && a.account_status !== 'suspended') {
      if (a.user_id) authorMap.set(a.user_id, a)
      if (a.id) authorMap.set(a.id, a)
    }
  })

  const myLikedPostIds = new Set((likesRes.data || []).map((l: any) => l.post_id))
  const mySavedPostIds = new Set((savesRes.data || []).map((s: any) => s.post_id))

  const commentCountMap = new Map<string, number>()
  ;(commentsRes.data || []).forEach((c: any) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
  })

  const posts: MobilePostItem[] = []
  const myInterests: string[] = myProfile?.interests || []
  const myValues: string[] = myProfile?.values || []

  for (const post of filteredPosts) {
    const isMe = Boolean(currentUserId && post.user_id === currentUserId)
    const author = authorMap.get(post.user_id) || (isMe ? myProfile : null) || {}

    const authorName =
      `${author.first_name || ''} ${author.last_name || ''}`.trim() ||
      (isMe ? 'You' : 'Community Member')
    const postMedia = mediaMap.get(post.id)
    const isLiked = myLikedPostIds.has(post.id)
    const isSaved = mySavedPostIds.has(post.id)
    const isFollowing = followSet.has(post.user_id)

    // Calculate approximate time ago
    const createdDate = new Date(post.created_at)
    const diffMs = Date.now() - createdDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const timeAgo = diffHours < 1 ? 'Just now' : diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`

    const postCity = post.location_label || author.location_city || 'Local'
    const isSameCity = Boolean(myProfile?.location_city && myProfile.location_city.toLowerCase() === postCity.toLowerCase())

    // Calculate Interest & Value Affinity
    const postTags: string[] = post.interest_tags || []
    const authorInterests: string[] = author.interests || []
    const sharedInterestsCount = myInterests.filter(i => 
      postTags.map(t => t.toLowerCase()).includes(i.toLowerCase()) || 
      authorInterests.map(ai => ai.toLowerCase()).includes(i.toLowerCase())
    ).length

    const authorValues: string[] = author.values || []
    const sharedValuesCount = myValues.filter(v =>
      authorValues.map(av => av.toLowerCase()).includes(v.toLowerCase())
    ).length

    // Multidimensional score for For You stream
    const score =
      (isMe ? 100 : 0) +
      (isSameCity ? 40 : 0) +
      (isFollowing ? 25 : 0) +
      (sharedInterestsCount * 15) +
      (sharedValuesCount * 10)

    // Filter Nearby stream strictly by local proximity (or author's own posts)
    if (stream === 'Nearby' && !isSameCity && !isMe) {
      continue
    }

    posts.push({
      id: post.id,
      authorId: post.user_id,
      authorName,
      authorAvatar: author.profile_image_url || null,
      isVerified: Boolean(author.is_verified),
      location: postCity,
      topic: (post.interest_tags && post.interest_tags[0]) || 'General',
      timeAgo,
      text: post.content || '',
      images: postMedia?.images || [],
      videoUrl: postMedia?.videoUrl,
      likesCount: (post.likes_count || 0) + (isLiked ? 1 : 0),
      commentsCount: commentCountMap.get(post.id) || 0,
      isLiked,
      isSaved,
      isFollowing: isMe ? true : isFollowing,
      score,
    })
  }

  // Sort For You / Nearby by calculated score
  if (stream === 'For You' || stream === 'Nearby') {
    posts.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  const start = (page - 1) * pageSize
  const paginated = posts.slice(start, start + pageSize)
  const hasMore = start + pageSize < posts.length

  return { posts: paginated, hasMore }
}

/**
 * Create a new post with text and media
 */
export async function createNewPost(params: {
  content: string
  mediaUrls?: string[]
  contentType?: 'text' | 'image' | 'video'
  audience?: 'public' | 'followers' | 'connections' | 'community' | 'only_me'
  communityId?: string
  interestTags?: string[]
  locationLabel?: string
}): Promise<{ id: string }> {
  const {
    content,
    mediaUrls = [],
    contentType = 'text',
    audience = 'public',
    communityId,
    interestTags = [],
    locationLabel,
  } = params

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) {
    throw new Error('User must be authenticated to create a post.')
  }

  const { data: post, error } = await (supabase as any)
    .from('posts')
    .insert({
      user_id: auth.user.id,
      content,
      content_type: contentType,
      visibility: audience,
      community_id: communityId || null,
      interest_tags: interestTags,
      location_label: locationLabel || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) throw error

  if (mediaUrls.length > 0 && post?.id) {
    const mediaPayload = mediaUrls.map((url, index) => ({
      post_id: post.id,
      media_url: url,
      media_type: contentType === 'video' ? 'video' : 'image',
      sort_order: index,
    }))
    await (supabase as any).from('post_media').insert(mediaPayload)
  }

  return { id: post.id }
}

/**
 * Toggle post like
 */
export async function togglePostLike(postId: string, isCurrentlyLiked: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to like posts.')

  if (isCurrentlyLiked) {
    await (supabase as any)
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', auth.user.id)
    return false
  } else {
    await (supabase as any)
      .from('post_likes')
      .upsert({ post_id: postId, user_id: auth.user.id })
    recordFeedInteraction({ interactionType: 'like', postId })
    return true
  }
}

/**
 * Toggle post save
 */
export async function togglePostSave(postId: string, isCurrentlySaved: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to save posts.')

  if (isCurrentlySaved) {
    await Promise.all([
      (supabase as any).from('post_saves').delete().eq('post_id', postId).eq('user_id', auth.user.id),
      (supabase as any).from('saved_posts').delete().eq('post_id', postId).eq('user_id', auth.user.id),
    ])
    return false
  } else {
    await Promise.all([
      (supabase as any).from('post_saves').upsert({ post_id: postId, user_id: auth.user.id }),
      (supabase as any).from('saved_posts').upsert({ post_id: postId, user_id: auth.user.id }),
    ])
    recordFeedInteraction({ interactionType: 'save', postId })
    return true
  }
}

/**
 * Load comments for a post
 */
export async function loadPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await (supabase as any)
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at, profiles(first_name, last_name, profile_image_url, is_verified)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return []

  return (data || []).map((row: any) => {
    const author = row.profiles || {}
    const createdDate = new Date(row.created_at)
    const diffHours = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60))
    const timeAgo = diffHours < 1 ? 'Just now' : `${diffHours}h ago`

    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      authorName: `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Member',
      authorAvatar: author.profile_image_url || null,
      isVerified: Boolean(author.is_verified),
      text: row.content || '',
      timeAgo,
      likesCount: 0,
    }
  })
}

/**
 * Add comment to a post
 */
export async function addPostComment(postId: string, text: string): Promise<PostComment> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to leave a comment.')

  const { data, error } = await (supabase as any)
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: auth.user.id,
      content: text.trim(),
    })
    .select('id, post_id, user_id, content, created_at, profiles(first_name, last_name, profile_image_url, is_verified)')
    .single()

  if (error) throw error

  recordFeedInteraction({ interactionType: 'comment', postId })

  const author = data?.profiles || {}
  return {
    id: data.id,
    postId: data.post_id,
    userId: data.user_id,
    authorName: `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'You',
    authorAvatar: author.profile_image_url || null,
    isVerified: Boolean(author.is_verified),
    text: data.content,
    timeAgo: 'Just now',
    likesCount: 0,
  }
}

/**
 * Dismiss post
 */
export async function dismissPost(
  postId: string,
  actionType: 'hide' | 'not_interested' | 'see_fewer' | 'see_more'
) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return

  await (supabase as any).from('content_dismissals').upsert({
    user_id: auth.user.id,
    content_id: postId,
    action_type: actionType,
  })
}
