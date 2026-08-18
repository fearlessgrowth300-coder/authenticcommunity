import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Check, ChevronLeft, MapPin, Search, Sparkles, Loader2, Upload } from 'lucide-react'
import { Button, Card, Chip, Field, inputClass } from '../components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useMockApp } from '../lib/mockApp'
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/constants'

function Frame({ step, children }: { step: number; children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-brand-canvas px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm hover:bg-slate-50 transition"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <Card className="p-5 sm:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-muted">
              <span>Profile setup</span>
              <span>Step {step} of 4</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(n => (
                <div
                  key={n}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    n <= step ? 'bg-brand-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          {children}
        </Card>
      </div>
    </div>
  )
}

export function OnboardingLocation() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [cityInput, setCityInput] = useState('Austin, Texas, USA')
  const [radius, setRadius] = useState('10 mi')
  const [cityOnly, setCityOnly] = useState(true)
  const [coords, setCoords] = useState<{ lat: number; lng: number; city: string; state: string; country: string }>({
    lat: 30.2672,
    lng: -97.7431,
    city: 'Austin',
    state: 'Texas',
    country: 'United States',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('location_city, location_state, location_country, latitude, longitude, max_distance_km, show_location')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        const fullCity = [data.location_city, data.location_state, data.location_country].filter(Boolean).join(', ')
        if (fullCity) setCityInput(fullCity)
        if (data.show_location !== null) setCityOnly(!data.show_location)
        if (data.latitude && data.longitude) {
          setCoords({
            lat: data.latitude,
            lng: data.longitude,
            city: data.location_city || 'Austin',
            state: data.location_state || '',
            country: data.location_country || '',
          })
        }
        if (data.max_distance_km) {
          const km = data.max_distance_km
          if (km <= 10) setRadius('5 mi')
          else if (km <= 20) setRadius('10 mi')
          else if (km <= 45) setRadius('25 mi')
          else if (km <= 90) setRadius('50 mi')
          else setRadius('100+ mi')
        }
      }
    }
    loadProfile()
  }, [user])

  const parseDistanceKm = (rad: string) => {
    switch (rad) {
      case '5 mi': return 8
      case '10 mi': return 16
      case '25 mi': return 40
      case '50 mi': return 80
      case '100+ mi': return 160
      default: return 20
    }
  }

  const handleContinue = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setSaving(true)
    try {
      // Parse city string if user typed something custom
      const parts = cityInput.split(',').map(s => s.trim())
      const city = parts[0] || coords.city || cityInput
      const state = parts[1] || coords.state || ''
      const country = parts[2] || coords.country || 'United States'

      const maxDistanceKm = parseDistanceKm(radius)

      const { error } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          location_city: city,
          location_state: state,
          location_country: country,
          latitude: coords.lat,
          longitude: coords.lng,
          max_distance_km: maxDistanceKm,
          show_location: !cityOnly,
          onboarding_step: 1,
        },
        { onConflict: 'user_id' }
      )

      if (error) throw error
      navigate('/onboarding/interests')
    } catch (err: any) {
      toast(err?.message || 'Failed to save location.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Frame step={1}>
      <h1 className="text-3xl font-extrabold text-brand-ink">Where are you based?</h1>
      <p className="mt-2 text-brand-muted">
        We'll show you people, communities and events nearby. Your exact location stays private.
      </p>

      <div className="mt-7">
        <Field label="City">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              className={`${inputClass} pl-10`}
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              placeholder="e.g. Austin, Texas, USA"
            />
          </div>
        </Field>
      </div>

      <div className="relative mt-4 h-64 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e7eef7_25%,#d9f0e6_25%,#d9f0e6_50%,#edf2f7_50%,#edf2f7_75%,#e7eef7_75%)] bg-[length:48px_48px]">
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-32 w-32 place-items-center rounded-full bg-brand-500/10 ring-2 ring-brand-500/30">
            <MapPin className="h-9 w-9 fill-brand-500 text-white animate-bounce" />
          </div>
        </div>
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand-ink backdrop-blur shadow-sm">
          {cityInput || 'Austin, Texas'}
        </div>
      </div>

      <h3 className="mt-6 font-bold text-brand-ink">How far are you open to connect?</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {['5 mi', '10 mi', '25 mi', '50 mi', '100+ mi'].map(x => (
          <Chip key={x} active={radius === x} onClick={() => setRadius(x)}>
            {x}
          </Chip>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCityOnly(!cityOnly)}
        className="mt-6 flex w-full items-center justify-between rounded-2xl bg-emerald-50 p-4 text-left transition hover:bg-emerald-100/70"
      >
        <div>
          <div className="font-semibold text-emerald-900">Show my city, not exact location</div>
          <div className="text-xs text-emerald-700">Recommended for privacy</div>
        </div>
        <div className={`h-7 w-12 rounded-full p-1 transition-colors ${cityOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <div className={`h-5 w-5 rounded-full bg-white transition-transform ${cityOnly ? 'ml-auto' : ''}`} />
        </div>
      </button>

      <Button className="mt-7 w-full" onClick={handleContinue} disabled={saving}>
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        ) : (
          'Continue'
        )}
      </Button>
    </Frame>
  )
}

export function OnboardingInterests() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const items = [
    'Design', 'Gaming', 'Fitness', 'Books', 'Technology', 'Music',
    'Travel', 'Entrepreneurship', 'Photography', 'Startups', 'Hiking', 'Food',
    'Art', 'Writing', 'Mindfulness', 'Cooking', 'Outdoors', 'Community'
  ]

  const [selected, setSelected] = useState<string[]>(['Design', 'Books', 'Travel', 'Entrepreneurship'])
  const [level, setLevel] = useState('Enthusiast')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadInterests = async () => {
      const { data } = await supabase
        .from('user_interests')
        .select('interest_name, proficiency_level')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        setSelected(data.map(d => d.interest_name))
        if (data[0].proficiency_level) setLevel(data[0].proficiency_level)
      }
    }
    loadInterests()
  }, [user])

  const toggle = (item: string) => {
    setSelected(current =>
      current.includes(item)
        ? current.filter(v => v !== item)
        : current.length < 6
        ? [...current, item]
        : current
    )
  }

  const handleContinue = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (selected.length === 0) {
      toast('Please select at least 1 interest.')
      return
    }

    setSaving(true)
    try {
      // Clear existing and re-insert
      await supabase.from('user_interests').delete().eq('user_id', user.id)

      const rows = selected.map(interest => ({
        user_id: user.id,
        interest_name: interest,
        proficiency_level: level,
        interest_category: 'General',
      }))

      const { error: insertError } = await supabase.from('user_interests').insert(rows)
      if (insertError) throw insertError

      await supabase.from('profiles').update({ onboarding_step: 2 }).eq('user_id', user.id)

      navigate('/onboarding/values')
    } catch (err: any) {
      toast(err?.message || 'Failed to save interests.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Frame step={2}>
      <h1 className="text-3xl font-extrabold text-brand-ink">What are you into?</h1>
      <p className="mt-2 text-brand-muted">
        Pick up to 6 interests to find your people ({selected.length}/6).
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        {items.map((x, i) => {
          const active = selected.includes(x)
          return (
            <Chip
              key={x}
              tone={i % 4 === 0 ? 'green' : i % 4 === 1 ? 'coral' : i % 4 === 2 ? 'amber' : 'indigo'}
              active={active}
              onClick={() => toggle(x)}
            >
              {active && <Check className="h-3 w-3" />}
              {x}
            </Chip>
          )
        })}
      </div>

      <h3 className="mt-8 font-bold text-brand-ink">Your proficiency (optional)</h3>
      <div className="mt-3 flex gap-2">
        {['Beginner', 'Enthusiast', 'Expert'].map(item => (
          <Chip key={item} active={level === item} onClick={() => setLevel(item)}>
            {item}
          </Chip>
        ))}
      </div>

      <Button className="mt-8 w-full" onClick={handleContinue} disabled={saving}>
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        ) : (
          'Continue'
        )}
      </Button>
    </Frame>
  )
}

export function OnboardingValues() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const items = [
    'Kindness', 'Growth', 'Honesty', 'Family', 'Creativity',
    'Community', 'Faith', 'Health', 'Learning', 'Adventure', 'Freedom', 'Empathy'
  ]

  const [selected, setSelected] = useState<string[]>(['Kindness', 'Growth', 'Honesty', 'Community'])
  const [importance, setImportance] = useState('Important')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadValues = async () => {
      const { data } = await supabase
        .from('user_values')
        .select('value_name, importance_level')
        .eq('user_id', user.id)

      if (data && data.length > 0) {
        setSelected(data.map(d => d.value_name))
        if (data[0].importance_level) setImportance(data[0].importance_level)
      }
    }
    loadValues()
  }, [user])

  const toggle = (item: string) => {
    setSelected(current =>
      current.includes(item)
        ? current.filter(v => v !== item)
        : current.length < 6
        ? [...current, item]
        : current
    )
  }

  const handleContinue = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (selected.length === 0) {
      toast('Please select at least 1 value.')
      return
    }

    setSaving(true)
    try {
      await supabase.from('user_values').delete().eq('user_id', user.id)

      const rows = selected.map(val => ({
        user_id: user.id,
        value_name: val,
        importance_level: importance,
      }))

      const { error: insertError } = await supabase.from('user_values').insert(rows)
      if (insertError) throw insertError

      await supabase.from('profiles').update({ onboarding_step: 3 }).eq('user_id', user.id)

      navigate('/onboarding/bio')
    } catch (err: any) {
      toast(err?.message || 'Failed to save values.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Frame step={3}>
      <h1 className="text-3xl font-extrabold text-brand-ink">What matters most to you?</h1>
      <p className="mt-2 text-brand-muted">
        Choose the core values that guide your life and relationships ({selected.length}/6).
      </p>

      <div className="mt-7 flex flex-wrap gap-2">
        {items.map((x, i) => {
          const active = selected.includes(x)
          return (
            <Chip
              key={x}
              tone={i % 3 === 0 ? 'green' : i % 3 === 1 ? 'indigo' : 'amber'}
              active={active}
              onClick={() => toggle(x)}
            >
              {active && <Check className="h-3 w-3" />}
              {x}
            </Chip>
          )
        })}
      </div>

      <h3 className="mt-8 font-bold text-brand-ink">How important are these values to you?</h3>
      <div className="mt-3 flex gap-2">
        {['Somewhat', 'Important', 'Essential'].map(item => (
          <Chip key={item} active={importance === item} onClick={() => setImportance(item)}>
            {item}
          </Chip>
        ))}
      </div>

      <Button className="mt-8 w-full" onClick={handleContinue} disabled={saving}>
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </span>
        ) : (
          'Continue'
        )}
      </Button>
    </Frame>
  )
}

export function OnboardingBio() {
  const navigate = useNavigate()
  const { user, refreshOnboarding } = useAuth()
  const { toast } = useMockApp()

  const [bio, setBio] = useState(
    'Designer by day, coffee enthusiast always. I love great conversations, local adventures and building meaningful connections.'
  )
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('bio, profile_image_url')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        if (data.bio) setBio(data.bio)
        if (data.profile_image_url) setAvatarPreview(data.profile_image_url)
      }
    }
    loadProfile()
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAIAssist = () => {
    setBio(
      'Curious explorer focused on genuine connections, community projects, and good conversation. Excited to meet people and share local adventures!'
    )
    toast('Bio updated with an authentic introduction')
  }

  const handleFinish = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setSaving(true)
    try {
      let publicImageUrl: string | undefined = undefined

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg'
        const path = `${user.id}/avatar_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          publicImageUrl = urlData?.publicUrl
        }
      }

      const updateData: Record<string, any> = {
        bio: bio.trim(),
        onboarding_completed: true,
        onboarding_step: 4,
        updated_at: new Date().toISOString(),
      }

      if (publicImageUrl) {
        updateData.profile_image_url = publicImageUrl
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('user_id', user.id)
      if (error) throw error

      await refreshOnboarding()
      toast('Welcome to Authentic Community!')
      navigate('/home')
    } catch (err: any) {
      toast(err?.message || 'Failed to complete onboarding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Frame step={4}>
      <h1 className="text-3xl font-extrabold text-brand-ink">Show people the real you.</h1>
      <p className="mt-2 text-brand-muted">
        A clear photo and honest bio make better introductions.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group mx-auto mt-8 block relative"
        aria-label="Upload photo"
      >
        <div className="grid h-32 w-32 place-items-center rounded-full bg-brand-50 ring-4 ring-white shadow-soft overflow-hidden mx-auto transition group-hover:ring-brand-200">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-brand-500 group-hover:scale-110 transition-transform" />
          )}
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:underline">
          <Upload className="h-3 w-3" /> {avatarPreview ? 'Change photo' : 'Upload photo'}
        </span>
      </button>

      <div className="mt-7">
        <Field label="Bio">
          <textarea
            rows={5}
            className={inputClass}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell people about what you enjoy and what brings you here..."
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={handleAIAssist}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-brand-500/20 bg-brand-50 p-4 text-left transition hover:bg-brand-100/50"
      >
        <Sparkles className="h-5 w-5 text-brand-500" />
        <div>
          <div className="font-bold text-brand-600">AI Assist</div>
          <div className="text-xs text-brand-muted">Help me make this sound natural, not robotic.</div>
        </div>
      </button>

      <Button className="mt-7 w-full" onClick={handleFinish} disabled={saving}>
        {saving ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Finalizing setup...
          </span>
        ) : (
          'Finish & Explore'
        )}
      </Button>
    </Frame>
  )
}
