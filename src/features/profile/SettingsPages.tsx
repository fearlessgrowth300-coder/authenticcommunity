import { useState, useEffect } from 'react'
import { Bell, ChevronRight, Crown, HelpCircle, KeyRound, LogOut, Mail, Moon, ShieldCheck, Trash2, UserRound, Loader2, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button, Card, Field, inputClass } from '@/components/ui/AppUi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

export function SettingsHome() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const items = [
    ['Account', 'Manage your account details', UserRound, '/settings/account'],
    ['Privacy & Safety', 'Control your privacy and safety', ShieldCheck, '/settings/privacy'],
    ['Notifications', 'Manage your alerts and updates', Bell, '/settings/notifications'],
    ['Appearance', 'Customize theme and display', Moon, 'appearance'],
    ['Subscription', 'View plan and billing details', Crown, 'subscription'],
    ['Support', 'Help center and contact us', HelpCircle, 'support'],
  ]

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.message || 'Error signing out.')
    }
  }

  return (
    <AppShell title="Settings" subtitle="Control your account, privacy and experience">
      <div className="mx-auto max-w-2xl space-y-3">
        {items.map(([a, b, I, path]) => {
          const Icon = I as any
          return (
            <Card key={a as string}>
              <button
                onClick={() =>
                  typeof path === 'string' &&
                  (path.startsWith('/')
                    ? navigate(path)
                    : toast.info(`${a} settings will be configured soon`))
                }
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-slate-50 transition rounded-2xl"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-brand-ink">{a as string}</div>
                  <div className="text-sm text-brand-muted">{b as string}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </Card>
          )
        })}
        <Card>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 p-4 text-left text-red-600 hover:bg-red-50/50 transition rounded-2xl"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold">Log out</div>
              <div className="text-sm text-red-400">Sign out of your account</div>
            </div>
          </button>
        </Card>
      </div>
    </AppShell>
  )
}

