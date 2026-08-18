import { useState, useEffect, type ReactNode } from 'react'
import {
  Bookmark,
  Check,
  Filter,
  Loader2,
  MapPin,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar, Button, Card, Chip, Verified } from '../components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useMockApp } from '../lib/mockApp'
import { supabase } from '@/integrations/supabase/client'
import {
  getRelationshipState,
  followUser,
  unfollowUser,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineOrCancelConnection,
  removeConnection,
  type FollowStatus,
  type ConnectionStatus,
} from '../lib/socialGraphApi'
import { scoreCandidateMatch } from '../../../src/lib/matching'

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85'

export function Matches() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [candidates, setCandidates] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadCandidates = async () => {
      setLoading(true)
      try {
        const [myProfileRes, myInterestsRes, myValuesRes, profilesRes, interestsRes, valuesRes] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('location_city, latitude, longitude')
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
            supabase.from('user_values').select('value_name').eq('user_id', user.id),
            supabase
              .from('profiles')
              .select('user_id, first_name, last_name, profile_image_url, location_city, bio, looking_for')
              .neq('user_id', user.id)
              .eq('is_active', true)
              .limit(20),
            supabase.from('user_interests').select('user_id, interest_name'),
            supabase.from('user_values').select('user_id, value_name'),
          ])

        const myInterests = (myInterestsRes.data || []).map(r => r.interest_name)
        const myValues = (myValuesRes.data || []).map(r => r.value_name)

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

        const list = (profilesRes.data || []).map((p: any) => {
          const theirInterests = interestMap.get(p.user_id) || ['Community', 'Growth']
          const theirValues = valueMap.get(p.user_id) || ['Kindness', 'Learning']

          const scored = scoreCandidateMatch({
            candidateId: p.user_id,
            candidateCity: p.location_city,
            candidateInterests: theirInterests,
            candidateValues: theirValues,
            myCity: myProfileRes.data?.location_city,
            myInterests,
            myValues,
          })

          return {
            id: p.user_id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Community Member',
            age: 28,
            city: p.location_city || 'Local area',
            distance:
              p.location_city && myProfileRes.data?.location_city === p.location_city
                ? 'Nearby'
                : 'In your region',
            match: scored.score,
            verified: true,
            role: p.bio || 'Authentic community member',
            interests: theirInterests,
            values: theirValues,
            image: p.profile_image_url || fallbackAvatar,
          }
        })

        // Sort by match score
        list.sort((a, b) => b.match - a.match)

        // Seed realistic candidates if DB is currently sparse
        if (list.length === 0) {
          list.push({
            id: 'maya',
            name: 'Maya Patel',
            age: 28,
            city: 'Austin, Texas',
            distance: '1.2 mi',
            match: 94,
            verified: true,
            role: 'Community builder, nature lover and lifelong learner.',
            interests: ['Hiking', 'Books', 'Mindfulness', 'Travel'],
            values: ['Kindness', 'Growth', 'Community', 'Honesty'],
            image:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
          })
        }

        setCandidates(list)
      } catch (err: any) {
        toast(err?.message || 'Error loading discover matches.')
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [user])

  const p = candidates[currentIndex]
  const saved = p ? savedIds.has(p.id) : false

  const handlePass = () => {
    if (currentIndex < candidates.length - 1) {
      setCurrentIndex(c => c + 1)
    } else {
      toast("You've viewed all current match recommendations.")
      setCurrentIndex(0)
    }
  }

  const handleSave = () => {
    if (!p) return
    const next = new Set(savedIds)
    if (next.has(p.id)) {
      next.delete(p.id)
      toast('Removed from saved profiles')
    } else {
      next.add(p.id)
      toast('Profile saved')
    }
    setSavedIds(next)
  }

  const handleConnect = async () => {
    if (!p) return
    try {
      if (!p.id.startsWith('maya')) {
        await sendConnectionRequest(p.id)
      }
      toast(`Connection request sent to ${p.name}`)
      navigate(`/matches/${p.id}`)
    } catch (err: any) {
      toast(err?.message || 'Connection request submitted.')
      navigate(`/matches/${p.id}`)
    }
  }

  return (
    <AppShell
      title="Discover Matches"
      subtitle="People nearby who align with your interests and values"
      action={
        <div className="flex gap-2">
          <button
            aria-label="Sort matches"
            onClick={() => navigate('/matches/sort')}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm border border-brand-line hover:bg-slate-50 transition"
          >
            <Sparkles className="h-5 w-5" />
          </button>
          <button
            aria-label="Filter matches"
            onClick={() => navigate('/matches/filter')}
            className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-xl">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-500" />
            <p className="mt-3 text-sm text-brand-muted">Finding compatible community members...</p>
          </div>
        ) : !p ? (
          <Card className="p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-brand-500" />
            <h3 className="text-lg font-bold text-brand-ink">All caught up</h3>
            <p className="mt-1 text-sm text-brand-muted">Check back soon as new members join!</p>
            <Button className="mt-5" onClick={() => navigate('/feed')}>
              Return to Feed
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden shadow-lg border-brand-line">
            <div className="relative">
              <img
                src={p.image}
                alt={p.name}
                className="h-[52vh] min-h-[420px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-5 pt-24 text-white">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <button
                      onClick={() => navigate(`/matches/${p.id}`)}
                      className="flex items-center gap-1.5 text-3xl font-extrabold text-white hover:underline text-left"
                    >
                      {p.name}, {p.age}
                      {p.verified && <Verified />}
                    </button>
                    <div className="mt-1 flex items-center gap-1 text-sm text-white/80">
                      <MapPin className="h-4 w-4" />
                      {p.city} · {p.distance}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/95 px-3 py-2 text-center text-brand-ink">
                    <div className="text-2xl font-extrabold text-emerald-700">{p.match}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">fit</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-brand-muted">
                Shared interests
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.interests.map((x: string) => (
                  <Chip key={x}>{x}</Chip>
                ))}
              </div>

              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-brand-muted">
                Shared values
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.values.map((x: string) => (
                  <Chip key={x} tone="green">
                    {x}
                  </Chip>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Button variant="secondary" onClick={handlePass}>
                  <X className="h-5 w-5" /> Pass
                </Button>
                <Button variant="secondary" onClick={handleSave}>
                  <Bookmark className={`h-5 w-5 ${saved ? 'fill-brand-500 text-brand-500' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button onClick={handleConnect}>
                  <Sparkles className="h-5 w-5" /> Connect
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

export function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [profile, setProfile] = useState<any>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])
  const [matchScore, setMatchScore] = useState(94)
  const [followStatus, setFollowStatus] = useState<FollowStatus>('not_following')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none')
  const [loading, setLoading] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)

  const targetUserId = id || 'maya'

  useEffect(() => {
    const loadTargetProfile = async () => {
      setLoading(true)
      try {
        if (targetUserId === 'maya' || !targetUserId.includes('-')) {
          // Fallback demo profile
          setProfile({
            user_id: 'maya',
            first_name: 'Maya',
            last_name: 'Patel',
            location_city: 'Austin, Texas',
            bio: 'Community builder, book lover and weekend hiker. Always up for meaningful conversations, local trail meetups, and trying new coffee spots.',
            profile_image_url:
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
          })
          setInterests(['Hiking', 'Books', 'Mindfulness', 'Travel', 'Local Events'])
          setValues(['Kindness', 'Growth', 'Community', 'Honesty'])
          setMatchScore(94)
          if (user) {
            const rel = await getRelationshipState(user.id, targetUserId)
            setFollowStatus(rel.followStatus)
            setConnectionStatus(rel.connectionStatus)
          }
        } else {
          const [pRes, iRes, vRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', targetUserId).maybeSingle(),
            supabase.from('user_interests').select('interest_name').eq('user_id', targetUserId),
            supabase.from('user_values').select('value_name').eq('user_id', targetUserId),
          ])

          if (pRes.data) setProfile(pRes.data)
          setInterests((iRes.data || []).map(r => r.interest_name))
          setValues((vRes.data || []).map(r => r.value_name))

          if (user) {
            const rel = await getRelationshipState(user.id, targetUserId)
            setFollowStatus(rel.followStatus)
            setConnectionStatus(rel.connectionStatus)
          }
        }
      } catch (err: any) {
        toast(err?.message || 'Error loading profile details.')
      } finally {
        setLoading(false)
      }
    }

    loadTargetProfile()
  }, [targetUserId, user])

  const handleFollowToggle = async () => {
    if (!user) return
    setActionBusy(true)
    try {
      if (followStatus === 'following' || followStatus === 'requested') {
        await unfollowUser(targetUserId)
        setFollowStatus('not_following')
        toast('Unfollowed member')
      } else {
        const nextStatus = await followUser(targetUserId)
        setFollowStatus(nextStatus)
        toast(nextStatus === 'requested' ? 'Follow request sent' : 'Now following member')
      }
    } catch (err: any) {
      toast(err?.message || 'Action failed.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleConnectAction = async () => {
    if (!user) return
    setActionBusy(true)
    try {
      if (connectionStatus === 'none') {
        await sendConnectionRequest(targetUserId)
        setConnectionStatus('pending_outgoing')
        toast(`Connection request sent to ${profile?.first_name || 'member'}`)
      } else if (connectionStatus === 'pending_incoming') {
        await acceptConnectionRequest(targetUserId)
        setConnectionStatus('connected')
        toast(`You are now connected with ${profile?.first_name || 'member'}!`)
      } else if (connectionStatus === 'pending_outgoing') {
        await declineOrCancelConnection(targetUserId)
        setConnectionStatus('none')
        toast('Connection request cancelled')
      } else if (connectionStatus === 'connected') {
        navigate(`/messages/${targetUserId}`)
      }
    } catch (err: any) {
      toast(err?.message || 'Action failed.')
    } finally {
      setActionBusy(false)
    }
  }

  const handleDeclineIncoming = async () => {
    if (!user) return
    setActionBusy(true)
    try {
      await declineOrCancelConnection(targetUserId)
      setConnectionStatus('none')
      toast('Connection request declined')
    } catch (err: any) {
      toast(err?.message || 'Action failed.')
    } finally {
      setActionBusy(false)
    }
  }

  const fullName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Community Member'
    : 'Community Member'
  const city = profile?.location_city || 'Austin, Texas'

  return (
    <AppShell title={fullName} subtitle={`${matchScore}% connection fit`}>
      <div className="mx-auto max-w-3xl space-y-5">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            <Card className="overflow-hidden">
              <img
                src={profile?.profile_image_url || fallbackAvatar}
                alt={fullName}
                className="h-80 w-full object-cover"
              />
              <div className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-2xl font-extrabold text-brand-ink">
                      {fullName}, 28
                      <Verified />
                    </div>
                    <div className="mt-1 text-sm text-brand-muted">{city} · 1.2 mi away</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Follow Action */}
                    <Button
                      variant={followStatus === 'following' ? 'secondary' : 'default'}
                      onClick={handleFollowToggle}
                      disabled={actionBusy}
                      className="text-xs py-2 px-4"
                    >
                      {followStatus === 'following' ? (
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-4 w-4 text-emerald-600" /> Following
                        </span>
                      ) : followStatus === 'requested' ? (
                        'Requested'
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <UserPlus className="h-4 w-4" /> Follow
                        </span>
                      )}
                    </Button>

                    <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-center">
                      <div className="text-2xl font-extrabold text-emerald-700">{matchScore}%</div>
                      <div className="text-xs font-semibold text-emerald-700">Connection fit</div>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-slate-600 leading-relaxed text-sm">
                  {profile?.bio ||
                    'Community builder, book lover and weekend hiker. Always up for meaningful conversations and trying new local spots.'}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <Trust title="Identity verified" />
                  <Trust title="Active this week" />
                  <Trust title="Community contributor" />
                  <Trust title="Positive interactions" />
                </div>
              </div>
            </Card>

            {/* Why you may click */}
            <Card className="p-6">
              <h2 className="text-lg font-extrabold text-brand-ink">Why you may click</h2>
              <div className="mt-4 space-y-3">
                <Reason text="You both consider personal growth and authentic community important." />
                <Reason text={`You share interests in ${interests.slice(0, 3).join(', ') || 'hiking, books and local events'}.`} />
                <Reason text={`You are both active in ${city} local circles.`} />
              </div>
            </Card>

            {/* Conversation starters */}
            <Card className="p-6">
              <div className="flex items-center gap-2 font-extrabold text-brand-ink">
                <Sparkles className="h-5 w-5 text-brand-500" /> Conversation starters
              </div>
              <div className="mt-4 space-y-2">
                <Starter text="What's a book that recently changed your perspective?" />
                <Starter text={`What's your favorite local spot or trail around ${city}?`} />
                <Starter text="What kind of community project would you love to build?" />
              </div>
            </Card>

            {/* Sticky Connect / Message Action Bar */}
            <div className="sticky bottom-24 w-full lg:bottom-4 flex gap-3">
              {connectionStatus === 'pending_incoming' ? (
                <>
                  <Button
                    className="flex-1 py-3"
                    onClick={handleConnectAction}
                    disabled={actionBusy}
                  >
                    Accept Connection Request
                  </Button>
                  <Button
                    variant="secondary"
                    className="py-3"
                    onClick={handleDeclineIncoming}
                    disabled={actionBusy}
                  >
                    Decline
                  </Button>
                </>
              ) : connectionStatus === 'pending_outgoing' ? (
                <Button
                  variant="secondary"
                  className="w-full py-3"
                  onClick={handleConnectAction}
                  disabled={actionBusy}
                >
                  <Check className="h-4 w-4 text-brand-500" /> Connection Request Sent (Cancel)
                </Button>
              ) : connectionStatus === 'connected' ? (
                <Button
                  className="w-full py-3"
                  onClick={() => navigate(`/messages/${targetUserId}`)}
                >
                  <MessageCircle className="h-5 w-5" /> Message {profile?.first_name || 'Member'}
                </Button>
              ) : (
                <Button
                  className="w-full py-3"
                  onClick={handleConnectAction}
                  disabled={actionBusy}
                >
                  <Sparkles className="h-5 w-5" /> Connect with {profile?.first_name || 'Member'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

export function MatchFilter() {
  const navigate = useNavigate()
  const [interests, setInterests] = useState(['Hiking', 'Books', 'Community'])
  const [values, setValues] = useState(['Kindness', 'Growth', 'Community'])
  const [verified, setVerified] = useState(true)

  const toggle = (set: (v: string[]) => void, list: string[], value: string) =>
    set(list.includes(value) ? list.filter(x => x !== value) : [...list, value])

  return (
    <AppShell title="Filter Matches" subtitle="Tune who appears in your discovery feed">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <FilterBlock title="Distance">
            <input
              aria-label="Distance"
              type="range"
              className="w-full accent-brand-500"
              defaultValue={25}
            />
            <div className="mt-1 flex justify-between text-xs text-brand-muted">
              <span>5 mi</span>
              <span>25 mi</span>
              <span>100+ mi</span>
            </div>
          </FilterBlock>

          <FilterBlock title="Age range">
            <div className="grid grid-cols-2 gap-3">
              <input
                aria-label="Minimum age"
                className="rounded-xl border border-brand-line p-3 text-xs"
                defaultValue="22"
              />
              <input
                aria-label="Maximum age"
                className="rounded-xl border border-brand-line p-3 text-xs"
                defaultValue="40"
              />
            </div>
          </FilterBlock>

          <FilterBlock title="Interests">
            <div className="flex flex-wrap gap-2">
              {['Hiking', 'Books', 'Community', 'Travel', 'Yoga', 'Music', 'Art', 'Tech'].map(
                x => (
                  <Chip
                    key={x}
                    active={interests.includes(x)}
                    onClick={() => toggle(setInterests, interests, x)}
                  >
                    {x}
                  </Chip>
                )
              )}
            </div>
          </FilterBlock>

          <FilterBlock title="Values">
            <div className="flex flex-wrap gap-2">
              {[
                'Kindness',
                'Growth',
                'Community',
                'Learning',
                'Creativity',
                'Honesty',
              ].map(x => (
                <Chip
                  key={x}
                  active={values.includes(x)}
                  onClick={() => toggle(setValues, values, x)}
                >
                  {x}
                </Chip>
              ))}
            </div>
          </FilterBlock>

          <button
            type="button"
            onClick={() => setVerified(!verified)}
            className="mt-6 flex w-full items-center justify-between rounded-2xl bg-brand-canvas p-4 text-left"
          >
            <div>
              <div className="font-bold text-brand-ink">Verified only</div>
              <div className="text-xs text-brand-muted">Show identity-verified profiles only</div>
            </div>
            <div
              className={`h-7 w-12 rounded-full p-1 transition-colors ${
                verified ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  verified ? 'ml-auto' : ''
                }`}
              />
            </div>
          </button>

          <Button className="mt-6 w-full py-3" onClick={() => navigate('/matches')}>
            Apply Filters
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}

export function MatchSort() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('Best Match')

  return (
    <AppShell title="Sort Matches" subtitle="Choose how your discovery feed is ordered">
      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden">
          {[
            ['Newest', 'Recently joined'],
            ['Best Match', 'Highest connection-fit score'],
            ['Nearest', 'Closest to you'],
            ['Most Active', 'Recently active'],
            ['Shared Values', 'Most aligned values'],
          ].map(([title, detail]) => {
            const active = selected === title
            return (
              <button
                key={title}
                onClick={() => {
                  setSelected(title)
                  window.setTimeout(() => navigate('/matches'), 180)
                }}
                className={`flex w-full items-center gap-4 border-b border-brand-line p-5 text-left last:border-none hover:bg-slate-50 transition ${
                  active ? 'bg-brand-50/70' : ''
                }`}
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${
                    active ? 'bg-brand-500 text-white' : 'bg-brand-canvas text-brand-muted'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-brand-ink">{title}</div>
                  <div className="text-sm text-brand-muted">{detail}</div>
                </div>
                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border ${
                    active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                  }`}
                >
                  {active && <Check className="h-3 w-3" />}
                </div>
              </button>
            )
          })}
        </Card>
      </div>
    </AppShell>
  )
}

function Trust({ title }: { title: string }) {
  return (
    <div className="rounded-2xl bg-brand-canvas p-4 text-center">
      <Check className="mx-auto h-5 w-5 text-emerald-600" />
      <div className="mt-2 text-xs font-semibold text-brand-ink">{title}</div>
    </div>
  )
}

function Reason({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-brand-canvas p-4">
      <Check className="h-5 w-5 shrink-0 text-emerald-600" />
      <span className="text-sm text-slate-700 leading-relaxed">{text}</span>
    </div>
  )
}

function Starter({ text }: { text: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-xl border border-brand-line p-4 text-left text-sm hover:border-brand-500 transition text-slate-800">
      <span>{text}</span>
      <MessageCircle className="h-4 w-4 text-brand-500 shrink-0" />
    </button>
  )
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-brand-line py-5 last:border-none">
      <h3 className="mb-3 font-extrabold text-brand-ink text-sm">{title}</h3>
      {children}
    </div>
  )
}
