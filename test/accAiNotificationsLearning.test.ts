import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('ACC AI-7 notifications and learning', () => {
  it('ranks notifications deterministically without an LLM', () => {
    const sql = source('supabase/migrations/20260823000400_acc_ai7_notifications_learning.sql')
    expect(sql).toContain('public.notification_priority')
    expect(sql).toContain("THEN 100")
    expect(sql).toContain("THEN 95")
    expect(sql).toContain('"llm_per_notification": false')
    expect(sql).not.toMatch(/gemini/i)
  })

  it('respects notification preferences, quiet hours, and fatigue limits', () => {
    const sql = source('supabase/migrations/20260823000400_acc_ai7_notifications_learning.sql')
    expect(sql).toContain('get_prioritized_notifications')
    expect(sql).toContain('daily_notification_limit')
    expect(sql).toContain('low_priority_daily_limit')
    expect(sql).toContain('is_quiet')
    expect(sql).toContain('has_high_priority')
  })

  it('learns only from structured recommendation events with time decay', () => {
    const sql = source('supabase/migrations/20260823000400_acc_ai7_notifications_learning.sql')
    expect(sql).toContain('refresh_user_recommendation_learning')
    expect(sql).toContain('recommendation_item_metadata')
    expect(sql).toContain("exp(-EXTRACT(EPOCH FROM (now() - event.created_at)) / 2592000.0)")
    expect(sql).toContain("source = 'learned'")
    expect(sql).not.toMatch(/conversation_messages|community_messages|initial_message/)
  })

  it('keeps learning and metrics refresh server-controlled and rate limited', () => {
    const sql = source('supabase/migrations/20260823000400_acc_ai7_notifications_learning.sql')
    expect(sql).toContain('refresh_my_recommendation_learning')
    expect(sql).toContain("'learning_refresh', 2, 60")
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.refresh_user_recommendation_learning(UUID) FROM authenticated')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.refresh_recommendation_metrics(DATE) TO service_role')
  })

  it('connects the mobile notification inbox and buffered learning loop', () => {
    const screen = source('app/notifications.tsx')
    const service = source('services/notifications.ts')
    const buffer = source('services/recommendationEventBuffer.ts')
    expect(service).toContain("rpc('get_prioritized_notifications'")
    expect(screen).toContain('loadPrioritizedNotifications')
    expect(screen).toContain("surface: 'notifications'")
    expect(buffer).toContain("rpc('refresh_my_recommendation_learning')")
    expect(buffer).toContain('LEARNING_REFRESH_INTERVAL_MS')
  })
})
