import { supabase } from './supabase'

export type UserPreferences = {
  messagesFrom: 'everyone' | 'followers' | 'connections' | 'nobody'
  locationVisibility: 'city' | 'distance' | 'hidden'
  showOnlineStatus: boolean
  readReceipts: boolean
  discoveryArea: 'nearby' | 'country' | 'worldwide'
  feedBalance: 'local_first' | 'balanced' | 'global_heavy'
  personalizationEnabled: boolean
  explorationEnabled: boolean
  recommendationResetAt: string | null
  learnedInterests: Array<{ id: string; name: string; strength: 'High' | 'Medium' | 'Low' }>
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  messagesFrom: 'connections',
  locationVisibility: 'city',
  showOnlineStatus: true,
  readReceipts: true,
  discoveryArea: 'nearby',
  feedBalance: 'balanced',
  personalizationEnabled: true,
  explorationEnabled: true,
  recommendationResetAt: null,
  learnedInterests: [],
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return DEFAULT_USER_PREFERENCES

  const { data, error } = await (supabase as any)
    .from('user_preferences')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error || !data) return DEFAULT_USER_PREFERENCES

  return {
    messagesFrom: data.messages_from || DEFAULT_USER_PREFERENCES.messagesFrom,
    locationVisibility: data.location_visibility || DEFAULT_USER_PREFERENCES.locationVisibility,
    showOnlineStatus: data.show_online_status ?? true,
    readReceipts: data.read_receipts ?? true,
    discoveryArea: data.discovery_area || DEFAULT_USER_PREFERENCES.discoveryArea,
    feedBalance: data.feed_balance === 'local' ? 'local_first' : data.feed_balance === 'global' ? 'global_heavy' : data.feed_balance || DEFAULT_USER_PREFERENCES.feedBalance,
    personalizationEnabled: data.personalization_enabled ?? true,
    explorationEnabled: data.exploration_enabled ?? true,
    recommendationResetAt: data.recommendation_reset_at || null,
    learnedInterests: Array.isArray(data.learned_interests) ? data.learned_interests : [],
  }
}

export async function saveUserPreferences(preferences: Partial<UserPreferences>) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to update settings.')

  const payload: Record<string, unknown> = {
    user_id: auth.user.id,
    updated_at: new Date().toISOString(),
  }
  if (preferences.messagesFrom) payload.messages_from = preferences.messagesFrom
  if (preferences.locationVisibility) payload.location_visibility = preferences.locationVisibility
  if (preferences.showOnlineStatus !== undefined) payload.show_online_status = preferences.showOnlineStatus
  if (preferences.readReceipts !== undefined) payload.read_receipts = preferences.readReceipts
  if (preferences.discoveryArea) payload.discovery_area = preferences.discoveryArea
  if (preferences.feedBalance) payload.feed_balance = preferences.feedBalance
  if (preferences.personalizationEnabled !== undefined) payload.personalization_enabled = preferences.personalizationEnabled
  if (preferences.explorationEnabled !== undefined) payload.exploration_enabled = preferences.explorationEnabled
  if (preferences.learnedInterests) payload.learned_interests = preferences.learnedInterests

  const { error } = await (supabase as any)
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function resetMyRecommendations() {
  const { data, error } = await (supabase as any).rpc('reset_my_recommendations')
  if (error) throw error
  return data as string
}

export async function loadNotificationPreferences() {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await (supabase as any)
    .from('notification_settings')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  return data || null
}

export async function saveNotificationPreference(field: string, value: boolean) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to update notifications.')
  const { error } = await (supabase as any)
    .from('notification_settings')
    .upsert({ user_id: auth.user.id, [field]: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}
