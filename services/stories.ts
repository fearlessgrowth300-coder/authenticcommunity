import { supabase } from './supabase'
import { recommendationEventBuffer } from './recommendationEventBuffer'

export interface MobileStoryItem {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  timeAgo: string
  imageUrl: string
  caption?: string
  hasUnseen: boolean
  isCommunity?: boolean
  contentType?: 'image' | 'video' | 'text'
  rankPosition?: number
  score?: number
  reasonCodes?: string[]
  algorithmVersion?: string
}

/**
 * Fetch active, non-expired stories from Supabase
 */
export async function getActiveStories(): Promise<MobileStoryItem[]> {
  try {
    const { data: auth } = await supabase.auth.getUser()
    const currentUserId = auth?.user?.id || null

    if (currentUserId) {
      const { data, error } = await supabase.functions.invoke('recommend-stories', { body: { limit: 30 } })
      if (!error && data && Array.isArray(data.items)) {
        return data.items.map((item: any) => {
          const createdDate = new Date(item.createdAt)
          const diffHours = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 3_600_000))
          return {
            id: item.id,
            userId: item.userId,
            userName: item.userName,
            userAvatar: item.userAvatar || null,
            timeAgo: diffHours < 1 ? 'Just now' : `${diffHours}h ago`,
            imageUrl: item.contentUrl || '',
            caption: item.caption || undefined,
            hasUnseen: Boolean(item.hasUnseen),
            contentType: item.contentType || 'image',
            rankPosition: Number(item.rankPosition || 0),
            score: Number(item.score || 0),
            reasonCodes: Array.isArray(item.reasonCodes) ? item.reasonCodes : [],
            algorithmVersion: item.algorithmVersion || data.algorithm_version || 'stories_v1',
          }
        })
      }
    }

    const { data: rawStories, error } = await supabase
      .from('stories')
      .select('*')
      .eq('is_deleted', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (error || !rawStories || rawStories.length === 0) {
      return []
    }

    const userIds = Array.from(new Set(rawStories.map((s: any) => s.user_id)))
    const storyIds = rawStories.map((s: any) => s.id)

    const [profilesRes, viewsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, first_name, last_name, profile_image_url')
        .in('user_id', userIds),
      currentUserId
        ? supabase
            .from('story_views')
            .select('story_id')
            .eq('viewer_id', currentUserId)
            .in('story_id', storyIds)
        : Promise.resolve({ data: [] }),
    ])

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.user_id, p]))
    const seenStoryIds = new Set((viewsRes.data || []).map((v: any) => v.story_id))

    return rawStories
      .map((s: any): MobileStoryItem | null => {
        const p = profileMap.get(s.user_id)
        if (!p) return null

        const userName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member'
        const createdDate = new Date(s.created_at)
        const diffHours = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60))
        const timeAgo = diffHours < 1 ? 'Just now' : `${diffHours}h ago`

        return {
          id: s.id,
          userId: s.user_id,
          userName,
          userAvatar: p.profile_image_url || null,
          timeAgo,
          imageUrl: s.content_url || s.media_url || '',
          caption: s.text_content || s.caption || undefined,
          hasUnseen: !seenStoryIds.has(s.id),
        }
      })
      .filter((s): s is MobileStoryItem => s !== null)
  } catch {
    return []
  }
}

/**
 * Create a new story in Supabase
 */
export async function createStory(params: {
  mediaUrl: string
  caption?: string
  interestTags?: string[]
}): Promise<{ id: string; error: Error | null }> {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) throw new Error('Not authenticated')

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: auth.user.id,
        content_type: 'image',
        content_url: params.mediaUrl,
        text_content: params.caption || null,
        interest_tags: params.interestTags || [],
        expires_at: expiresAt,
        is_deleted: false,
      } as any)
      .select('id')
      .single()

    if (error) throw error

    return { id: data.id, error: null }
  } catch (err: any) {
    return { id: '', error: err instanceof Error ? err : new Error(err?.message || 'Failed to create story.') }
  }
}

/**
 * Record a story view in story_views table
 */
export async function recordStoryView(storyId: string) {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    await supabase
      .from('story_views')
      .upsert({ story_id: storyId, viewer_id: auth.user.id } as any, { onConflict: 'story_id,viewer_id' })
    recommendationEventBuffer.enqueue({
      surface: 'stories',
      event_type: 'story_view',
      item_type: 'story',
      item_id: storyId,
      algorithm_version: 'stories_v1',
    })
  } catch {
    // Non-blocking view telemetry
  }
}

export function recordStoryCompletion(storyId: string, watchTimeMs: number) {
  recommendationEventBuffer.enqueue({
    surface: 'stories',
    event_type: 'story_complete',
    item_type: 'story',
    item_id: storyId,
    algorithm_version: 'stories_v1',
    safe_metadata: { watch_time_ms: Math.max(0, Math.round(watchTimeMs)), is_complete: true },
  })
}

/**
 * Like a story in story_likes table
 */
export async function likeStory(storyId: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('story_likes')
    .insert({ story_id: storyId, user_id: auth.user.id } as any)

  if (error && (error as any).code !== '23505') throw error
}

/**
 * Reply to a story
 */
export async function replyToStory(storyId: string, text: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('story_replies')
    .insert({
      story_id: storyId,
      user_id: auth.user.id,
      message: text.trim(),
    } as any)

  if (error) throw error
  recommendationEventBuffer.enqueue({
    surface: 'stories',
    event_type: 'story_reply',
    item_type: 'story',
    item_id: storyId,
    algorithm_version: 'stories_v1',
  })
}
