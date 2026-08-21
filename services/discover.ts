import { supabase } from './supabase'
import { calculateMatchScore } from './matching'
import { MatchProfile } from '@/components/matches/MatchCard'
import { CommunityItem } from '@/components/communities/CommunityCard'
import { EventItem } from '@/components/events/EventCard'

export interface DiscoverVideoItem {
  id: string
  title: string
  authorName: string
  views: string
  thumbnail: string
  videoUrl?: string
}

function haversineKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null) {
  if ([lat1, lon1, lat2, lon2].some((value) => typeof value !== 'number')) return null
  const toRadians = (value: number) => (value * Math.PI) / 180
  const radius = 6371
  const dLat = toRadians((lat2 as number) - (lat1 as number))
  const dLon = toRadians((lon2 as number) - (lon1 as number))
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1 as number)) * Math.cos(toRadians(lat2 as number)) * Math.sin(dLon / 2) ** 2
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

/**
 * Fetch real match candidates from Supabase profiles, calculating match scores and filtering blocked/connected users.
 */
export async function fetchDiscoverMatches(currentUserId: string): Promise<MatchProfile[]> {
  try {
    const [
      myProfileRes,
      myInterestsRes,
      myValuesRes,
      myCommunitiesRes,
      profilesRes,
      interestsRes,
      valuesRes,
      blockedRes,
      connectionsRes,
    ] = await Promise.all([
      (supabase as any).from('profiles').select('location_city, latitude, longitude, looking_for').eq('user_id', currentUserId).maybeSingle(),
      supabase.from('user_interests').select('interest_name').eq('user_id', currentUserId),
      supabase.from('user_values').select('value_name').eq('user_id', currentUserId),
      supabase.from('community_members').select('community_id').eq('user_id', currentUserId),
      (supabase as any)
        .from('profiles')
        .select('user_id, first_name, last_name, profile_image_url, location_city, location_country, latitude, longitude, bio, looking_for, is_verified, is_active, age, created_at')
        .neq('user_id', currentUserId)
        .eq('is_active', true)
        .limit(30),
      supabase.from('user_interests').select('user_id, interest_name'),
      supabase.from('user_values').select('user_id, value_name'),
      supabase.from('blocked_users').select('blocked_id, blocker_id').or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
      supabase.from('connections').select('user_id_1, user_id_2').or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
    ])

    const blockedSet = new Set<string>()
    ;(blockedRes.data || []).forEach((b: any) => {
      blockedSet.add(b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id)
    })

    const connectedSet = new Set<string>()
    ;(connectionsRes.data || []).forEach((c: any) => {
      connectedSet.add(c.user_id_1 === currentUserId ? c.user_id_2 : c.user_id_1)
    })

    const myInterests = (myInterestsRes.data || []).map((r) => r.interest_name)
    const myValues = (myValuesRes.data || []).map((r) => r.value_name)
    const myCity = myProfileRes.data?.location_city

    const interestMap = new Map<string, string[]>()
    ;(interestsRes.data || []).forEach((r: any) => {
      if (!interestMap.has(r.user_id)) interestMap.set(r.user_id, [])
      interestMap.get(r.user_id)!.push(r.interest_name)
    })

    const valueMap = new Map<string, string[]>()
    ;(valuesRes.data || []).forEach((r: any) => {
      if (!valueMap.has(r.user_id)) valueMap.set(r.user_id, [])
      valueMap.get(r.user_id)!.push(r.value_name)
    })

    const list: MatchProfile[] = (profilesRes.data || [])
      .filter((p: any) => !blockedSet.has(p.user_id) && !connectedSet.has(p.user_id))
      .map((p: any) => {
        const theirInterests = interestMap.get(p.user_id) || []
        const theirValues = valueMap.get(p.user_id) || []

        const scored = calculateMatchScore({
          candidateId: p.user_id,
          candidateCity: p.location_city,
          candidateInterests: theirInterests,
          candidateValues: theirValues,
          candidateGoal: p.looking_for,
          candidateTrust: p.is_verified ? 5 : 2,
          myCity,
          myInterests,
          myValues,
          myGoal: myProfileRes.data?.looking_for,
        })

        const sharedInterests = theirInterests.filter((i) =>
          myInterests.some((m) => m.toLowerCase() === i.toLowerCase())
        )
        const sharedValues = theirValues.filter((v) =>
          myValues.some((m) => m.toLowerCase() === v.toLowerCase())
        )
        const distanceKm = haversineKm(
          myProfileRes.data?.latitude,
          myProfileRes.data?.longitude,
          p.latitude,
          p.longitude
        )

        return {
          id: p.user_id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Community Member',
          age: p.age || 26,
          isVerified: Boolean(p.is_verified),
          location: p.location_city || 'Local area',
          distance: distanceKm !== null
            ? `${distanceKm} km away`
            : p.location_city && myCity && p.location_city.toLowerCase() === myCity.toLowerCase()
              ? 'In your city'
              : 'In your region',
          distanceKm,
          country: p.location_country || null,
          createdAt: p.created_at,
          matchScore: scored.overall,
          photoUrl: p.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80',
          sharedInterests: sharedInterests.length > 0 ? sharedInterests : theirInterests.slice(0, 3),
          sharedValues: sharedValues.length > 0 ? sharedValues : theirValues.slice(0, 2),
          bio: p.bio || 'Authentic community member passionate about building real connections.',
        }
      })

    return list.sort((a, b) => b.matchScore - a.matchScore)
  } catch (err) {
    return []
  }
}

