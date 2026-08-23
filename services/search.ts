import { supabase } from './supabase'

export type SearchCategory = 'people' | 'posts' | 'communities' | 'events' | 'videos' | 'topics'

export type SearchRecommendationResponse = {
  algorithmVersion: string
  intent: { entityTypes: SearchCategory[]; topics: string[]; locationScope: string; timeScope: string }
  people: any[]
  posts: any[]
  communities: any[]
  events: any[]
  videos: any[]
  topics: any[]
}

export async function searchRecommendations(query: string, types?: SearchCategory[]): Promise<SearchRecommendationResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke('search-recommendations', {
      body: { query: query.trim(), types, limit: 12 },
    })
    if (error || !data?.results) return null
    return {
      algorithmVersion: data.algorithm_version || 'search_v1',
      intent: data.intent || { entityTypes: [], topics: [], locationScope: 'global', timeScope: 'any' },
      people: Array.isArray(data.results.people) ? data.results.people : [],
      posts: Array.isArray(data.results.posts) ? data.results.posts : [],
      communities: Array.isArray(data.results.communities) ? data.results.communities : [],
      events: Array.isArray(data.results.events) ? data.results.events : [],
      videos: Array.isArray(data.results.videos) ? data.results.videos : [],
      topics: Array.isArray(data.results.topics) ? data.results.topics : [],
    }
  } catch {
    return null
  }
}
