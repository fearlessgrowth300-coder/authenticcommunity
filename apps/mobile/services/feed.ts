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
    | 'not_interested'
    | 'see_more'
    | 'see_fewer'
    | 'mute'
    | 'hidden'
    | 'reported'
  postId?: string
  storyId?: string
  metadata?: Record<string, any>
}) {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    await (supabase as any).from('feed_interactions').insert({
      user_id: auth.user.id,
      post_id: params.postId || null,
      story_id: params.storyId || null,
      interaction_type: params.interactionType,
      metadata: params.metadata || {},
    })
  } catch {
    // Telemetry errors should never block UI
  }
}

/**
 * Fetch real posts from Supabase for the active feed stream.
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
        .select('location_city, location_state, location_country')
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
          .select('user_id, first_name, last_name, profile_image_url, location_city, location_country, is_verified, is_active, account_status')
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
      authorMap.set(a.user_id, a)
    }
  })

  const myLikedPostIds = new Set((likesRes.data || []).map((l: any) => l.post_id))
  const mySavedPostIds = new Set((savesRes.data || []).map((s: any) => s.post_id))

  const commentCountMap = new Map<string, number>()
  ;(commentsRes.data || []).forEach((c: any) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
  })

  const posts: MobilePostItem[] = []

  for (const post of filteredPosts) {
    const author = authorMap.get(post.user_id)
    if (!author) continue

    const authorName = `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Member'
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

    // Score for geographic ordering
    const score = (isSameCity ? 50 : 0) + (isFollowing ? 30 : 0)

    // Filter Nearby stream strictly by local proximity
    if (stream === 'Nearby' && !isSameCity) {
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
      isFollowing,
      score,
    })
  }

  // Sort For You / Nearby by score
  if (stream === 'For You' || stream === 'Nearby') {
    posts.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  const start = (page - 1) * pageSize
  const paginated = posts.slice(start, start + pageSize)
  const hasMore = start + pageSize < posts.length

  return { posts: paginated, hasMore }
}

/**
 * Create a new post in Supabase with post_media
 */
export async function createNewPost(params: {
  content: string
  audience: 'public' | 'followers' | 'connections' | 'community' | 'only_me'
  locationLabel?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  interestTags?: string[]
}): Promise<{ id: string; error: Error | null }> {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('You must be signed in to create a post.')

    const { data: postData, error: postError } = await (supabase as any)
      .from('posts')
      .insert({
        user_id: auth.user.id,
        content: params.content.trim(),
        visibility: params.audience,
        location_label: params.locationLabel || null,
        interest_tags: params.interestTags || [],
        content_type: params.mediaType || 'text',
        status: 'active',
      })
      .select('id')
      .single()

    if (postError) throw postError

    if (params.mediaUrl && postData?.id) {
      const { error: mediaError } = await (supabase as any)
        .from('post_media')
        .insert({
          post_id: postData.id,
          media_url: params.mediaUrl,
          media_type: params.mediaType || 'image',
          sort_order: 0,
        })
      if (mediaError) throw mediaError
    }

    return { id: postData.id, error: null }
  } catch (err: any) {
    return { id: '', error: err instanceof Error ? err : new Error(err?.message || 'Failed to create post.') }
  }
}

/**
 * Toggle post like in post_likes table
 */
export async function togglePostLike(postId: string, isCurrentlyLiked: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to like posts.')

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
 * Toggle post save in post_saves table
 */
export async function togglePostSave(postId: string, isCurrentlySaved: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to save posts.')

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
 * Load comments for a post from post_comments table
 */
export async function loadPostComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await (supabase as any)
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const userIds = Array.from(new Set(data.map((c: any) => c.user_id))) as string[]
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('user_id, first_name, last_name, profile_image_url, is_verified')
    .in('user_id', userIds)

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.user_id, p]))

  return data.map((c: any) => {
    const p = profileMap.get(c.user_id)
    const authorName = `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Member'
    const createdDate = new Date(c.created_at)
    const diffMs = Date.now() - createdDate.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const timeAgo = diffMins < 60 ? `${Math.max(1, diffMins)}m ago` : `${Math.floor(diffMins / 60)}h ago`

    return {
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      authorName,
      authorAvatar: p?.profile_image_url || null,
      isVerified: Boolean(p?.is_verified),
      text: c.content,
      timeAgo,
      likesCount: 0,
    }
  })
}

/**
 * Add a comment to post_comments
 */
export async function addPostComment(postId: string, text: string): Promise<PostComment> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to leave a comment.')

  const { data: commentData, error } = await (supabase as any)
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: auth.user.id,
      content: text.trim(),
    })
    .select('id, post_id, user_id, content, created_at')
    .single()

  if (error) throw error

  const { data: p } = await (supabase as any)
    .from('profiles')
    .select('first_name, last_name, profile_image_url, is_verified')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  recordFeedInteraction({ interactionType: 'comment', postId })

  return {
    id: commentData.id,
    postId: commentData.post_id,
    userId: auth.user.id,
    authorName: `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'You',
    authorAvatar: p?.profile_image_url || null,
    isVerified: Boolean(p?.is_verified),
    text: commentData.content,
    timeAgo: 'Just now',
    likesCount: 0,
  }
}

/**
 * Dismiss / hide a post from showing in feed
 */
export async function dismissPost(postId: string, actionType: 'hide' | 'not_interested' | 'see_fewer' | 'see_more') {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return

  await (supabase as any).from('content_dismissals').upsert(
    {
      user_id: auth.user.id,
      content_id: postId,
      content_type: 'post',
    },
    { onConflict: 'user_id,content_type,content_id' }
  )

  recordFeedInteraction({
    interactionType: actionType === 'not_interested' ? 'not_interested' : 'hidden',
    postId,
  })
}
