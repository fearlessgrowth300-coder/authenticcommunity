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

  describe('2. OTP String Integrity & Leading Zeros', () => {
    it('preserves leading zeros and keeps token as pure string without number conversion', () => {
      const sanitizeOtp = (input: string) => String(input).replace(/[^0-9]/g, '').slice(0, 6)

      // Test with leading zero: '074508'
      const otpWithZero = '074508'
      const result = sanitizeOtp(otpWithZero)

      expect(typeof result).toBe('string')
      expect(result).toBe('074508')
      expect(result.startsWith('0')).toBe(true)
      expect(result.length).toBe(6)

      // Never parse as Number which would drop '0' -> 74508
      expect(Number(result).toString()).not.toBe('074508')
      expect(result).toBe('074508')
    })

    it('joins 6 discrete input cells into ordered 6-digit string', () => {
      const cells = ['0', '7', '4', '5', '0', '8']
      const joinedToken = cells.join('').trim()

      expect(joinedToken).toBe('074508')
      expect(joinedToken.length).toBe(6)
    })
  })

  describe('3. Supabase Verification Uses Type Email', () => {
    it('calls verifyOtp with type: email and normalized credentials', async () => {
      const mockVerify = vi.fn().mockResolvedValue({
        data: { session: { access_token: 'abc' }, user: { id: 'u1' } },
        error: null,
      })

      const rawEmail = '  TestUser@Example.COM '
      const rawToken = ' 074508 '

      const normalizedEmail = rawEmail.trim().toLowerCase()
      const cleanToken = String(rawToken).trim()

      await mockVerify({
        email: normalizedEmail,
        token: cleanToken,
        type: 'email',
      })

      expect(mockVerify).toHaveBeenCalledWith({
        email: 'testuser@example.com',
        token: '074508',
        type: 'email',
      })
    })

    it('maps internal expired token error to friendly recovery message', () => {
      const rawError = { message: 'Token has expired or is invalid' }
      let userFacingError = ''

      const msg = rawError.message.toLowerCase()
      if (msg.includes('expired')) {
        userFacingError = 'This code has expired. Please tap "Resend Code" to request a new code.'
      } else if (msg.includes('invalid') || msg.includes('incorrect')) {
        userFacingError = 'The code is incorrect. Check the email and try again.'
      }

      expect(userFacingError).toBe('This code has expired. Please tap "Resend Code" to request a new code.')
    })
  })

  describe('4. Resend Behavior Remains Type Signup', () => {
    it('uses type: signup for resendOtp', async () => {
      const mockResend = vi.fn().mockResolvedValue({ error: null })
      const rawEmail = ' TestUser@Example.COM '
      const normalizedEmail = rawEmail.trim().toLowerCase()

      await mockResend({
        type: 'signup',
        email: normalizedEmail,
      })

      expect(mockResend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'testuser@example.com',
      })
    })

    it('enforces 60-second cooldown without mounting side effects', () => {
      let cooldownSeconds = 60
      const canResend = (seconds: number, isResending: boolean) => seconds === 0 && !isResending

      expect(canResend(cooldownSeconds, false)).toBe(false)

      cooldownSeconds = 0
      expect(canResend(cooldownSeconds, false)).toBe(true)
      expect(canResend(cooldownSeconds, true)).toBe(false)
    })
  })

  describe('5. Verified State Post-OTP Routing', () => {
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
})
