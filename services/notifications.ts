import { supabase } from './supabase'

export type PrioritizedNotification = {
  id: string
  type: string
  title: string
  message?: string | null
  is_read: boolean
  data?: Record<string, unknown> | null
  created_at: string
  priority_score: number
  algorithm_version: string
}

export async function loadPrioritizedNotifications(limit = 100): Promise<PrioritizedNotification[] | null> {
  const { data, error } = await (supabase as any).rpc('get_prioritized_notifications', {
    p_limit: Math.min(Math.max(Math.round(limit), 1), 200),
  })
  if (error) return null
  return Array.isArray(data) ? data : []
}
