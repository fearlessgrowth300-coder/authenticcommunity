import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI-6 Search', () => {
  it('creates service-only rate limits and vector retrieval with 768 dimensions', () => {
    const migration = source('supabase/migrations/20260823000300_acc_ai6_search.sql')
    expect(migration).toContain('public.ai_action_rate_limits')
    expect(migration).toContain('consume_ai_action_quota')
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.consume_ai_action_quota(UUID, TEXT, INTEGER, INTEGER) FROM authenticated')
    expect(migration).toContain('extensions.vector(768)')
    expect(migration).toContain('search_recommendation_metadata')
    expect(migration).toContain('"text_relevance": 0.45')
  })

  it('parses simple people/nearby and event/weekend intent without requiring Gemini', () => {
    const fn = source('supabase/functions/search-recommendations/index.ts')
    expect(fn).toContain('/\\b(people|person|member|friend|founder|creator)\\b/')
    expect(fn).toContain('/\\b(event|meetup|workshop|class|conference|today|weekend)\\b/')
    expect(fn).toContain('provider && parsed.ambiguous')
    expect(fn).toContain('validateIntent(result.value, intent)')
  })

  it('uses true hybrid candidates and falls back when Gemini or embeddings fail', () => {
    const fn = source('supabase/functions/search-recommendations/index.ts')
    expect(fn).toContain('search_recommendation_metadata')
    expect(fn).toContain('semanticIds("profile")')
    expect(fn).toContain('const merge =')
    expect(fn).toContain('search intent fallback')
    expect(fn).toContain('search embedding fallback')
    expect(fn).toContain('GEMINI_API_KEY must be configured in Supabase Edge Function Secrets.')
    expect(fn).not.toMatch(/messages[^\n]+content/)
  })

  it('searches all required categories with privacy and safety filters', () => {
    const fn = source('supabase/functions/search-recommendations/index.ts')
    for (const category of ['people', 'posts', 'communities', 'events', 'videos', 'topics']) expect(fn).toContain(`"${category}"`)
    expect(fn).toContain('!blocked.has(row.user_id)')
    expect(fn).toContain('.eq("show_in_search", true)')
    expect(fn).toContain('.eq("visibility", "public")')
    expect(fn).toContain('.gte("event_date", today)')
  })

  it('connects mobile global search to the server while retaining direct-query fallback', () => {
    const screen = source('app/search.tsx')
    const service = source('services/search.ts')
    expect(service).toContain("invoke('search-recommendations'")
    expect(screen).toContain('const ranked = await searchRecommendations')
    expect(screen).toContain("surface: 'search'")
    expect(screen).toMatch(/supabase\s*\.from\('profiles'\)/)
    expect(screen).toContain("'Videos', 'Topics'")
  })
})
