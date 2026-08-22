import { supabase } from './supabase'

export type RecommendationSurface =
  | 'for_you' | 'following' | 'nearby' | 'stories' | 'videos'
  | 'people' | 'communities' | 'events' | 'search' | 'notifications'

export type RecommendationItemType =
  | 'post' | 'video' | 'story' | 'profile' | 'community' | 'event'
  | 'search_result' | 'notification'

export type RecommendationEventType =
  | 'recommendation_impression' | 'recommendation_open'
  | 'post_open' | 'post_like' | 'post_comment' | 'post_save' | 'post_share'
  | 'story_view' | 'story_complete' | 'story_reply'
  | 'video_start' | 'video_watch' | 'video_complete' | 'video_replay'
  | 'profile_view' | 'follow' | 'unfollow' | 'connection_request'
  | 'connection_accept' | 'connection_remove'
  | 'community_view' | 'community_join' | 'community_leave' | 'community_post'
  | 'event_view' | 'event_save' | 'event_rsvp' | 'event_attend'
  | 'not_interested' | 'see_more' | 'see_fewer' | 'mute' | 'hide' | 'block' | 'report'

export type RecommendationEvent = {
  session_id?: string
  surface: RecommendationSurface
  event_type: RecommendationEventType
  item_type: RecommendationItemType
  item_id?: string
  algorithm_version: string
  rank_position?: number
  reason_codes?: string[]
  safe_metadata?: Record<string, string | number | boolean>
}

const ALLOWED_METADATA = new Set([
  'dwell_time_ms', 'watch_time_ms', 'watch_percent', 'is_complete',
  'source', 'query_category', 'network_type', 'result_count',
])

const DEFAULT_BATCH_SIZE = 20
const DEFAULT_FLUSH_INTERVAL_MS = 10_000
const MAX_BUFFER_SIZE = 100

function createSessionId() {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function sanitizeMetadata(metadata: RecommendationEvent['safe_metadata']) {
  const safe: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(metadata || {})) {
    if (!ALLOWED_METADATA.has(key)) continue
    if (typeof value === 'string') safe[key] = value.slice(0, 120)
    if (typeof value === 'number' && Number.isFinite(value)) safe[key] = value
    if (typeof value === 'boolean') safe[key] = value
  }
  return safe
}

export class RecommendationEventBuffer {
  private readonly events: RecommendationEvent[] = []
  private readonly sessionId = createSessionId()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private flushing = false

  constructor(
    private readonly batchSize = DEFAULT_BATCH_SIZE,
    private readonly flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS,
  ) {}

  enqueue(event: RecommendationEvent) {
    if (!event.algorithm_version || event.algorithm_version.length > 80) return
    this.events.push({
      ...event,
      session_id: this.sessionId,
      rank_position: event.rank_position && event.rank_position > 0
        ? Math.min(Math.round(event.rank_position), 1000)
        : undefined,
      reason_codes: [...new Set(event.reason_codes || [])].slice(0, 12).map((code) => code.slice(0, 80)),
      safe_metadata: sanitizeMetadata(event.safe_metadata),
    })
    if (this.events.length > MAX_BUFFER_SIZE) this.events.splice(0, this.events.length - MAX_BUFFER_SIZE)
    if (this.events.length >= this.batchSize) void this.flush()
    else this.scheduleFlush()
  }

  async flush(): Promise<boolean> {
    if (this.flushing || this.events.length === 0) return false
    this.flushing = true
    this.clearTimer()
    const batch = this.events.splice(0, Math.min(this.events.length, 50))
    try {
      const { error } = await (supabase as any).rpc('log_recommendation_events', { p_events: batch })
      if (error) {
        this.events.unshift(...batch)
        if (this.events.length > MAX_BUFFER_SIZE) this.events.length = MAX_BUFFER_SIZE
        this.scheduleFlush()
        return false
      }
      if (this.events.length > 0) this.scheduleFlush()
      return true
    } catch {
      this.events.unshift(...batch)
      if (this.events.length > MAX_BUFFER_SIZE) this.events.length = MAX_BUFFER_SIZE
      this.scheduleFlush()
      return false
    } finally {
      this.flushing = false
    }
  }

  dispose() {
    this.clearTimer()
    void this.flush()
  }

  get size() {
    return this.events.length
  }

  private scheduleFlush() {
    if (this.flushTimer) return
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      void this.flush()
    }, this.flushIntervalMs)
  }

  private clearTimer() {
    if (!this.flushTimer) return
    clearTimeout(this.flushTimer)
    this.flushTimer = null
  }
}

export const recommendationEventBuffer = new RecommendationEventBuffer()
