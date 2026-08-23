import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rankStory } from '../supabase/functions/_shared/recommendation/rankers/stories'
import { rankVideo } from '../supabase/functions/_shared/recommendation/rankers/videos'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI-3 Stories and Videos', () => {
  it('ranks an unseen close-relationship story above a viewed weak-relationship story', () => {
    const close = rankStory({
      id: 'close', createdAt: new Date().toISOString(), relationshipStrength: 1,
      recentInteraction: 0.9, storyEngagementHistory: 0.6, contentRelevance: 0.8,
      communityRelationship: 1, viewed: false,
    })
    const viewed = rankStory({
      id: 'viewed', createdAt: new Date().toISOString(), relationshipStrength: 0.1,
      recentInteraction: 0, storyEngagementHistory: 0.4, contentRelevance: 0.2,
      communityRelationship: 0, viewed: true,
    })
    expect(close.score).toBeGreaterThan(viewed.score)
    expect(close.reasonCodes).toContain('relationship_strength')
  })

  it('does not let watch time dominate video outcomes and relevance', () => {
    const meaningful = rankVideo({
      id: 'meaningful', topicRelevance: 1, watchQuality: 0.5, savesAndShares: 1,
      socialRelevance: 1, creatorQuality: 0.8, communityRelevance: 1,
      locationRelevance: 0.5, exploration: 0,
    })
    const addictiveOnly = rankVideo({
      id: 'watch-only', topicRelevance: 0, watchQuality: 1, savesAndShares: 0,
      socialRelevance: 0, creatorQuality: 0.2, communityRelevance: 0,
      locationRelevance: 0, exploration: 0,
    })
    expect(meaningful.score).toBeGreaterThan(addictiveOnly.score)
  })

  it('records inspectable algorithm weights and hides vectors behind an authenticated RPC', () => {
    const migration = source('supabase/migrations/20260822000400_acc_ai3_stories_videos.sql')
    expect(migration).toContain('get_semantic_recommendation_scores')
    expect(migration).toContain("auth.uid()")
    expect(migration).toContain("'stories_v1'")
    expect(migration).toContain("'video_v1'")
    expect(migration).toContain('viewed_penalty_multiplier')
    expect(migration).not.toContain('SELECT metadata.embedding,')
  })

  it('uses separate server rankers and never selects private message text', () => {
    const stories = source('supabase/functions/recommend-stories/index.ts')
    const videos = source('supabase/functions/recommend-videos/index.ts')
    expect(stories).toContain('rankStory')
    expect(videos).toContain('rankVideo')
    expect(videos).toContain('get_semantic_recommendation_scores')
    expect(stories).toContain('sender_id, recipient_id, created_at')
    expect(stories).not.toMatch(/messages[^\n]+content/)
    expect(videos).not.toContain('GEMINI_API_KEY')
  })

  it('wires mobile Stories and Videos to server ranking and buffered feedback', () => {
    const storiesService = source('services/stories.ts')
    const discoverService = source('services/discover.ts')
    const storyViewer = source('app/story/[id].tsx')
    const videoViewer = source('app/video/[id].tsx')
    expect(storiesService).toContain("invoke('recommend-stories'")
    expect(discoverService).toContain("invoke('recommend-videos'")
    expect(storyViewer).toContain('recordStoryCompletion')
    expect(videoViewer).toContain("event_type: 'video_watch'")
    expect(videoViewer).toContain("event_type: 'video_complete'")
    expect(videoViewer).not.toMatch(/safe_metadata:\s*\{[^}]*content/)
  })
})
