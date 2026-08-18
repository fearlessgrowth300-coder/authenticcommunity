import { useState, useEffect, type ReactNode } from 'react'
import { CalendarDays, Camera, Clock, Heart, Loader2, MapPin, Search, Share2, ShieldCheck, UsersRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, Card, Chip, Field, inputClass } from '../components/ui'
import { events as mockEvents } from '../lib/data'
import { useMockApp } from '../lib/mockApp'
import { loadEvents, loadEventDetail, rsvpToEvent, createEvent, type EventRecord } from '../lib/communityApi'

export function Events() {
  const nav = useNavigate()
  const [tab, setTab] = useState('For You')
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(new Set<string>())
  const [remoteEvents, setRemoteEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents({ query })
      .then(res => setRemoteEvents(res))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [query])

  const source = remoteEvents.length > 0 ? remoteEvents : (mockEvents as unknown as EventRecord[])
  const listed = source.filter(event =>
    event.title.toLowerCase().includes(query.toLowerCase()) ||
    event.description.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AppShell
      title="Events"
      subtitle="What's happening near you"
      action={
        <button
          onClick={() => nav('/events/create')}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white"
          aria-label="Create Event"
        >
          <CalendarDays className="h-5 w-5" />
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
            placeholder="Search events, people or topics"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['For You', 'Today', 'This Week', 'Nearby'].map(item => (
            <Chip key={item} active={tab === item} onClick={() => setTab(item)}>
              {item}
            </Chip>
          ))}
        </div>
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {listed.map(e => {
              const savedEvent = saved.has(e.id)
              return (
                <Card key={e.id} className="overflow-hidden">
                  <div className="relative">
                    <img src={e.image} className="h-52 w-full object-cover" alt={e.title} />
                    <div className="absolute left-3 top-3 rounded-xl bg-white px-3 py-2 text-center shadow">
                      <div className="text-xs font-bold text-brand-coral">{e.date.split(' ')[0]}</div>
                      <div className="text-xl font-extrabold">{e.date.split(' ')[1] || '18'}</div>
                    </div>
                    <button
                      aria-label="Save event"
                      onClick={() =>
                        setSaved(current => {
                          const next = new Set(current)
                          savedEvent ? next.delete(e.id) : next.add(e.id)
                          return next
                        })
                      }
                      className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm"
                    >
                      <Heart
                        className={`h-5 w-5 ${savedEvent ? 'fill-brand-coral text-brand-coral' : 'text-slate-400'}`}
                      />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="text-lg font-extrabold text-brand-ink">{e.title}</div>
                    <div className="mt-1 text-sm text-brand-muted">{e.host}</div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-brand-500" />
                        {e.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-500" />
                        {e.distance} away
                      </div>
                      <div className="flex items-center gap-2">
                        <UsersRound className="h-4 w-4 text-brand-500" />
                        {e.attendees} going {e.isRsvpd && <span className="text-emerald-600 font-bold text-xs">(You're going)</span>}
                      </div>
                    </div>
                    <Button className="mt-5 w-full" onClick={() => nav(`/events/${e.id}`)}>
                      View event
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export function EventDetail() {
  const { id } = useParams()
  const { toast } = useMockApp()
  const [remoteEvent, setRemoteEvent] = useState<EventRecord | null>(null)
  const [going, setGoing] = useState(false)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (id && /^[0-9a-f-]{36}$/i.test(id)) {
      loadEventDetail(id)
        .then(res => {
          if (res) {
            setRemoteEvent(res)
            setGoing(Boolean(res.isRsvpd))
            setAttendeeCount(res.attendees)
          }
        })
        .catch(() => undefined)
    }
  }, [id])

  const e = remoteEvent || (mockEvents.find(x => x.id === id) as unknown as EventRecord) || (mockEvents[0] as unknown as EventRecord)

  const handleRsvp = async () => {
    if (!id) return
    setBusy(true)
    try {
      if (remoteEvent) {
        const nextState = await rsvpToEvent(remoteEvent.id, going)
        setGoing(nextState)
        setAttendeeCount(c => (nextState ? c + 1 : Math.max(0, c - 1)))
        toast(nextState ? "You're going! ✓" : 'RSVP cancelled')
      } else {
        const nextState = !going
        setGoing(nextState)
        setAttendeeCount(c => (nextState ? c + 1 : Math.max(0, c - 1)))
        toast(nextState ? "You're going! ✓" : 'RSVP cancelled')
      }
    } catch (err: any) {
      toast(err?.message || 'Could not update RSVP.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell title={e.title} subtitle={`${e.date} · ${e.time}`}>
      <div className="mx-auto max-w-4xl space-y-5">
        <Card className="overflow-hidden">
          <div className="relative">
            <img src={e.image} className="h-80 w-full object-cover" alt={e.title} />
            <button
              onClick={() => toast('Share link copied')}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white shadow"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-brand-ink">{e.title}</h1>
                <p className="mt-2 text-brand-muted">Hosted by {e.host}</p>
              </div>
              <Button variant="secondary" onClick={() => toast(`You are following ${e.host}`)}>
                Follow host
              </Button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Info icon={<CalendarDays />} title={e.date} detail={e.time} />
              <Info icon={<MapPin />} title="Location" detail={e.distance} />
              <Info
                icon={<UsersRound />}
                title={`${attendeeCount || e.attendees} going`}
                detail="People from nearby communities"
              />
            </div>
            <div className="mt-5 h-44 rounded-2xl bg-[linear-gradient(135deg,#e7eef7_25%,#d9f0e6_25%,#d9f0e6_50%,#edf2f7_50%,#edf2f7_75%,#e7eef7_75%)] bg-[length:48px_48px] grid place-items-center">
              <MapPin className="h-8 w-8 fill-brand-500 text-white" />
            </div>
            <h2 className="mt-6 text-lg font-extrabold text-brand-ink">About this event</h2>
            <p className="mt-2 text-slate-600 leading-relaxed">{e.description}</p>
            <div className="mt-5 flex gap-3 rounded-2xl bg-brand-50 p-4">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              <div>
                <div className="font-bold text-brand-600">Safety first</div>
                <div className="text-sm text-brand-muted">
                  Respect community guidelines and only share location details that are necessary.
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Button
          className="sticky bottom-24 w-full lg:bottom-4 py-3"
          onClick={handleRsvp}
          disabled={busy}
        >
          {going ? "You're going ✓" : 'RSVP Now'}
        </Button>
      </div>
    </AppShell>
  )
}

export function CreateEvent() {
  const nav = useNavigate()
  const { toast } = useMockApp()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('18:00')
  const [location, setLocation] = useState('Austin, Texas, USA')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Wellness')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      toast('Please enter an event title.')
      return
    }

    setSubmitting(true)
    try {
      const newId = await createEvent({
        title,
        description: description || `Community gathering for ${type} in ${location}.`,
        date: date || new Date().toISOString().split('T')[0],
        time: time || '18:00',
        location: location || 'Austin, Texas',
        category: type,
      })
      toast(`“${title}” created successfully!`)
      nav(`/events/${newId}`)
    } catch (err: any) {
      toast(err?.message || 'Failed to create event.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Create Event" subtitle="Turn online discovery into a real-world connection">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <Field label="Cover photo">
            <button
              type="button"
              onClick={() => toast('Default high-resolution cover assigned')}
              className="grid h-48 w-full place-items-center rounded-2xl border-2 border-dashed border-brand-line bg-brand-canvas"
            >
              <Camera className="h-7 w-7 text-brand-500" />
            </button>
          </Field>
          <div className="mt-5 space-y-5">
            <Field label="Event title">
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                className={inputClass}
                placeholder="e.g. Community Picnic in the Park"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Location">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={inputClass}
                placeholder="Search for a location"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Tell people about your event..."
              />
            </Field>
            <Field label="Event type">
              <div className="flex flex-wrap gap-2">
                {['Wellness', 'Social', 'Learning', 'Volunteer', 'Outdoors'].map(item => (
                  <Chip key={item} active={type === item} onClick={() => setType(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
          <Button className="mt-6 w-full py-3" onClick={handleCreate} disabled={submitting}>
            {submitting ? 'Publishing event...' : 'Create Event'}
          </Button>
          <p className="mt-3 text-center text-xs text-brand-muted">
            Events can be reviewed for safety and authenticity.
          </p>
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

