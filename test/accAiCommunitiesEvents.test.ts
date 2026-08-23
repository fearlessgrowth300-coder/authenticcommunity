import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { rankCommunity } from '../supabase/functions/_shared/recommendation/rankers/communities'
import { rankEvent } from '../supabase/functions/_shared/recommendation/rankers/events'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI-5 Communities and Events', () => {
  it('uses geography strongly for local communities but not online communities', () => {
    const base = { id: 'c', interestRelevance: 0.5, connectionOverlap: 0, topicValueFit: 0.5, communityActivity: 0.5, quality: 0.5, exploration: 0 }
    const local = rankCommunity({ ...base, mode: 'local', geographicRelevance: 1 })
    const distant = rankCommunity({ ...base, mode: 'local', geographicRelevance: 0 })
    const online = rankCommunity({ ...base, mode: 'online', geographicRelevance: 0 })
    expect(local.score - distant.score).toBeCloseTo(0.25)
    expect(online.algorithmVersion).toBe('communities_global_v1')
    expect(local.reasonCodes).toContain('nearby')
  })

  it('makes practical event geography and time worth half the score', () => {
    const event = rankEvent({ id: 'e', distanceGeography: 1, dateTimeSuitability: 1, interestMatch: 0, socialAttendance: 0, communityRelevance: 0, eventQuality: 0, freshnessTrending: 0 })
    expect(event.score).toBe(0.5)
    expect(event.reasonCodes).toContain('nearby')
    expect(event.reasonCodes).toContain('fresh_content')
  })

  it('stores explicit modes, indexes, weights and bounded semantic assistance', () => {
    const migration = source('supabase/migrations/20260823000200_acc_ai5_communities_events.sql')
    expect(migration).toContain("delivery_mode IN ('local', 'online', 'hybrid')")
    expect(migration).toContain("attendance_mode IN ('in_person', 'online', 'hybrid')")
    expect(migration).toContain('idx_events_recommendation_candidates')
    expect(migration).toContain('"distance_geography": 0.30')
    expect(migration).toContain('"semantic_share_of_interest_signal_max": 0.20')
  })

  it('filters community bans and event time, status, privacy, capacity and distance before ranking', () => {
    const communities = source('supabase/functions/recommend-communities/index.ts')
    const events = source('supabase/functions/recommend-events/index.ts')
    expect(communities).toContain('membershipStatus.get(community.id) !== "banned"')
    expect(events).toContain('.gte("event_date", today)')
    expect(events).toContain('.neq("status", "cancelled")')
    expect(events).toContain('event.max_attendees && goingCount >= event.max_attendees')
    expect(events).toContain('distanceKm > maxDistance')
    expect(events.indexOf('const eligible =')).toBeLessThan(events.indexOf('const ranked ='))
    expect(events).not.toMatch(/return\s+json[^]*latitude\s*:/)
    expect(events).not.toMatch(/return\s+json[^]*longitude\s*:/)
  })

  it('connects Discover and Events to specialized endpoints and outcome telemetry', () => {
    const service = source('services/discover.ts')
    const discover = source('app/(tabs)/discover.tsx')
    const eventDetail = source('app/event/[id].tsx')
    const communityDetail = source('app/community/[id].tsx')
    expect(service).toContain("invoke('recommend-communities'")
    expect(service).toContain("invoke('recommend-events'")
    expect(discover).toContain("event_type: 'community_view'")
    expect(discover).toContain("event_type: 'event_view'")
    expect(eventDetail).toContain("event_type: 'event_rsvp'")
    expect(communityDetail).toContain("event_type: 'community_join'")
  })
})
