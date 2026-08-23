import type { RecommendationSurface } from './types.ts'

export const ALGORITHM_VERSIONS: Readonly<Record<RecommendationSurface, string>> = Object.freeze({
  for_you: 'feed_foryou_v1',
  following: 'feed_following_v1',
  nearby: 'feed_nearby_v1',
  stories: 'stories_v1',
  videos: 'video_v1',
  people: 'people_v1',
  communities: 'communities_local_v1',
  events: 'events_v1',
  search: 'search_v1',
  notifications: 'notifications_v1',
})

export const GLOBAL_COMMUNITIES_ALGORITHM_VERSION = 'communities_global_v1'

