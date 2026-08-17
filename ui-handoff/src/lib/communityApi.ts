import { supabase } from '../../../src/integrations/supabase/client'

export type CommunityRecord = {
  id: string
  name: string
  members: string
  distance: string
  category: string
  description: string
  image: string
  trusted: boolean
  approvalRequired: boolean
}

const fallbackImage = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85'

export async function loadCommunities(): Promise<CommunityRecord[]> {
  const { data, error } = await (supabase as any)
    .from('communities')
    .select('id, community_name, description, category, profile_image_url, location_city, member_count, community_type, approval_required')
    .eq('is_active', true)
    .order('member_count', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.community_name,
    members: String(row.member_count ?? 0),
    distance: row.location_city ? `Near ${row.location_city}` : 'Local community',
    category: row.category ?? 'Community',
    description: row.description ?? 'A welcoming community for meaningful local connection.',
    image: row.profile_image_url || fallbackImage,
    trusted: false,
    approvalRequired: Boolean(row.approval_required || row.community_type === 'approval_required'),
  }))
}

export async function loadCommunity(id: string): Promise<CommunityRecord | null> {
  const { data, error } = await (supabase as any)
    .from('communities')
    .select('id, community_name, description, category, profile_image_url, location_city, member_count, community_type, approval_required')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id, name: data.community_name, members: String(data.member_count ?? 0),
    distance: data.location_city ? `Near ${data.location_city}` : 'Local community',
    category: data.category ?? 'Community', description: data.description ?? '',
    image: data.profile_image_url || fallbackImage, trusted: false,
    approvalRequired: Boolean(data.approval_required || data.community_type === 'approval_required'),
  }
}

export async function joinCommunity(community: CommunityRecord): Promise<'joined' | 'requested'> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to join a community.')
  if (community.approvalRequired) {
    const { error } = await (supabase as any).from('community_join_requests').upsert({ community_id: community.id, user_id: auth.user.id, status: 'pending' }, { onConflict: 'community_id,user_id' })
    if (error) throw error
    return 'requested'
  }
  const { error } = await (supabase as any).from('community_members').upsert({ community_id: community.id, user_id: auth.user.id, role: 'member', status: 'active' }, { onConflict: 'community_id,user_id' })
  if (error) throw error
  return 'joined'
}

export async function loadCommunityMessages(communityId: string, channelId?: string) {
  let query = (supabase as any).from('community_messages').select('*').eq('community_id', communityId).is('deleted_at', null).order('created_at', { ascending: true }).limit(100)
  if (channelId) query = query.eq('channel_id', channelId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function sendCommunityMessage(communityId: string, content: string, channelId?: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to send a message.')
  const { error } = await (supabase as any).from('community_messages').insert({ community_id: communityId, channel_id: channelId ?? null, sender_id: auth.user.id, content, message_type: 'text' })
  if (error) throw error
}

export function subscribeToCommunityMessages(communityId: string, refresh: () => void) {
  const channel = supabase.channel(`community-chat-${communityId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages', filter: `community_id=eq.${communityId}` }, refresh)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
