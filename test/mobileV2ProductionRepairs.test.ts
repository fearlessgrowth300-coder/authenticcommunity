import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('Mobile V2 production repair contracts', () => {
  it('creates the canonical live preference, notification, save, and request contract', () => {
    const sql = source('supabase/migrations/20260821000600_mobile_v2_canonical_contract.sql')

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.user_preferences')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.notification_settings')
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.event_saves')
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.accept_message_request')
    expect(sql).toContain('CREATE POLICY "Approved participants send messages"')
    expect(sql).toContain('CREATE TRIGGER trg_message_request_rate_limit')
  })

  it('never grants identity verification from the mobile client', () => {
    const verificationScreens = [
      source('app/verification/liveness.tsx'),
      source('app/verification/result.tsx'),
    ].join('\n')

    expect(verificationScreens).not.toMatch(/\.from\(['"]profiles['"]\)[\s\S]{0,200}\.update\([\s\S]{0,100}is_verified/)
    const webhook = source('supabase/functions/identity-verify-webhook/index.ts')
    expect(webhook).toContain('validSignature')
    expect(webhook).toContain('signPayload')
    expect(webhook).toContain('provider_reference')
  })

  it('gates direct messages before inserting and accepts the first message server-side', () => {
    const chat = source('services/realtimeChat.ts')
    const sendFlow = chat.slice(chat.indexOf('export async function sendDirectMessage'))
    const permissionCheck = sendFlow.indexOf('getDirectMessagingPermission')
    const messageInsert = sendFlow.indexOf(".from('messages')")

    expect(permissionCheck).toBeGreaterThan(-1)
    expect(messageInsert).toBeGreaterThan(permissionCheck)
    expect(source('app/(tabs)/messages.tsx')).toContain(".rpc('accept_message_request'")
  })

  it('uses actual native video playback and persistent preference storage', () => {
    expect(source('app/video/[id].tsx')).toContain("from 'expo-video'")
    expect(source('app/video/[id].tsx')).toContain('<VideoView')
    expect(source('services/preferences.ts')).toContain("from('user_preferences')")
    expect(source('services/preferences.ts')).toContain("from('notification_settings')")
  })

  it('uses the canonical database columns in application sources', () => {
    const appSources = [
      source('services/feed.ts'),
      source('services/discover.ts'),
      source('app/event/create.tsx'),
      source('app/event/[id].tsx'),
      source('app/(tabs)/profile.tsx'),
    ].join('\n')

    expect(appSources).not.toMatch(/event_title|location_name|cover_image_url|\bauthor_id\b|\bmedia_urls\b|\baction_type\b/)
    expect(appSources).toContain('event_attendees')
    expect(appSources).toContain('post_media')
    expect(appSources).toContain('user_interests')
    expect(appSources).toContain('user_values')
  })
})
