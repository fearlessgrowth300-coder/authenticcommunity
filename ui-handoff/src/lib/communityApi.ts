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

export async function createCommunity(params: {
  name: string
  description?: string
  category?: string
  location?: string
  privacy?: string
  imageUrl?: string
}): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to create a community.')

  const { data, error } = await (supabase as any)
    .from('communities')
    .insert({
      creator_id: auth.user.id,
      community_name: params.name.trim(),
      description: params.description?.trim() || null,
      category: params.category || 'Outdoors',
      location_city: params.location?.trim() || 'Local area',
      community_type: params.privacy === 'Private' ? 'private' : params.privacy === 'Approval required' ? 'approval_required' : 'public',
      profile_image_url: params.imageUrl || fallbackImage,
      member_count: 1,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) throw error

  // Add creator as admin member
  await (supabase as any)
    .from('community_members')
    .insert({
      community_id: data.id,
      user_id: auth.user.id,
      role: 'admin',
      status: 'active',
    })

  return data.id
}

export type EventRecord = {
  id: string
  title: string
  host: string
  hostId?: string
  date: string
  time: string
  distance: string
  attendees: number
  category: string
  description: string
  image: string
  isRsvpd?: boolean
}

const fallbackEventImage = 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1100&q=85'

export async function loadEvents(params?: { category?: string; query?: string }): Promise<EventRecord[]> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  let query = (supabase as any)
    .from('events')
    .select(`
      id, name, description, event_date, start_time, end_time,
      location, category, event_image_url, attendee_count, max_attendees, organizer_id,
      organizer:profiles!events_organizer_id_fkey(first_name, last_name, profile_image_url)
    `)
    .eq('is_active', true)
    .order('event_date', { ascending: true })

  if (params?.category && params.category !== 'All' && params.category !== 'For You') {
    query = query.eq('category', params.category)
  }

  const { data, error } = await query
  if (error) throw error

  let myRsvps = new Set<string>()
  if (userId) {
    const { data: rsvps } = await (supabase as any)
      .from('event_attendees')
      .select('event_id')
      .eq('user_id', userId)
    if (rsvps) {
      myRsvps = new Set(rsvps.map((r: any) => r.event_id))
    }
  }

  const list: EventRecord[] = (data ?? []).map((row: any) => {
    const org = row.organizer
    const hostName = org ? `${org.first_name || ''} ${org.last_name || ''}`.trim() : 'Community Host'
    const dateFormatted = row.event_date
      ? new Date(row.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Upcoming'
    const timeFormatted = row.start_time ? String(row.start_time).slice(0, 5) : '7:00 PM'

    return {
      id: row.id,
      title: row.name || 'Community Event',
      host: hostName || 'Community Host',
      hostId: row.organizer_id,
      date: dateFormatted,
      time: timeFormatted,
      distance: row.location || 'Local area',
      attendees: row.attendee_count ?? 1,
      category: row.category ?? 'Wellness',
      description: row.description ?? 'A welcoming community gathering.',
      image: row.event_image_url || fallbackEventImage,
      isRsvpd: myRsvps.has(row.id),
    }
  })

  if (params?.query && params.query.trim()) {
    const q = params.query.toLowerCase()
    return list.filter(e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.host.toLowerCase().includes(q))
  }

  return list
}

