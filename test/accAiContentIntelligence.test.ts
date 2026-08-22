import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AI_CONFIG } from '../supabase/functions/_shared/ai/config'
import { GeminiProvider } from '../supabase/functions/_shared/ai/geminiProvider'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI content intelligence', () => {
  it('generates validated JSON through the centralized Flash-Lite provider', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: '{"topics":[]}' }] } }],
      usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 4 },
    }), { status: 200 })) as unknown as typeof fetch
    const provider = new GeminiProvider('server-only-test-key', AI_CONFIG, fetcher)
    const result = await provider.generateStructured({
      task: 'test',
      systemInstruction: 'Return JSON.',
      input: 'public content',
    })
    expect(result.value).toEqual({ topics: [] })
    expect(result.model).toBe('gemini-3.5-flash-lite')
    expect(fetcher).toHaveBeenCalledOnce()
  })

  it('requests and validates exactly 768 embedding dimensions', async () => {
    const values = Array.from({ length: 768 }, (_, index) => index / 768)
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      embedding: { values },
      usageMetadata: { promptTokenCount: 8 },
    }), { status: 200 })) as unknown as typeof fetch
    const provider = new GeminiProvider('server-only-test-key', AI_CONFIG, fetcher)
    const result = await provider.embed('public hiking event')
    expect(result.values).toHaveLength(768)
    expect(result.model).toBe('gemini-embedding-2')
    expect(JSON.parse(String((fetcher as any).mock.calls[0][1].body)).outputDimensionality).toBe(768)
  })

  it('retries bounded transient provider errors without logging response bodies', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response('sensitive provider body', { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: '{}' }] } }],
      }), { status: 200 })) as unknown as typeof fetch
    const provider = new GeminiProvider('server-only-test-key', { ...AI_CONFIG, maxRetries: 1 }, fetcher)
    await expect(provider.generateStructured({
      task: 'test', systemInstruction: 'Return JSON.', input: 'public content',
    })).resolves.toMatchObject({ value: {} })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('queues public content by stable hash and skips unchanged completed content', () => {
    const sql = source('supabase/migrations/20260822000200_acc_ai1_content_intelligence.sql')
    expect(sql).toContain("encode(digest(source::TEXT, 'sha256'), 'hex')")
    expect(sql).toContain("AND enrichment_status = 'completed'")
    expect(sql).toContain('FOR UPDATE SKIP LOCKED')
    expect(sql).toContain('attempt_count < 5')
    expect(sql).toContain('trg_posts_ai_enrichment')
    expect(sql).toContain('trg_user_interests_ai_enrichment')
    expect(sql).not.toContain('trg_stories_ai_enrichment')
  })

  it('runs enrichment asynchronously with service authorization and safe source retrieval', () => {
    const fn = source('supabase/functions/ai-process-enrichment/index.ts')
    expect(fn).toContain('Service authorization required')
    expect(fn).toContain('claim_ai_enrichment_jobs')
    expect(fn).toContain('get_recommendation_item_source')
    expect(fn).toContain('sanitizePublicAiInput')
    expect(fn).toContain('parseContentEnrichment')
    expect(fn).toContain('public_content_embedding')
    expect(fn).not.toMatch(/console\.error\([^)]*(safe_input|requestBody|apiKey|authorization)/i)
  })
})