export function AccountSettings() {
  const { user, updatePassword, signOut } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user])

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error('Enter a new password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSavingPassword(true)
    try {
      await updatePassword(newPassword)
      setNewPassword('')
      toast.success('Password updated successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setDeletingAccount(true)
    try {
      if (user) {
        await supabase
          .from('profiles')
          .update({ account_status: 'deleted', is_active: false })
          .eq('user_id', user.id)
        await signOut()
        toast.success('Account deleted')
        navigate('/login')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account.')
    } finally {
      setDeletingAccount(false)
    }
  }

  const identities = user?.identities || []
  const hasGoogle = identities.some(i => i.provider === 'google')
  const hasGithub = identities.some(i => i.provider === 'github')

  return (
    <AppShell title="Account Settings" subtitle="Email, password, login methods and security">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Account information</h2>
          <div className="mt-4 space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClass} pl-10 bg-slate-50 cursor-not-allowed`}
                  value={email}
                  disabled
                />
              </div>
            </Field>
            <Field label="Change Password">
              <div className="relative">
                <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pl-10 pr-10`}
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>
          <Button onClick={handleUpdatePassword} disabled={savingPassword} className="mt-5 w-full">
            {savingPassword ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              'Save new password'
            )}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Connected accounts</h2>
          <div className="mt-4 space-y-3">
            <Connected name="Google" state={hasGoogle ? 'Connected' : 'Not linked'} />
            <Connected name="GitHub" state={hasGithub ? 'Connected' : 'Not linked'} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <div className="font-bold text-brand-ink">Account security</div>
              <div className="text-sm text-brand-muted">Protected by Supabase Authentication</div>
            </div>
            <span className="font-bold text-emerald-600 text-sm">Active</span>
          </div>
        </Card>

        <Button variant="danger" onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full">
          <Trash2 className="h-4 w-4" />
          {deletingAccount ? 'Deleting account...' : 'Delete account'}
        </Button>
      </div>
    </AppShell>
  )
}

export function PrivacySettings() {
  const { user } = useAuth()
  const [cityOnly, setCityOnly] = useState(true)
  const [profileVisibility, setProfileVisibility] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadPrivacy = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('show_location, profile_visibility')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        if (data.show_location !== null) setCityOnly(!data.show_location)
        if (data.profile_visibility) setProfileVisibility(data.profile_visibility === 'public')
      }
    }
    loadPrivacy()
  }, [user])

  const toggleLocationPrivacy = async () => {
    const nextVal = !cityOnly
    setCityOnly(nextVal)
    if (user) {
      await supabase.from('profiles').update({ show_location: !nextVal }).eq('user_id', user.id)
      toast.success(nextVal ? 'Exact location hidden (showing city only)' : 'Location visibility updated')
    }
  }

  const toggleVisibility = async () => {
    const nextVal = !profileVisibility
    setProfileVisibility(nextVal)
    if (user) {
      await supabase
        .from('profiles')
        .update({ profile_visibility: nextVal ? 'public' : 'connections' })
        .eq('user_id', user.id)
      toast.success(nextVal ? 'Profile is visible to all members' : 'Profile is visible to connections only')
    }
  }

  return (
    <AppShell title="Privacy & Safety" subtitle="You control who can find, message and locate you">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Privacy controls</h2>
          <div className="mt-4 divide-y divide-brand-line">
            <button
              type="button"
              onClick={toggleVisibility}
              className="flex w-full items-center gap-4 py-4 text-left"
            >
              <div className="flex-1">
                <div className="font-bold text-brand-ink">Profile visibility</div>
                <div className="text-sm text-brand-muted">Allow others to find and view your profile</div>
              </div>
              <div className={`h-7 w-12 rounded-full p-1 transition-colors ${profileVisibility ? 'bg-brand-500' : 'bg-slate-200'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${profileVisibility ? 'ml-auto' : ''}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={toggleLocationPrivacy}
              className="flex w-full items-center gap-4 py-4 text-left"
            >
              <div className="flex-1">
                <div className="font-bold text-brand-ink">Show city, not exact location</div>
                <div className="text-sm text-brand-muted">Keep precise coordinates private</div>
              </div>
              <div className={`h-7 w-12 rounded-full p-1 transition-colors ${cityOnly ? 'bg-brand-500' : 'bg-slate-200'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${cityOnly ? 'ml-auto' : ''}`} />
              </div>
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Messaging</h2>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-canvas p-4">
            <div>
              <div className="font-bold text-brand-ink">Message permissions</div>
              <div className="text-sm text-brand-muted">Choose who can send you direct messages</div>
            </div>
            <span className="font-bold text-brand-600 text-sm">Everyone</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Safety tools</h2>
          <div className="mt-4 divide-y divide-brand-line">
            <Row title="Blocked users" detail="Manage blocked members" />
            <Row title="Report center" detail="Review moderation and safety reports" />
            <Row title="Safety resources" detail="Tips and authentic community guidelines" />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>({
    messages: true,
    connections: true,
    communities: true,
    events: true,
    digest: false,
    push: true,
    email: true,
  })

  const toggle = (id: string) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
    toast.success('Preferences updated')
  }

  return (
    <AppShell title="Notification Settings" subtitle="Choose which updates deserve your attention">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Notification types</h2>
          <div className="mt-4 divide-y divide-brand-line">
            <Toggle id="messages" title="Messages" detail="New messages and replies" on={settings.messages} onToggle={toggle} />
            <Toggle id="connections" title="Connection requests" detail="People who want to connect" on={settings.connections} onToggle={toggle} />
            <Toggle id="communities" title="Communities" detail="Posts, comments and mentions" on={settings.communities} onToggle={toggle} />
            <Toggle id="events" title="Events" detail="Event updates and reminders" on={settings.events} onToggle={toggle} />
            <Toggle id="digest" title="Weekly digest" detail="Your weekly community summary" on={settings.digest} onToggle={toggle} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-brand-ink">Delivery preferences</h2>
          <div className="mt-4 divide-y divide-brand-line">
            <Toggle id="push" title="Push notifications" detail="Instant alerts on this device" on={settings.push} onToggle={toggle} />
            <Toggle id="email" title="Email notifications" detail="Receive selected updates by email" on={settings.email} onToggle={toggle} />
          </div>
        </Card>
      </div>
    </AppShell>
  )
}

function Connected({ name, state }: { name: string; state: string }) {
  const isConnected = state === 'Connected'
  return (
    <div className="flex items-center justify-between rounded-xl bg-brand-canvas p-4">
      <div className="font-bold text-brand-ink">{name}</div>
      <span className={`text-sm font-bold ${isConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
        {state}
      </span>
    </div>
  )
}

function Toggle({ id, title, detail, on, onToggle }: { id: string; title: string; detail: string; on: boolean; onToggle: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="flex w-full items-center gap-4 py-4 text-left"
    >
      <div className="flex-1">
        <div className="font-bold text-brand-ink">{title}</div>
        <div className="text-sm text-brand-muted">{detail}</div>
      </div>
      <div className={`h-7 w-12 rounded-full p-1 transition-colors ${on ? 'bg-brand-500' : 'bg-slate-200'}`}>
        <div className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'ml-auto' : ''}`} />
      </div>
    </button>
  )
}

function Row({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="font-bold text-brand-ink">{title}</div>
        <div className="text-sm text-brand-muted">{detail}</div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  )
}