export async function loadEventDetail(id: string): Promise<EventRecord | null> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id

  const { data, error } = await (supabase as any)
    .from('events')
    .select(`
      id, name, description, event_date, start_time, end_time,
      location, category, event_image_url, attendee_count, max_attendees, organizer_id,
      organizer:profiles!events_organizer_id_fkey(first_name, last_name, profile_image_url)
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  let isRsvpd = false
  if (userId) {
    const { data: rsvp } = await (supabase as any)
      .from('event_attendees')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (rsvp) isRsvpd = true
  }

  const org = data.organizer
  const hostName = org ? `${org.first_name || ''} ${org.last_name || ''}`.trim() : 'Community Host'
  const dateFormatted = data.event_date
    ? new Date(data.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Upcoming'
  const timeFormatted = data.start_time ? String(data.start_time).slice(0, 5) : '7:00 PM'

  return {
    id: data.id,
    title: data.name || 'Community Event',
    host: hostName || 'Community Host',
    hostId: data.organizer_id,
    date: dateFormatted,
    time: timeFormatted,
    distance: data.location || 'Local area',
    attendees: data.attendee_count ?? 1,
    category: data.category ?? 'Wellness',
    description: data.description ?? 'A welcoming community gathering.',
    image: data.event_image_url || fallbackEventImage,
    isRsvpd,
  }
}

export async function rsvpToEvent(eventId: string, currentRsvpState: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to RSVP to events.')

  if (currentRsvpState) {
    // Cancel RSVP
    await (supabase as any)
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', auth.user.id)

    // Decrement attendee count
    const { data: evt } = await (supabase as any).from('events').select('attendee_count').eq('id', eventId).maybeSingle()
    if (evt && evt.attendee_count > 0) {
      await (supabase as any).from('events').update({ attendee_count: evt.attendee_count - 1 }).eq('id', eventId)
    }
    return false
  } else {
    // Insert RSVP
    await (supabase as any)
      .from('event_attendees')
      .upsert({
        event_id: eventId,
        user_id: auth.user.id,
        rsvp_status: 'going',
      }, { onConflict: 'event_id,user_id' })

    // Increment attendee count
    const { data: evt } = await (supabase as any).from('events').select('attendee_count').eq('id', eventId).maybeSingle()
    await (supabase as any).from('events').update({ attendee_count: (evt?.attendee_count ?? 0) + 1 }).eq('id', eventId)
    return true
  }
}

export async function createEvent(params: {
  title: string
  description?: string
  date: string
  time: string
  location: string
  category: string
  maxAttendees?: number
  imageUrl?: string
}): Promise<string> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Sign in to create an event.')

  const { data, error } = await (supabase as any)
    .from('events')
    .insert({
      organizer_id: auth.user.id,
      name: params.title.trim(),
      description: params.description?.trim() || null,
      event_date: params.date || new Date().toISOString().split('T')[0],
      start_time: params.time || '18:00',
      location: params.location || 'Local area',
      category: params.category || 'Wellness',
      max_attendees: params.maxAttendees || 50,
      attendee_count: 1,
      event_image_url: params.imageUrl || fallbackEventImage,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) throw error

  // Automatically RSVP the organizer
  await (supabase as any).from('event_attendees').upsert({
    event_id: data.id,
    user_id: auth.user.id,
    rsvp_status: 'going',
  }, { onConflict: 'event_id,user_id' })

  return data.id
}

export async function loadActiveStories(): Promise<Array<{
  id: string
  userId: string
  authorName: string
  authorAvatar: string | null
  authorVerified: boolean
  imageUrl: string
  caption: string
  timeAgo: string
}>> {
  const { data, error } = await (supabase as any)
    .from('stories')
    .select(`
      id, user_id, media_url, caption, created_at,
      author:profiles!stories_user_id_fkey(first_name, last_name, profile_image_url, is_verified)
    `)
    .eq('is_deleted', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) return []

  return data.map((row: any) => {
    const author = row.author
    const authorName = author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Community Member'
    return {
      id: row.id,
      userId: row.user_id,
      authorName: authorName || 'Community Member',
      authorAvatar: author?.profile_image_url || null,
      authorVerified: Boolean(author?.is_verified),
      imageUrl: row.media_url,
      caption: row.caption || '',
      timeAgo: 'Recently',
    }
  })
}

export async function loadVideoPosts(): Promise<Array<{
  id: string
  author: string
  avatar: string
  community: string
  text: string
  videoUrl?: string
  image: string
  likes: number
  comments: number
  verified: boolean
}>> {
  const { data, error } = await (supabase as any)
    .from('post_media')
    .select(`
      id, media_url, media_type, thumbnail_url,
      post:posts!post_media_post_id_fkey(
        id, content, like_count, comment_count, created_at,
        author:profiles!posts_user_id_fkey(first_name, last_name, profile_image_url, is_verified),
        community:communities!posts_community_id_fkey(community_name)
      )
    `)
    .eq('media_type', 'video')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) return []

  return data.map((row: any) => {
    const p = row.post
    const author = p?.author
    const authorName = author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : 'Community Member'
    return {
      id: p?.id || row.id,
      author: authorName || 'Community Member',
      avatar: author?.profile_image_url || fallbackImage,
      community: p?.community?.community_name || 'Community Hub',
      text: p?.content || 'Authentic community video',
      videoUrl: row.media_url,
      image: row.thumbnail_url || row.media_url || fallbackImage,
      likes: p?.like_count || 0,
      comments: p?.comment_count || 0,
      verified: Boolean(author?.is_verified),
    }
  })
}

export function subscribeToCommunityMessages(communityId: string, refresh: () => void) {
  const channel = supabase.channel(`community-chat-${communityId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'community_messages', filter: `community_id=eq.${communityId}` }, refresh)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

