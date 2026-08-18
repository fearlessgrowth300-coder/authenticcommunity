import { useState, useEffect, type ReactNode } from 'react'
import {
  BadgeCheck,
  Camera,
  Edit3,
  Loader2,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar, Button, Card, Chip, Field, inputClass, SectionHeader, Verified } from '../components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useMockApp } from '../lib/mockApp'
import { supabase } from '@/integrations/supabase/client'
import {
  getProfileSocialStats,
  getFollowersList,
  getFollowingList,
  getConnectionsList,
  getPendingFollowRequests,
  acceptFollowRequest,
  rejectFollowRequest,
  followUser,
  unfollowUser,
  removeFollower,
  removeConnection,
  type SocialProfileStats,
  type SocialMember,
} from '../lib/socialGraphApi'

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85'

export function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [profile, setProfile] = useState<any>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])
  const [stats, setStats] = useState<SocialProfileStats>({
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadProfileData = async () => {
      setLoading(true)
      try {
        const [profileRes, interestsRes, valuesRes, socialStats] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
          supabase.from('user_values').select('value_name').eq('user_id', user.id),
          getProfileSocialStats(user.id),
        ])

        if (profileRes.data) setProfile(profileRes.data)
        setInterests((interestsRes.data || []).map(r => r.interest_name))
        setValues((valuesRes.data || []).map(r => r.value_name))
        setStats(socialStats)
      } catch (err: any) {
        toast(err?.message || 'Error loading profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user])

  const fullName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Jane Doe'
    : 'Jane Doe'
  const locationStr = profile
    ? [profile.location_city, profile.location_state, profile.location_country]
        .filter(Boolean)
        .join(', ') || 'Austin, Texas, USA'
    : 'Austin, Texas, USA'
  const bioText =
    profile?.bio ||
    'Community builder, nature lover and lifelong learner. I believe in kindness, curiosity and making meaningful connections.'

  // Profile completion calculation
  let completion = 40
  if (profile?.bio) completion += 20
  if (profile?.profile_image_url) completion += 20
  if (interests.length > 0) completion += 10
  if (values.length > 0) completion += 10

  return (
    <AppShell
      title="My Profile"
      subtitle="Your public identity, audience and real connections"
      action={
        <button
          onClick={() => navigate('/settings')}
          className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line bg-white hover:bg-slate-50 transition"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-slate-600" />
        </button>
      }
    >
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar src={profile?.profile_image_url || undefined} name={fullName} size="xl" />
            <div className="mt-4 flex items-center gap-1.5 text-2xl font-extrabold text-brand-ink">
              {fullName}
              <Verified />
            </div>
            <div className="mt-1 text-sm text-brand-muted">{locationStr}</div>
            <p className="mt-4 max-w-xl text-slate-600 leading-relaxed text-sm">{bioText}</p>

            {/* Social Graph Stats Chips */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => navigate('/profile/followers?tab=followers')}>
                <Chip>{stats.followersCount.toLocaleString()} Followers</Chip>
              </button>
              <button onClick={() => navigate('/profile/followers?tab=following')}>
                <Chip>{stats.followingCount.toLocaleString()} Following</Chip>
              </button>
              <button onClick={() => navigate('/profile/connections')}>
                <Chip tone="green">{stats.connectionsCount.toLocaleString()} Connections</Chip>
              </button>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            <Trust icon={<BadgeCheck />} label="Identity verified" />
            <Trust icon={<ShieldCheck />} label="Profile complete" />
            <Trust icon={<UsersRound />} label="Community contributor" />
            <Trust icon={<Star />} label="Positive interactions" />
          </div>

          {/* Interests & Values */}
          <div className="mt-7 grid gap-6 md:grid-cols-2">
            <div>
              <SectionHeader title="Interests" />
              <div className="flex flex-wrap gap-2">
                {interests.length > 0
                  ? interests.map(x => <Chip key={x}>{x}</Chip>)
                  : ['Hiking', 'Books', 'Mindfulness', 'Music', 'Travel'].map(x => (
                      <Chip key={x}>{x}</Chip>
                    ))}
              </div>
            </div>
            <div>
              <SectionHeader title="Values" />
              <div className="flex flex-wrap gap-2">
                {values.length > 0
                  ? values.map(x => (
                      <Chip key={x} tone="green">
                        {x}
                      </Chip>
                    ))
                  : ['Kindness', 'Honesty', 'Growth', 'Learning'].map(x => (
                      <Chip key={x} tone="green">
                        {x}
                      </Chip>
                    ))}
              </div>
            </div>
          </div>

          {/* Profile Completion Bar */}
          <div className="mt-7">
            <div className="flex justify-between text-sm font-semibold text-brand-ink">
              <span>Profile completion</span>
              <span className="text-brand-600">{completion}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <Button className="mt-6 w-full py-3" onClick={() => navigate('/profile/edit')}>
            <Edit3 className="h-4 w-4" /> Edit Profile
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}

export function EditProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationCountry, setLocationCountry] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])
  const [newInterestInput, setNewInterestInput] = useState('')
  const [newValueInput, setNewValueInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [pRes, iRes, vRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
        supabase.from('user_values').select('value_name').eq('user_id', user.id),
      ])

      if (pRes.data) {
        setFirstName(pRes.data.first_name || '')
        setLastName(pRes.data.last_name || '')
        setLocationCity(pRes.data.location_city || '')
        setLocationState(pRes.data.location_state || '')
        setLocationCountry(pRes.data.location_country || '')
        setBio(pRes.data.bio || '')
        setAvatarUrl(pRes.data.profile_image_url || null)
      }
      setInterests((iRes.data || []).map(r => r.interest_name))
      setValues((vRes.data || []).map(r => r.value_name))
    }
    load()
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar_${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = urlData.publicUrl
      setAvatarUrl(publicUrl)
      toast('Photo uploaded successfully')
    } catch (err: any) {
      toast(err?.message || 'Failed to upload avatar.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    try {
      // 1. Update profiles table
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          location_city: locationCity.trim(),
          location_state: locationState.trim(),
          location_country: locationCountry.trim(),
          bio: bio.trim(),
          profile_image_url: avatarUrl,
        })
        .eq('user_id', user.id)

      if (pErr) throw pErr

      // 2. Replace user_interests
      await supabase.from('user_interests').delete().eq('user_id', user.id)
      if (interests.length > 0) {
        await supabase.from('user_interests').insert(
          interests.map(name => ({
            user_id: user.id,
            interest_name: name,
            proficiency_level: 'intermediate',
          }))
        )
      }

      // 3. Replace user_values
      await supabase.from('user_values').delete().eq('user_id', user.id)
      if (values.length > 0) {
        await supabase.from('user_values').insert(
          values.map(name => ({
            user_id: user.id,
            value_name: name,
            importance_level: 'high',
          }))
        )
      }

      toast('Profile updated successfully!')
      navigate('/profile')
    } catch (err: any) {
      toast(err?.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const addInterest = () => {
    if (!newInterestInput.trim()) return
    if (!interests.includes(newInterestInput.trim())) {
      setInterests([...interests, newInterestInput.trim()])
    }
    setNewInterestInput('')
  }

  const addValue = () => {
    if (!newValueInput.trim()) return
    if (!values.includes(newValueInput.trim())) {
      setValues([...values, newValueInput.trim()])
    }
    setNewValueInput('')
  }

  return (
    <AppShell title="Edit Profile" subtitle="Keep your profile current and human">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar src={avatarUrl || undefined} name={`${firstName} ${lastName}`} size="xl" />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-white cursor-pointer hover:bg-brand-600 shadow transition"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="mt-7 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <input
                  className={inputClass}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </Field>
              <Field label="Last name">
                <input
                  className={inputClass}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="City">
                <input
                  className={inputClass}
                  value={locationCity}
                  onChange={e => setLocationCity(e.target.value)}
                  placeholder="City"
                />
              </Field>
              <Field label="State / Region">
                <input
                  className={inputClass}
                  value={locationState}
                  onChange={e => setLocationState(e.target.value)}
                  placeholder="State"
                />
              </Field>
              <Field label="Country">
                <input
                  className={inputClass}
                  value={locationCountry}
                  onChange={e => setLocationCountry(e.target.value)}
                  placeholder="Country"
                />
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                rows={4}
                className={inputClass}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell the community about yourself, your passions, and what brings you here..."
              />
            </Field>

            <Field label="Interests">
              <div className="flex flex-wrap gap-2 mb-2">
                {interests.map(x => (
                  <Chip key={x} onClick={() => setInterests(interests.filter(i => i !== x))}>
                    {x} ×
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newInterestInput}
                  onChange={e => setNewInterestInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="Add interest (press enter)"
                  className="flex-1 rounded-xl border border-brand-line bg-white px-3 py-2 text-xs outline-none"
                />
                <Button size="sm" type="button" onClick={addInterest}>
                  Add
                </Button>
              </div>
            </Field>

            <Field label="Core Values">
              <div className="flex flex-wrap gap-2 mb-2">
                {values.map(x => (
                  <Chip
                    key={x}
                    tone="green"
                    onClick={() => setValues(values.filter(v => v !== x))}
                  >
                    {x} ×
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newValueInput}
                  onChange={e => setNewValueInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue())}
                  placeholder="Add value (press enter)"
                  className="flex-1 rounded-xl border border-brand-line bg-white px-3 py-2 text-xs outline-none"
                />
                <Button size="sm" type="button" onClick={addValue}>
                  Add
                </Button>
              </div>
            </Field>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function Followers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTabParam = searchParams.get('tab')
  const defaultTab =
    initialTabParam === 'following'
      ? 'Following'
      : initialTabParam === 'connections'
      ? 'Connections'
      : 'Followers'

  const [tab, setTab] = useState<'Followers' | 'Following' | 'Connections'>(defaultTab)
  const { user } = useAuth()
  const { toast } = useMockApp()
  const navigate = useNavigate()

  const [members, setMembers] = useState<SocialMember[]>([])
  const [pendingRequests, setPendingRequests] = useState<SocialMember[]>([])
  const [loading, setLoading] = useState(true)

  const loadMembers = async (currentTab: 'Followers' | 'Following' | 'Connections') => {
    if (!user) return
    setLoading(true)
    try {
      let list: SocialMember[] = []
      if (currentTab === 'Followers') {
        const [followers, reqs] = await Promise.all([
          getFollowersList(user.id),
          getPendingFollowRequests(user.id),
        ])
        list = followers
        setPendingRequests(reqs)
      } else if (currentTab === 'Following') {
        list = await getFollowingList(user.id)
      } else {
        list = await getConnectionsList(user.id)
      }
      setMembers(list)
    } catch (err: any) {
      toast(err?.message || 'Failed to load list.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers(tab)
  }, [tab, user])

  const handleTabChange = (nextTab: 'Followers' | 'Following' | 'Connections') => {
    setTab(nextTab)
    setSearchParams({ tab: nextTab.toLowerCase() })
  }

  const handleToggleFollow = async (member: SocialMember) => {
    try {
      if (member.isFollowing) {
        await unfollowUser(member.userId)
        setMembers(curr =>
          curr.map(m => (m.userId === member.userId ? { ...m, isFollowing: false } : m))
        )
        toast(`Unfollowed ${member.name}`)
      } else {
        const res = await followUser(member.userId)
        setMembers(curr =>
          curr.map(m =>
            m.userId === member.userId
              ? { ...m, isFollowing: res === 'following' }
              : m
          )
        )
        toast(res === 'requested' ? `Follow request sent to ${member.name}` : `Following ${member.name}`)
      }
    } catch (err: any) {
      toast(err?.message || 'Action failed')
    }
  }

  const handleRemoveFollower = async (member: SocialMember) => {
    try {
      await removeFollower(member.userId)
      setMembers(curr => curr.filter(m => m.userId !== member.userId))
      toast(`Removed ${member.name} from followers`)
    } catch (err: any) {
      toast(err?.message || 'Failed to remove follower')
    }
  }

  const handleAcceptFollowReq = async (req: SocialMember) => {
    try {
      await acceptFollowRequest(req.userId)
      setPendingRequests(curr => curr.filter(r => r.userId !== req.userId))
      setMembers(curr => [req, ...curr])
      toast(`Accepted follow request from ${req.name}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to accept follow request')
    }
  }

  const handleRejectFollowReq = async (req: SocialMember) => {
    try {
      await rejectFollowRequest(req.userId)
      setPendingRequests(curr => curr.filter(r => r.userId !== req.userId))
      toast(`Declined follow request from ${req.name}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to decline follow request')
    }
  }

  return (
    <AppShell
      title="Followers & Following"
      subtitle="Your audience, your network, and your authentic connections"
    >
      <div className="mx-auto max-w-3xl">
        {/* Navigation Tabs */}
        <div className="mb-5 grid grid-cols-3 rounded-2xl bg-white p-1 shadow-sm border border-brand-line">
          {(['Followers', 'Following', 'Connections'] as const).map(item => (
            <button
              key={item}
              onClick={() => handleTabChange(item)}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                tab === item
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Pending Follow Requests (if private profile owner) */}
        {tab === 'Followers' && pendingRequests.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-brand-muted">
              Pending Follow Requests ({pendingRequests.length})
            </div>
            {pendingRequests.map(req => (
              <Card key={req.userId} className="flex items-center gap-4 p-4 border-brand-300 bg-brand-50/40">
                <Avatar src={req.avatar || undefined} name={req.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-brand-ink">{req.name}</div>
                  <div className="text-xs text-brand-muted">{req.city}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptFollowReq(req)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRejectFollowReq(req)}>
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Member List */}
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : members.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-brand-500" />
            <h3 className="text-lg font-bold text-brand-ink">No {tab.toLowerCase()} yet</h3>
            <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
              {tab === 'Followers'
                ? 'When people follow your updates, they will appear here.'
                : tab === 'Following'
                ? 'Follow members and creators to stay connected to their posts and activities.'
                : 'Send connection requests to members you share values and interests with.'}
            </p>
            <Button className="mt-5" onClick={() => navigate('/matches')}>
              Discover Members
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {members.map(member => (
              <Card key={member.userId} className="flex items-center gap-4 p-4">
                <button
                  onClick={() => navigate(`/matches/${member.userId}`)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left"
                >
                  <Avatar src={member.avatar || undefined} name={member.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-bold text-brand-ink">
                      {member.name}
                      <Verified />
                    </div>
                    <div className="text-xs text-brand-muted">
                      {member.city} · {member.matchPercentage}% connection fit
                    </div>
                    <div className="mt-1 text-xs text-slate-600 line-clamp-1">{member.bio}</div>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {tab === 'Followers' ? (
                    <>
                      <Button
                        variant={member.isFollowing ? 'secondary' : 'default'}
                        className="text-xs py-1.5 px-3"
                        onClick={() => handleToggleFollow(member)}
                      >
                        {member.isFollowing ? 'Following' : 'Follow back'}
                      </Button>
                      <button
                        onClick={() => handleRemoveFollower(member)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                        aria-label="Remove follower"
                        title="Remove follower"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </>
                  ) : tab === 'Following' ? (
                    <Button
                      variant="secondary"
                      className="text-xs py-1.5 px-3"
                      onClick={() => handleToggleFollow(member)}
                    >
                      Following
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="text-xs py-1.5 px-3"
                      onClick={() => navigate(`/messages/${member.userId}`)}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Message
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export function Connections() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [tab, setTab] = useState('All connections')
  const [connections, setConnections] = useState<SocialMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const list = await getConnectionsList(user.id)
        setConnections(list)
      } catch (err: any) {
        toast(err?.message || 'Failed to load connections.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleRemove = async (conn: SocialMember) => {
    if (!confirm(`Are you sure you want to remove connection with ${conn.name}?`)) return
    try {
      await removeConnection(conn.userId)
      setConnections(curr => curr.filter(c => c.userId !== conn.userId))
      toast(`Removed connection with ${conn.name}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to remove connection')
    }
  }

  return (
    <AppShell title="My Connections" subtitle="People you've mutually chosen to know">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex gap-2">
          {['All connections', 'Recent', 'Favorites'].map(item => (
            <Chip key={item} active={tab === item} onClick={() => setTab(item)}>
              {item}
            </Chip>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : connections.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-brand-500" />
            <h3 className="text-lg font-bold text-brand-ink">No mutual connections yet</h3>
            <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
              Connections are mutual relationships. When you both accept a connection request, you'll see them here.
            </p>
            <Button className="mt-5" onClick={() => navigate('/matches')}>
              Discover Matches
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {connections.map(p => (
              <Card key={p.userId} className="flex items-center gap-4 p-4">
                <button
                  onClick={() => navigate(`/matches/${p.userId}`)}
                  className="flex items-center gap-4 min-w-0 flex-1 text-left"
                >
                  <Avatar src={p.avatar || undefined} name={p.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-bold text-brand-ink">
                      {p.name}
                      <Verified />
                    </div>
                    <div className="text-xs text-brand-muted">{p.city} · Active connection</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.interests.slice(0, 2).map(x => (
                        <Chip key={x}>{x}</Chip>
                      ))}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="text-xs py-1.5 px-3"
                    onClick={() => navigate(`/messages/${p.userId}`)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </Button>
                  <button
                    onClick={() => handleRemove(p)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                    title="Remove connection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export function MyCommunities() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [communities, setCommunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('community_members')
        .select('community_id, role, communities(id, community_name, description, profile_image_url, member_count)')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        setCommunities(
          data.map((row: any) => ({
            id: row.communities.id,
            name: row.communities.community_name,
            role: row.role || 'Member',
            members: row.communities.member_count || 12,
            description: row.communities.description || 'Community for authentic local connection.',
            image: row.communities.profile_image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85',
          }))
        )
      }
      setLoading(false)
    }
    load()
  }, [user])

  return (
    <AppShell title="My Communities" subtitle="Spaces where you belong">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex gap-2">
          <Chip active>Joined</Chip>
          <Chip onClick={() => navigate('/communities')}>Discover</Chip>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : communities.length === 0 ? (
          <Card className="p-10 text-center">
            <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-500" />
            <h3 className="text-lg font-bold text-brand-ink">You haven't joined any communities</h3>
            <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
              Explore local groups around your interests, values, and shared hobbies.
            </p>
            <Button className="mt-5" onClick={() => navigate('/communities')}>
              Explore Communities
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {communities.map(c => (
              <Card key={c.id} className="overflow-hidden">
                <img src={c.image} alt={c.name} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-brand-ink">{c.name}</div>
                    <Chip tone="green">{c.role}</Chip>
                  </div>
                  <div className="mt-1 text-xs text-brand-muted">{c.members} members</div>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-2">{c.description}</p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => navigate(`/communities/${c.id}`)}
                  >
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          className="mt-5 w-full"
          onClick={() => navigate('/communities/create')}
        >
          + Create a Community
        </Button>
      </div>
    </AppShell>
  )
}

function Trust({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-brand-canvas p-4 text-center">
      <div className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
        {icon}
      </div>
      <div className="mt-2 text-xs font-semibold text-brand-ink">{label}</div>
    </div>
  )
}
