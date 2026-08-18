import { useState, useEffect, type ReactNode, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, Mail, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, ArrowLeft, Lock } from 'lucide-react'
import { Brand } from '@/components/layout/Brand'
import { Button, Field, inputClass, Card } from '@/components/ui/AppUi'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

export function Splash() {
  const navigate = useNavigate()
  const { user, onboardingCompleted, loading } = useAuth()

  const handleContinue = () => {
    if (!loading && user) {
      if (onboardingCompleted === false) {
        navigate('/onboarding/location')
      } else {
        navigate('/home')
      }
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-400 px-6 text-white">
      <button onClick={handleContinue} className="text-center">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[2rem] bg-white/15 shadow-2xl backdrop-blur">
          <Brand compact />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Authentic Community Connection</h1>
        <p className="mt-3 text-lg text-white/80">Find your people. Build something real.</p>
        <p className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
          Tap to continue <ArrowRight className="h-4 w-4" />
        </p>
      </button>
    </div>
  )
}

function AuthFrame({ children, quote }: { children: ReactNode; quote: string }) {
  return (
    <div className="min-h-screen bg-brand-canvas lg:grid lg:grid-cols-2">
      <div className="hidden min-h-screen flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-400 p-12 text-white lg:flex">
        <Brand />
        <div className="max-w-lg">
          <p className="text-4xl font-extrabold leading-tight">“{quote}”</p>
          <p className="mt-5 text-white/75">
            Built for meaningful friendships, trusted communities and local experiences.
          </p>
        </div>
        <p className="text-sm text-white/60">Authentic Community Connection</p>
      </div>
      <div className="flex min-h-screen items-center justify-center p-5 sm:p-8">{children}</div>
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithOAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      setErrorMsg('Please enter your email.')
      return
    }
    if (!password) {
      setErrorMsg('Please enter your password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      toast.success('Signed in successfully')
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in. Please check your credentials.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMsg(null)
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      const msg = err?.message || `Failed to start ${provider} sign-in.`
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  return (
    <AuthFrame quote="The internet can introduce us. Real life can make us friends.">
      <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-8 lg:hidden">
          <Brand />
        </div>
        <h1 className="text-3xl font-extrabold text-brand-ink">Welcome back 👋</h1>
        <p className="mt-2 text-sm text-brand-muted">Reconnect with your people.</p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-brand-line" />
          or continue with
          <span className="h-px flex-1 bg-brand-line" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => handleOAuth('google')}>
            <span className="font-black text-red-500">G</span>Google
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleOAuth('github')}>
            <Github className="h-4 w-4" />GitHub
          </Button>
        </div>

        <p className="mt-7 text-center text-sm text-brand-muted">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="font-bold text-brand-600 hover:underline"
          >
            Create one
          </button>
        </p>
      </div>
    </AuthFrame>
  )
}

export function Signup() {
  const navigate = useNavigate()
  const { signUp, signInWithOAuth } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email.')
      return
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    const parts = fullName.trim().split(' ')
    const firstName = parts[0] || ''
    const lastName = parts.slice(1).join(' ') || ''

    setSubmitting(true)
    try {
      await signUp(email.trim(), password, firstName, lastName)
      toast.success('Account created!')
      // Check if session was created directly or confirmation email was sent
      const { data } = await supabase.auth.getSession()
      if (data?.session) {
        navigate('/onboarding/location')
      } else {
        setVerificationSent(true)
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create account. Please try again.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setErrorMsg(null)
    try {
      await signInWithOAuth(provider)
    } catch (err: any) {
      const msg = err?.message || `Failed to start ${provider} signup.`
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  if (verificationSent) {
    return (
      <AuthFrame quote="Find people who get you, not just people who follow you.">
        <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Check your email</h1>
          <p className="mt-2 text-sm text-brand-muted leading-relaxed">
            We sent a verification link to <strong className="text-brand-ink">{email}</strong>. Please confirm your email to complete registration.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
            Back to Sign In
          </Button>
        </div>
      </AuthFrame>
    )
  }

  return (
    <AuthFrame quote="Find people who get you, not just people who follow you.">
      <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-8 lg:hidden">
          <Brand />
        </div>
        <h1 className="text-3xl font-extrabold text-brand-ink">Find people who get you.</h1>
        <p className="mt-2 text-sm text-brand-muted">Create an account and we'll personalize your community.</p>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="Full name">
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputClass}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Field label="Password" hint="6+ characters">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${inputClass} pr-10`}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
              </span>
            ) : (
              'Create my account'
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-brand-line" />
          or sign up with
          <span className="h-px flex-1 bg-brand-line" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => handleOAuth('google')}>
            <span className="font-black text-red-500">G</span>Google
          </Button>
          <Button type="button" variant="secondary" onClick={() => handleOAuth('github')}>
            <Github className="h-4 w-4" />GitHub
          </Button>
        </div>

        <p className="mt-4 text-xs leading-5 text-brand-muted">
          By continuing, you agree to the Terms and Community Guidelines.
        </p>
        <p className="mt-6 text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-bold text-brand-600 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthFrame>
  )
}

export function ForgotPassword() {
  const navigate = useNavigate()
  const { resetPasswordForEmail } = useAuth()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      setErrorMsg('Please enter your email.')
      return
    }

    setSubmitting(true)
    try {
      await resetPasswordForEmail(email.trim())
      setSent(true)
      toast.success('Reset link sent to your email')
    } catch (err: any) {
      const msg = err?.message || 'Failed to send reset link.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame quote="Account safety and recovery keep our community trustworthy.">
      <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-brand-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-ink">Check your email</h1>
            <p className="mt-2 text-sm text-brand-muted">
              We sent a password reset link to <strong className="text-brand-ink">{email}</strong>.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Return to login
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-brand-ink">Reset password</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Enter your email and we'll send you instructions to reset your password.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <Field label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </Field>

              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending reset link...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthFrame>
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await updatePassword(password)
      setSuccess(true)
      toast.success('Password updated successfully')
      setTimeout(() => navigate('/home'), 1500)
    } catch (err: any) {
      const msg = err?.message || 'Failed to update password.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthFrame quote="Create a strong new password for your account.">
      <div className="w-full max-w-md rounded-3xl border border-brand-line bg-white p-6 shadow-soft sm:p-8">
        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-ink">Password updated!</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Your password has been changed. Redirecting to your community...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-brand-ink">New Password</h1>
            <p className="mt-2 text-sm text-brand-muted">
              Choose a strong password to protect your account.
            </p>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <Field label="New Password">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pl-10 pr-10`}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                  />
                </div>
              </Field>

              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthFrame>
  )
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setErrorMessage(error.message)
          setStatus('error')
          return
        }

        if (data?.session) {
          setStatus('success')
          setTimeout(() => navigate('/onboarding/location', { replace: true }), 1200)
          return
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const queryParams = new URLSearchParams(window.location.search)

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            setErrorMessage(sessionError.message)
            setStatus('error')
            return
          }

          setStatus('success')
          setTimeout(() => navigate('/onboarding/location', { replace: true }), 1200)
        } else {
          setStatus('success')
          setTimeout(() => navigate('/onboarding/location', { replace: true }), 1200)
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Authentication failed')
        setStatus('error')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-brand-canvas flex flex-col items-center justify-center px-6 text-center">
      {status === 'loading' && (
        <Card className="p-8 max-w-sm w-full">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-brand-ink mb-1">Completing sign-in...</h1>
          <p className="text-xs text-brand-muted">Please wait a moment.</p>
        </Card>
      )}
      {status === 'success' && (
        <Card className="p-8 max-w-sm w-full">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-brand-ink mb-1">Signed in!</h1>
          <p className="text-xs text-brand-muted">Redirecting to your community...</p>
        </Card>
      )}
      {status === 'error' && (
        <Card className="p-8 max-w-sm w-full">
          <h1 className="text-lg font-bold text-red-600 mb-2">Authentication Failed</h1>
          <p className="text-xs text-brand-muted mb-6">{errorMessage}</p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Back to Sign in
          </Button>
        </Card>
      )}
    </div>
  )
}
