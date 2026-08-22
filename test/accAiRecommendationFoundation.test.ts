import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AI_CONFIG, loadAiConfig } from '../supabase/functions/_shared/ai/config'
import { sanitizePublicAiInput, sanitizeSafeMetadata } from '../supabase/functions/_shared/ai/sanitizer'
import { parseContentEnrichment } from '../supabase/functions/_shared/ai/schemas'
import { explainReasonCodes } from '../supabase/functions/_shared/recommendation/reasonCodes'
import { timeDecay } from '../supabase/functions/_shared/recommendation/signals'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI recommendation foundation', () => {
  it('centralizes the requested Gemini configuration without exposing a key', () => {
    expect(AI_CONFIG.generativeModel).toBe('gemini-3.5-flash-lite')
    expect(AI_CONFIG.embeddingModel).toBe('gemini-embedding-2')
    expect(AI_CONFIG.embeddingDimension).toBe(768)
    const configured = loadAiConfig((name) => name === 'GEMINI_API_KEY' ? 'server-only' : undefined)
    expect(configured.apiKey).toBe('server-only')
    expect(source('services/supabase.ts')).not.toContain('GEMINI_API_KEY')
  })

  it('rejects private content and strips sensitive fields from public enrichment input', () => {
    expect(() => sanitizePublicAiInput({
      itemType: 'post',
      visibility: 'connections',
      text: 'private',
    })).toThrow(/Only public content/)

    const safe = sanitizePublicAiInput({
      itemType: 'post',
      visibility: 'public',
      text: 'A public Lagos hiking meetup. password=secret',
      city: 'Lagos',
      extra: { latitude: 6.45, longitude: 3.39, tags: ['hiking'], access_token: 'secret' },
    })
    expect(safe).not.toHaveProperty('latitude')
    expect(safe).not.toHaveProperty('longitude')
    expect(safe).not.toHaveProperty('access_token')
    expect(String(safe.text)).toContain('[REDACTED]')
  })

  it('allows only bounded safe recommendation metadata', () => {
    expect(sanitizeSafeMetadata({
      dwell_time_ms: 1200,
      source: 'home',
      private_message: 'never',
      latitude: 6.45,
    })).toEqual({ dwell_time_ms: 1200, source: 'home' })
  })

  it('validates structured content intelligence and sensitive-inference boundaries', () => {
    const parsed = parseContentEnrichment({
      topics: [{ topic: 'Entrepreneurship', confidence: 0.93 }],
      language: 'en',
      location_scope: 'local',
      content_type: 'educational',
      quality_hints: { informational: 0.8, conversation_potential: 0.7 },
      safety_flags: [],
    })
    expect(parsed.topics[0]).toEqual({ topic: 'entrepreneurship', confidence: 0.93 })
    expect(() => parseContentEnrichment({
      ...parsed,
      safety_flags: ['secret_sensitive_profile'],
    })).toThrow(/Invalid safety flag/)
  })

  it('uses stable time decay and human-readable reason codes', () => {
    expect(timeDecay(0)).toBe(1)
    expect(timeDecay(45)).toBeCloseTo(0.5, 6)
    expect(explainReasonCodes(['nearby', 'explicit_interest'])).toEqual([
      'It is near your general area',
      'It matches an interest you selected',
    ])
  })

  it('creates server-managed vector, event, affinity, usage and metrics structures', () => {
    const sql = source('supabase/migrations/20260822000100_acc_ai0_recommendation_foundation.sql')
    expect(sql).toContain('CREATE EXTENSION IF NOT EXISTS vector')
    expect(sql).toContain('extensions.vector(768)')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.recommendation_events')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.recommendation_item_metadata')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_topic_affinities')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_recommendation_profiles')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.ai_enrichment_jobs')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.ai_usage_daily')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.recommendation_metrics_daily')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.log_recommendation_events')
    expect(sql).toContain('current_user_id UUID := auth.uid()')
    expect(sql).not.toMatch(/CREATE POLICY[^;]+recommendation_events[^;]+FOR INSERT/is)
  })

  it('buffers mobile recommendation events through the authenticated RPC', () => {
    const buffer = source('services/recommendationEventBuffer.ts')
    expect(buffer).toContain("rpc('log_recommendation_events'")
    expect(buffer).not.toContain('user_id:')
    expect(buffer).toContain('MAX_BUFFER_SIZE = 100')
    expect(source('services/feed.ts')).not.toContain("from('feed_interactions').insert")
  })
})