/**
 * Fetch real communities from Supabase
 */
export async function fetchDiscoverCommunities(): Promise<CommunityItem[]> {
  try {
    const { data } = await supabase
      .from('communities')
      .select('id, community_name, description, profile_image_url, member_count, category, location_city')
      .order('member_count', { ascending: false })
      .limit(20)

    if (!data) return []

    return data.map((c: any) => ({
      id: c.id,
      name: c.community_name,
      distance: c.location_city ? `${c.location_city}` : 'Local',
      membersCount: c.member_count || 1,
      category: c.category || 'General',
      description: c.description || 'A welcoming local community space.',
      imageUrl: c.profile_image_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
    }))
  } catch {
    return []
  }
}

/**
 * Fetch real events from Supabase
 */
export async function fetchDiscoverEvents(): Promise<EventItem[]> {
  try {
    const { data } = await supabase
      .from('events')
      .select('id, name, description, event_date, start_time, location, event_image_url, attendee_count, communities(community_name)')
      .order('event_date', { ascending: true })
      .limit(20)

    if (!data) return []

    return data.map((e: any) => {
      const d = e.event_date ? new Date(e.event_date) : new Date()
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

      return {
        id: e.id,
        title: e.name,
        host: e.communities?.community_name || 'Authentic Community',
        dateMonth: months[d.getMonth()],
        dateDay: String(d.getDate()),
        dateDayOfWeek: days[d.getDay()],
        dateTimeFormatted: `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`,
        eventDate: e.event_date,
        distance: e.location || 'Local Event',
        location: e.location || 'Local Event',
        imageUrl: e.event_image_url || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&fit=crop&q=80',
        attendeesCount: e.attendee_count || 0,
      }
    })
  } catch {
    return []
  }
}

/**
 * Fetch real video posts from Supabase
 */
export async function fetchDiscoverVideos(): Promise<DiscoverVideoItem[]> {
  try {
    const { data: postsData } = await (supabase as any)
      .from('posts')
      .select('id, user_id, content, created_at')
      .eq('content_type', 'video')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!postsData) return []
    const userIds = Array.from(new Set(postsData.map((post: any) => post.user_id))) as string[]
    const postIds = postsData.map((post: any) => post.id)
    const [profilesRes, mediaRes] = await Promise.all([
      supabase.from('profiles').select('user_id, first_name, last_name, profile_image_url').in('user_id', userIds),
      (supabase as any).from('post_media').select('post_id, media_url').in('post_id', postIds),
    ])
    const profileMap = new Map((profilesRes.data || []).map((profile: any) => [profile.user_id, profile]))
    const mediaMap = new Map((mediaRes.data || []).map((media: any) => [media.post_id, media.media_url]))

    return postsData.map((p: any) => ({
      id: p.id,
      title: p.content || 'Community video highlight',
      authorName: `${(profileMap.get(p.user_id) as any)?.first_name || ''} ${(profileMap.get(p.user_id) as any)?.last_name || ''}`.trim() || 'Member',
      views: 'New',
      thumbnail: mediaMap.get(p.id) || (profileMap.get(p.user_id) as any)?.profile_image_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
    }))
  } catch {
    return []
  }
}
