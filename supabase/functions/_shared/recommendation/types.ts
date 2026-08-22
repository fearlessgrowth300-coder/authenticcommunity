export type RecommendationSurface =
  | 'for_you'
  | 'following'
  | 'nearby'
  | 'stories'
  | 'videos'
  | 'people'
  | 'communities'
  | 'events'
  | 'search'
  | 'notifications'

export type RecommendationItemType =
  | 'post'
  | 'video'
  | 'story'
  | 'profile'
  | 'community'
  | 'event'
  | 'search_result'
  | 'notification'

export type RecommendationReasonCode =
  | 'explicit_interest'
  | 'learned_interest'
  | 'shared_value'
  | 'relationship_strength'
  | 'following'
  | 'shared_community'
  | 'nearby'
  | 'local_event'
  | 'friends_attending'
  | 'fresh_content'
  | 'quality_content'
  | 'discovery'

export type RankedRecommendation<T> = {
  item: T
  score: number
  rank: number
  algorithmVersion: string
  reasonCodes: RecommendationReasonCode[]
}

