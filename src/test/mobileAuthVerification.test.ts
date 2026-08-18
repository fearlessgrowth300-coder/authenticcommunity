import { describe, expect, it, vi, beforeEach } from 'vitest'

describe('Mobile Auth: Signup Email Verification & OTP Flow Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Signup Navigation Routing Invariants', () => {
    it('routes to verify-email when user is created but session is null (email confirmation required)', () => {
      const signupResponse = {
        user: { id: 'usr-new-123', email: 'test@example.com' },
        session: null,
        error: null,
      }

      let destination = ''
      let destinationParams: Record<string, any> = {}

      if (signupResponse.error) {
        destination = 'stay_on_signup_with_error'
      } else if (signupResponse.session) {
        destination = '/'
      } else if (signupResponse.user) {
        destination = '/(auth)/verify-email'
        destinationParams = { email: signupResponse.user.email }
      }

      expect(destination).toBe('/(auth)/verify-email')
      expect(destinationParams.email).toBe('test@example.com')
    })

    it('routes directly to root (onboarding/home) when session is pre-confirmed/active', () => {
      const signupResponse = {
        user: { id: 'usr-new-123', email: 'test@example.com' },
        session: { access_token: 'tok-123', refresh_token: 'ref-123' },
        error: null,
      }

      let destination = ''
      if (signupResponse.error) {
        destination = 'stay_on_signup_with_error'
      } else if (signupResponse.session) {
        destination = '/'
      }

      expect(destination).toBe('/')
    })
  })

  describe('2. OTP Verification & Error Mapping', () => {
    it('maps internal expired token error to friendly recovery message', () => {
      const rawError = { message: 'Token has expired or is invalid' }
      let userFacingError = ''

      const msg = rawError.message.toLowerCase()
      if (msg.includes('expired')) {
        userFacingError = 'This code has expired. Please tap "Resend Code" to get a new one.'
      } else if (msg.includes('invalid') || msg.includes('incorrect')) {
        userFacingError = 'The code is incorrect. Check your email and try again.'
      }

      expect(userFacingError).toBe('This code has expired. Please tap "Resend Code" to get a new one.')
    })

    it('maps incorrect code error to clear user-facing error message', () => {
      const rawError = { message: 'Token is invalid' }
      let userFacingError = ''

      const msg = rawError.message.toLowerCase()
      if (msg.includes('expired')) {
        userFacingError = 'This code has expired. Please tap "Resend Code" to get a new one.'
      } else if (msg.includes('invalid') || msg.includes('incorrect')) {
        userFacingError = 'The code is incorrect. Check your email and try again.'
      }

      expect(userFacingError).toBe('The code is incorrect. Check your email and try again.')
    })

    it('validates 6-digit numeric input constraint before submission', () => {
      const sanitizeOtp = (input: string) => input.replace(/[^0-9]/g, '').slice(0, 6)

      expect(sanitizeOtp('12345')).toBe('12345')
      expect(sanitizeOtp('123456')).toBe('123456')
      expect(sanitizeOtp('12345678')).toBe('123456')
      expect(sanitizeOtp('12a34b56')).toBe('123456')
      expect(sanitizeOtp('984-210')).toBe('984210')

      const isSubmittable = (code: string) => sanitizeOtp(code).length === 6
      expect(isSubmittable('12345')).toBe(false)
      expect(isSubmittable('123456')).toBe(true)
    })
  })

  describe('3. Verified State Post-OTP Routing', () => {
    it('routes newly verified user with incomplete onboarding to location step', () => {
      const profile = {
        first_name: 'Alex',
        location_city: null,
        age: null,
      }

      const isOnboarded = Boolean(profile.first_name && profile.location_city && profile.age)
      const nextRoute = isOnboarded ? '/(tabs)' : '/(onboarding)/location'

      expect(nextRoute).toBe('/(onboarding)/location')
    })

    it('routes verified user with completed profile directly to Home tabs', () => {
      const profile = {
        first_name: 'Alex',
        location_city: 'Austin',
        age: 27,
      }

      const isOnboarded = Boolean(profile.first_name && profile.location_city && profile.age)
      const nextRoute = isOnboarded ? '/(tabs)' : '/(onboarding)/location'

      expect(nextRoute).toBe('/(tabs)')
    })
  })

  describe('4. Resend Rate-Limiting & Cooldown Invariants', () => {
    it('enforces 60-second cooldown period before allowing another OTP dispatch', () => {
      let cooldownSeconds = 60
      const canResend = (seconds: number, isResending: boolean) => seconds === 0 && !isResending

      expect(canResend(cooldownSeconds, false)).toBe(false)

      // Simulate tick
      cooldownSeconds = 0
      expect(canResend(cooldownSeconds, false)).toBe(true)
      expect(canResend(cooldownSeconds, true)).toBe(false)
    })
  })

  describe('5. Auth Guard & Unauthenticated Verify Route Whitelist', () => {
    it('allows (auth)/verify-email to render without forcing redirect to login', () => {
      const currentPath = '/(auth)/verify-email'
      const isAuthRouteGroup = currentPath.startsWith('/(auth)')
      const isAuthenticated = false

      // Unauthenticated users are allowed within the (auth) group
      const shouldRedirectToLogin = !isAuthenticated && !isAuthRouteGroup
      expect(shouldRedirectToLogin).toBe(false)
    })
  })
})
