import { useEffect, useState, type ReactNode } from 'react'
import { Heart, MapPin, Search, ShieldCheck, UsersRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, Chip, Field, inputClass, SectionHeader } from '@/components/ui/AppUi'
import { toast } from 'sonner'
import {
  joinCommunity as joinPersistedCommunity,
  loadCommunities,
  loadCommunity,
  createCommunity,
  type CommunityRecord,
} from '@/features/communities/communityApi'

const fallbackImage = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85'

const defaultCommunities: CommunityRecord[] = [
  {
    id: 'c1',
    name: 'Austin Hikers & Nature Lovers',
    members: '1,420',
    distance: '2.4 mi away',
    category: 'Outdoors',
    description: 'Weekly trail walks, weekend park picnics and mindful outdoor adventures around Austin greenbelts.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=85',
    trusted: true,
    approvalRequired: false,
  },
  {
    id: 'c2',
    name: 'Mindful Living & Philosophy',
    members: '890',
    distance: '3.1 mi away',
    category: 'Wellness',
    description: 'A thoughtful circle for intentional living, book circles and conscious conversations.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=85',
    trusted: true,
    approvalRequired: true,
  },
]

export function Communities() {
  const nav = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [saved, setSaved] = useState(new Set<string>())
  const [remote, setRemote] = useState<CommunityRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommunities()
      .then(res => setRemote(res))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const source = remote.length ? remote : defaultCommunities
  const visible = source.filter(
    c =>
      (category === 'All' || c.category === category) &&
      (c.name + c.description).toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AppShell
      title="Discover Communities"
      subtitle="Explore spaces where real people connect around shared interests and values"
      action={
        <button
          aria-label="Create a community"
          onClick={() => nav('/communities/create')}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white"
        >
          <UsersRound className="h-5 w-5" />
        </button>
      }
    >
      <div className="space-y-5">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            className="w-full rounded-2xl border border-brand-line bg-white py-3.5 pl-12 pr-4 outline-none focus:border-brand-500"
            placeholder="Search communities, topics or keywords"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['All', 'Wellness', 'Outdoors', 'Learning', 'Faith', 'Arts & Culture', 'Technology', 'Business'].map(x => (
            <Chip key={x} active={category === x} onClick={() => setCategory(x)}>
              {x}
            </Chip>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map(c => {
            const favorite = saved.has(c.id)
            return (
              <Card key={c.id} className="overflow-hidden">
                <img src={c.image} className="h-48 w-full object-cover" alt={c.name} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-lg font-extrabold text-brand-ink">
                        {c.name}
                        {c.trusted && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-brand-muted">
                        <span>{c.members} members</span>
                        <span>·</span>
                        <span>{c.distance}</span>
                      </div>
                    </div>
                    <button
                      aria-label="Save community"
                      onClick={() =>
                        setSaved(current => {
                          const next = new Set(current)
                          favorite ? next.delete(c.id) : next.add(c.id)
                          return next
                        })
                      }
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          favorite ? 'fill-brand-coral text-brand-coral' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3">
                    <Chip tone={c.category === 'Outdoors' ? 'green' : 'amber'}>{c.category}</Chip>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">{c.description}</p>
                  <Button className="mt-5 w-full" onClick={() => nav(`/communities/${c.id}`)}>
                    View community
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
        {visible.length === 0 && !loading && (
          <Card className="p-8 text-center text-brand-muted">No communities match that search yet.</Card>
        )}
      </div>
    </AppShell>
  )
}

export function CommunityDetail() {
  const nav = useNavigate()
  const { id } = useParams()
  const [tab, setTab] = useState('About')
  const [remoteDetail, setRemoteDetail] = useState<CommunityRecord | null>(null)
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    if (id && /^[0-9a-f-]{36}$/i.test(id)) {
      loadCommunity(id).then(setRemoteDetail).catch(() => undefined)
    }
  }, [id])

  const c = remoteDetail || defaultCommunities.find(x => x.id === id) || defaultCommunities[0]

  const join = async () => {
    if (remoteDetail) {
      try {
        const result = await joinPersistedCommunity(remoteDetail)
        setIsJoined(result === 'joined')
        toast.success(result === 'joined' ? "You're in!" : 'Request sent to the community admins')
      } catch (error: any) {
        toast.error(error?.message || 'Could not join this community')
      }
      return
    }
    setIsJoined(!isJoined)
    toast.success(!isJoined ? "You're in!" : 'Left community')
  }

  const handleTabClick = (item: string) => {
    setTab(item)
    if (item === 'Chat') {
      if (remoteDetail?.id) {
        nav(`/communities/${remoteDetail.id}/chat`)
      } else {
        nav('/messages/community')
      }
    }
  }

  return (
    <AppShell title={c.name} subtitle={`${c.members} members · ${c.distance}`}>
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="overflow-hidden">
          <img src={c.image} className="h-72 w-full object-cover" alt={c.name} />
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-2xl font-extrabold text-brand-ink">
                  {c.name}
                  {c.trusted && <ShieldCheck className="h-6 w-6 text-emerald-600" />}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip tone="green">{c.category}</Chip>
                  <Chip>Local</Chip>
                  <Chip tone="gray">Active</Chip>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={join}>
                  {isJoined ? 'Joined ✓' : remoteDetail?.approvalRequired ? 'Request to join' : 'Join Community'}
                </Button>
                <Button variant="secondary">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-6 flex gap-6 border-b border-brand-line text-sm font-bold">
              {['About', 'Chat', 'Events', 'Members'].map(item => (
                <button
                  key={item}
                  onClick={() => handleTabClick(item)}
                  className={`pb-3 ${tab === item ? 'border-b-2 border-brand-500 text-brand-600' : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
            {tab === 'About' ? (
              <>
                <p className="mt-5 text-slate-600">
                  {c.description} All experience levels are welcome. Respect, curiosity and participation keep this community healthy.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Info icon={<MapPin />} title="Your local area" detail={c.distance} />
                  <Info icon={<UsersRound />} title="Public Community" detail="Anyone can find and join" />
                </div>
              </>
            ) : (
              <div className="py-7 text-sm text-brand-muted">
                {tab} are available to members. Join this community to take part.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function CreateCommunity() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Outdoors')
  const [location, setLocation] = useState('Austin, Texas, USA')
  const [privacy, setPrivacy] = useState('Public · Anyone can find and join')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a community name.')
      return
    }

    setSubmitting(true)
    try {
      const newId = await createCommunity({
        name,
        description: description || `A welcoming community for ${category} enthusiasts in ${location}.`,
        category,
        location,
        privacy,
      })
      toast.success(`Community "${name}" created successfully!`)
      nav(`/communities/${newId}`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create community.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Create Community" subtitle="Build a space where people belong">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <div
                key={n}
                className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                  n === 1 ? 'bg-brand-500 text-white' : 'bg-brand-canvas text-brand-muted'
                }`}
              >
                {n}
              </div>
            ))}
          </div>
          <div className="space-y-5">
            <Field label="Community name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Austin Coffee Connect"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={inputClass}
              >
                <option value="Outdoors">Outdoors</option>
                <option value="Wellness">Wellness</option>
                <option value="Learning">Learning</option>
                <option value="Technology">Technology</option>
                <option value="Arts & Culture">Arts & Culture</option>
                <option value="Business">Business</option>
                <option value="Food">Food</option>
                <option value="Social">Social</option>
              </select>
            </Field>
            <Field label="Location">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={inputClass}
                placeholder="e.g. Austin, Texas, USA"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Tell members about this community's purpose and values..."
              />
            </Field>
            <Field label="Privacy">
              <select
                value={privacy}
                onChange={e => setPrivacy(e.target.value)}
                className={inputClass}
              >
                <option value="Public · Anyone can find and join">Public · Anyone can find and join</option>
                <option value="Approval required">Approval required</option>
                <option value="Private">Private</option>
              </select>
            </Field>
          </div>
          <Button className="mt-6 w-full" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Creating community...' : 'Create Community'}
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}

export function CommunityFilter() {
  const nav = useNavigate()
  return (
    <AppShell title="Filter Communities" subtitle="Narrow discovery to the spaces that fit you">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <Filter title="Category">
            <div className="flex flex-wrap gap-2">
              {['All', 'Wellness', 'Outdoors', 'Learning', 'Faith', 'Arts & Culture', 'Technology', 'Food', 'Business'].map(
                (x, i) => (
                  <Chip key={x} active={i === 0}>
                    {x}
                  </Chip>
                )
              )}
            </div>
          </Filter>
          <Filter title="Distance">
            <input type="range" className="w-full accent-brand-500" />
            <div className="mt-1 flex justify-between text-xs text-brand-muted">
              <span>Any distance</span>
              <span>50+ mi</span>
            </div>
          </Filter>
          <Filter title="Group size">
            <div className="flex flex-wrap gap-2">
              {['Any size', 'Small (1–25)', 'Medium (26–100)', 'Large (100+)'].map((x, i) => (
                <Chip key={x} active={i === 0}>
                  {x}
                </Chip>
              ))}
            </div>
          </Filter>
          <Button className="mt-6 w-full" onClick={() => nav('/communities')}>
            Show Results
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}

function Info({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-brand-canvas p-4">
      <div className="text-brand-500">{icon}</div>
      <div>
        <div className="font-bold text-brand-ink">{title}</div>
        <div className="text-xs text-brand-muted">{detail}</div>
      </div>
    </div>
  )
}

function Filter({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-brand-line py-5">
      <h3 className="mb-3 font-extrabold text-brand-ink">{title}</h3>
      {children}
    </div>
  )
}
