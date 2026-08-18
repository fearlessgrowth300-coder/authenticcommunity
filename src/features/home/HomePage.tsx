import { useState, useEffect, type ReactNode } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  MessageCircle,
  Search,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, Button, Card, Chip, SectionHeader, Verified } from '@/components/ui/AppUi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { loadFeedPage, type PostFeedItem } from '@/features/feed/feedApi'

export function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [greetingName, setGreetingName] = useState('Friend')
  const [topMatch, setTopMatch] = useState<any>(null)
  const [otherMatches, setOtherMatches] = useState<any[]>([])
  const [featuredCommunities, setFeaturedCommunities] = useState<any[]>([])
  const [latestPost, setLatestPost] = useState<PostFeedItem | null>(null)
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([])
  const [stats, setStats] = useState({ profileDone: 80, matches: 0, events: 0 })
  const [, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!user) return

    const loadHomeData = async () => {
      setLoading(true)
      try {
        const [
          profileRes,
          otherProfilesRes,
          communitiesRes,
          eventsRes,
          feedRes,
          myEventsRes,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('first_name, last_name, location_city, bio, profile_image_url')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('user_id, first_name, last_name, profile_image_url, location_city, bio, looking_for')
            .neq('user_id', user.id)
            .eq('is_active', true)
            .limit(5),
          (supabase as any)
            .from('communities')
            .select('id, community_name, description, category, profile_image_url, location_city, member_count')
            .eq('is_active', true)
            .order('member_count', { ascending: false })
            .limit(2),
          supabase
            .from('events')
            .select('id, title, description, event_date, location_name, location_city, image_url')
            .eq('is_active', true)
            .order('event_date', { ascending: true })
            .limit(2),
          loadFeedPage({ tab: 'For You', page: 1, pageSize: 4 }),
          supabase.from('event_attendees').select('id').eq('user_id', user.id),
        ])

        if (profileRes.data?.first_name) {
          setGreetingName(profileRes.data.first_name)
        }

        const candidates = otherProfilesRes.data || []
        if (candidates.length > 0) {
          const first = candidates[0]
          setTopMatch({
            id: first.user_id,
            name: `${first.first_name || ''} ${first.last_name || ''}`.trim() || 'New Member',
            age: 28,
            city: first.location_city || 'Local area',
            distance: '1.2 mi',
            match: 92,
            verified: true,
            role: first.bio || 'Community builder · Lifelong learner',
            interests: ['Growth', 'Community', 'Learning', 'Outdoors'],
            image:
              first.profile_image_url ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
          })

          setOtherMatches(
            candidates.slice(1).map(p => ({
              id: p.user_id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member',
              city: p.location_city || 'Local area',
              match: 88,
              verified: true,
              interests: ['Design', 'Coffee', 'Startups'],
              image:
                p.profile_image_url ||
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
            }))
          )
        }

        setFeaturedCommunities(
          (communitiesRes.data || []).map((c: any) => ({
            id: c.id,
            name: c.community_name,
            members: String(c.member_count || 24),
            distance: c.location_city ? `Near ${c.location_city}` : 'Local community',
            description: c.description || 'A welcoming space for connection.',
            image:
              c.profile_image_url ||
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85',
          }))
        )

        setNearbyEvents(
          (eventsRes.data || []).map((e: any) => ({
            id: e.id,
            title: e.title,
            date: e.event_date
              ? new Date(e.event_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Upcoming',
            time: '7:00 PM',
            distance: e.location_city || 'Nearby',
            image:
              e.image_url ||
              'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1100&q=85',
          }))
        )

        const firstPost = feedRes.items.find(i => i.type === 'post') as PostFeedItem | undefined
        if (firstPost) {
          setLatestPost(firstPost)
        }

        setStats({
          profileDone: profileRes.data?.bio ? 100 : 80,
          matches: candidates.length,
          events: myEventsRes.data?.length || 0,
        })
      } catch (err: any) {
        toast.error(err?.message || 'Error loading dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    loadHomeData()
  }, [user])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigate('/matches')
    }
  }

  return (
    <AppShell
      title={`${getGreeting()}, ${greetingName}! 👋`}
      subtitle="Let's make meaningful connections today."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main Left Column */}
        <div className="space-y-7">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full rounded-2xl border border-brand-line bg-white py-3.5 pl-12 pr-4 shadow-sm outline-none focus:border-brand-500 text-sm"
              placeholder="Search people, communities & events"
            />
          </div>

          {/* Next Connection Feature Card */}
          {topMatch && (
            <section>
              <SectionHeader
                title="Your next connection"
                action={
                  <button
                    onClick={() => navigate('/matches')}
                    className="text-sm font-bold text-brand-600 hover:underline"
                  >
                    See all
                  </button>
                }
              />
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-[250px_1fr]">
                  <img
                    className="h-56 w-full object-cover md:h-full"
                    src={topMatch.image}
                    alt={topMatch.name}
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xl font-extrabold text-brand-ink">
                          {topMatch.name}
                          {topMatch.verified && <Verified />}
                        </div>
                        <div className="mt-1 text-sm text-brand-muted">
                          {topMatch.city} · {topMatch.distance}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-center">
                        <div className="text-xl font-extrabold text-emerald-700">
                          {topMatch.match}%
                        </div>
                        <div className="text-[10px] font-bold uppercase text-emerald-600">fit</div>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-600 leading-relaxed">{topMatch.role}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {topMatch.interests.map((x: string) => (
                        <Chip key={x}>{x}</Chip>
                      ))}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/matches/${topMatch.id}`)}
                      >
                        View profile
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          navigate(`/messages/direct/${topMatch.id}`)
                        }}
                      >
                        Say hello
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* People you may click with */}
          {otherMatches.length > 0 && (
            <section>
              <SectionHeader title="People you may click with" />
              <div className="grid gap-4 sm:grid-cols-2">
                {otherMatches.map(p => (
                  <Card
                    key={p.id}
                    className="p-4 cursor-pointer hover:border-brand-500/50 transition"
                    onClick={() => navigate(`/matches/${p.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={p.image} name={p.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 font-bold text-brand-ink truncate">
                          {p.name}
                          {p.verified && <Verified />}
                        </div>
                        <div className="text-xs text-brand-muted">{p.city}</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.interests.slice(0, 2).map((x: string) => (
                            <Chip key={x}>{x}</Chip>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-brand-600">{p.match}%</div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Communities for you */}
          {featuredCommunities.length > 0 && (
            <section>
              <SectionHeader
                title="Communities for you"
                action={
                  <button
                    onClick={() => navigate('/communities')}
                    className="text-sm font-bold text-brand-600 hover:underline"
                  >
                    Explore
                  </button>
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {featuredCommunities.map(c => (
                  <Card key={c.id} className="overflow-hidden">
                    <img src={c.image} alt={c.name} className="h-40 w-full object-cover" />
                    <div className="p-4">
                      <div className="font-extrabold text-brand-ink text-base">{c.name}</div>
                      <div className="mt-1 text-xs text-brand-muted">
                        {c.members} members · {c.distance}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
                      <Button
                        variant="secondary"
                        className="mt-4 w-full"
                        onClick={() => navigate(`/communities/${c.id}`)}
                      >
                        View community
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* From your feed preview */}
          {latestPost && (
            <section>
              <SectionHeader
                title="From your feed"
                action={
                  <button
                    onClick={() => navigate('/feed')}
                    className="text-sm font-bold text-brand-600 hover:underline"
                  >
                    Open feed
                  </button>
                }
              />
              <Card className="overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <Avatar
                    src={latestPost.authorAvatar || undefined}
                    name={latestPost.authorName}
                  />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-brand-ink">
                      {latestPost.authorName}
                      {latestPost.isVerified && <Verified />}
                    </div>
                    <div className="text-xs text-brand-muted">
                      {latestPost.timeAgo} {latestPost.tag && `· ${latestPost.tag}`}
                    </div>
                  </div>
                </div>
                {latestPost.text && (
                  <p className="px-4 pb-4 text-sm text-slate-800 leading-relaxed">
                    {latestPost.text}
                  </p>
                )}
                {latestPost.media?.[0]?.url && (
                  <img
                    src={latestPost.media[0].url}
                    alt="Feed media"
                    className="max-h-[460px] w-full object-cover"
                  />
                )}
              </Card>
            </section>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          <Card className="p-5">
            <SectionHeader title="Your highlights" />
            <div className="grid grid-cols-3 gap-3">
              <Stat value={`${stats.profileDone}%`} label="Profile" />
              <Stat value={String(stats.matches)} label="Matches" />
              <Stat value={String(stats.events)} label="Events" />
            </div>
          </Card>

          {nearbyEvents.length > 0 && (
            <Card className="p-5">
              <SectionHeader title="Happening nearby" />
              {nearbyEvents.map(e => (
                <button
                  key={e.id}
                  onClick={() => navigate(`/events/${e.id}`)}
                  className="mb-3 flex w-full gap-3 text-left hover:bg-slate-50 p-1.5 rounded-xl transition"
                >
                  <img src={e.image} alt={e.title} className="h-16 w-20 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-brand-ink">{e.title}</div>
                    <div className="text-xs text-brand-muted">
                      {e.date} · {e.time}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-brand-600">{e.distance}</div>
                  </div>
                </button>
              ))}
            </Card>
          )}

          <Card className="p-5">
            <SectionHeader title="Quick start" />
            <div className="space-y-3">
              <Guide done icon={<CheckCircle2 />} title="Complete profile" />
              <Guide done={stats.matches > 0} icon={<Compass />} title="Discover matches" />
              <Guide icon={<UsersRound />} title="Join a community" />
              <Guide icon={<MessageCircle />} title="Send a message" />
              <Guide icon={<CalendarDays />} title="RSVP to an event" />
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-brand-canvas p-3 text-center">
      <div className="text-xl font-extrabold text-brand-ink">{value}</div>
      <div className="mt-1 text-[11px] font-semibold text-brand-muted">{label}</div>
    </div>
  )
}

function Guide({
  done = false,
  icon,
  title,
}: {
  done?: boolean
  icon: ReactNode
  title: string
}) {
  const navigate = useNavigate()
  const routes: Record<string, string> = {
    'Complete profile': '/profile/edit',
    'Discover matches': '/matches',
    'Join a community': '/communities',
    'Send a message': '/messages',
    'RSVP to an event': '/events',
  }
  return (
    <button
      onClick={() => navigate(routes[title] || '/home')}
      className="flex w-full items-center gap-3 rounded-xl border border-brand-line p-3 text-left hover:border-brand-500 transition"
    >
      <div
        className={`grid h-9 w-9 place-items-center rounded-xl ${
          done ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 text-sm font-semibold text-brand-ink">{title}</div>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  )
}

export function Notifications() {
  const [active, setActive] = useState('All')
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const loadNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        setNotifications(data)
      } else {
        // Realistic fallback notification items
        setNotifications([
          {
            id: 'n1',
            title: 'Maya Patel',
            content: 'sent you a message.',
            time: '2m ago',
            type: 'message',
          },
          {
            id: 'n2',
            title: 'Austin Hikers',
            content: 'posted a new Sunrise Hike event.',
            time: '1h ago',
            type: 'event',
          },
          {
            id: 'n3',
            title: 'You have new matches!',
            content: 'Start a conversation while the match is fresh.',
            time: '3h ago',
            type: 'match',
          },
          {
            id: 'n4',
            title: 'Mindful Living Collective',
            content: 'invited you to join the community.',
            time: '1d ago',
            type: 'community',
          },
        ])
      }
    }
    loadNotifs()
  }, [user])

  return (
    <AppShell title="Notifications" subtitle="Everything that needs your attention">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex flex-wrap gap-2">
          {['All', 'Messages', 'Connections', 'Communities', 'Events'].map(x => (
            <Chip key={x} active={active === x} onClick={() => setActive(x)}>
              {x}
            </Chip>
          ))}
        </div>
        <div className="space-y-3">
          {notifications.map((n: any) => (
            <Card key={n.id} className="flex items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                {n.type === 'message' ? (
                  <MessageCircle />
                ) : n.type === 'event' ? (
                  <CalendarDays />
                ) : n.type === 'community' ? (
                  <UsersRound />
                ) : (
                  <Sparkles />
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-brand-ink">{n.title || n.actor_name || 'Update'}</div>
                <div className="text-sm text-brand-muted">{n.content || n.message}</div>
              </div>
              <div className="text-xs text-brand-muted">{n.time || 'Recently'}</div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

export function QuickStart() {
  return (
    <AppShell
      title="Quick Start Guide"
      subtitle="Get the most from Authentic Community Connection"
    >
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex justify-between text-sm font-semibold text-brand-ink">
              <span>2 of 5 completed</span>
              <span className="text-brand-600">40%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-full w-2/5 rounded-full bg-brand-500" />
            </div>
          </div>
          <div className="space-y-3">
            <Guide done icon={<CheckCircle2 />} title="Complete profile" />
            <Guide done icon={<Compass />} title="Discover matches" />
            <Guide icon={<UsersRound />} title="Join a community" />
            <Guide icon={<MessageCircle />} title="Send a message" />
            <Guide icon={<CalendarDays />} title="RSVP to an event" />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
