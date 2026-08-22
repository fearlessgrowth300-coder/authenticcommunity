import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { diversifyRankedItems } from '../supabase/functions/_shared/recommendation/diversity'
import { isFeedCandidateEligible } from '../supabase/functions/_shared/recommendation/eligibility'
import { explorationBoost } from '../supabase/functions/_shared/recommendation/exploration'
import { rankFollowing } from '../supabase/functions/_shared/recommendation/rankers/following'
import { rankForYou } from '../supabase/functions/_shared/recommendation/rankers/forYou'
import { rankNearby } from '../supabase/functions/_shared/recommendation/rankers/nearby'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

const candidate = {
  id: 'post-1',
  authorId: 'author-1',
  createdAt: new Date().toISOString(),
  primaryTopic: 'Entrepreneurship',
  explicitInterestScore: 1,
  learnedInterestScore: 0.4,
  relationshipScore: 0.8,
  communityScore: 1,
  localScore: 1,
  engagementQuality: 0.5,
  contentQuality: 0.7,
  explorationBoost: 0,
}

describe('ACC AI-2 Home algorithms', () => {
  it('uses separate explicit versioned rankers for each Home surface', () => {
    const forYou = rankForYou(candidate)
    const following = rankFollowing(candidate)
    const nearby = rankNearby(candidate)
    expect(forYou.score).toBeGreaterThan(0.7)
    expect(forYou.reasonCodes).toContain('explicit_interest')
    expect(forYou.reasonCodes).toContain('nearby')
    expect(following.reasonCodes).toEqual(['following', 'fresh_content'])
    expect(nearby.score).toBeGreaterThan(0.75)
    expect(source('supabase/functions/_shared/recommendation/versioning.ts')).toContain("feed_foryou_v1")
  })

  it('applies hard eligibility before ranking', () => {
    const base = {
      authorId: 'author-1', status: 'active', visibility: 'public',
      authorActive: true, authorAccountStatus: 'active', communityAllowed: true,
    }
    expect(isFeedCandidateEligible(base, {
      currentUserId: 'me', blockedUserIds: new Set(), dismissedItemIds: new Set(), itemId: 'post-1',
    })).toBe(true)
    expect(isFeedCandidateEligible(base, {
      currentUserId: 'me', blockedUserIds: new Set(['author-1']), dismissedItemIds: new Set(), itemId: 'post-1',
    })).toBe(false)
    expect(isFeedCandidateEligible(base, {
      currentUserId: 'me', blockedUserIds: new Set(), dismissedItemIds: new Set(['post-1']), itemId: 'post-1',
    })).toBe(false)
    expect(isFeedCandidateEligible({ ...base, visibility: 'private' }, {
      currentUserId: 'me', blockedUserIds: new Set(), dismissedItemIds: new Set(), itemId: 'post-1',
    })).toBe(false)
  })

  it('limits repeated authors/topics and uses deterministic bounded exploration', () => {
    const items = [
      { id: '1', authorId: 'a', primaryTopic: 'AI', score: 1 },
      { id: '2', authorId: 'a', primaryTopic: 'AI', score: 0.9 },
      { id: '3', authorId: 'a', primaryTopic: 'AI', score: 0.8 },
      { id: '4', authorId: 'b', primaryTopic: 'Fitness', score: 0.7 },
    ]
    expect(diversifyRankedItems(items, 3, { maxPerAuthor: 2, maxPerTopic: 2 }).map((item) => item.id)).toEqual(['1', '2', '4'])
    expect(explorationBoost('same-seed', true)).toBe(explorationBoost('same-seed', true))
    expect(explorationBoost('same-seed', false)).toBe(0)
  })

  it('authenticates feed users, caps pages, and never returns exact coordinates', () => {
    const fn = source('supabase/functions/recommend-feed/index.ts')
    expect(fn).toContain('userClient.auth.getUser()')
    expect(fn).toContain('Math.min(body.page_size, 20)')
    expect(fn).toContain('isFeedCandidateEligible')
    expect(fn).toContain('typedSurface === "nearby"')
    expect(fn).not.toMatch(/select\([^)]*(latitude|longitude)/)
    expect(fn).not.toMatch(/latitude\s*:/)
    expect(fn).not.toMatch(/longitude\s*:/)
  })

  it('connects mobile Home to the server ranker with safe deterministic fallback', () => {
    const feed = source('services/feed.ts')
    expect(feed).toContain("functions.invoke('recommend-feed'")
    expect(feed).toContain('fetchFeedPostsLegacy(params)')
    expect(feed).toContain('reasonCodes.map(reasonLabel)')
    expect(source('components/feed/WhyAmISeeingThisModal.tsx')).toContain('reasons.slice(0, 4)')
    expect(source('app/(tabs)/index.tsx')).toContain('onViewableItemsChanged')
    expect(source('app/(tabs)/index.tsx')).toContain("event_type: 'recommendation_impression'")
  })

  it('makes negative feedback immediately exclude later candidates', () => {
    const feed = source('services/feed.ts')
    expect(feed).toContain("if (actionType === 'see_more') return")
    expect(feed).toContain("from('content_dismissals').upsert")
    const fn = source('supabase/functions/recommend-feed/index.ts')
    expect(fn).toContain('dismissedItemIds: dismissedIds')
  })
})

