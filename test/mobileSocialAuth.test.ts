import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('Mobile social authentication', () => {
  it('uses Supabase PKCE with an app-owned callback scheme', () => {
    expect(source('services/supabase.ts')).toContain("flowType: 'pkce'")
    const oauth = source('services/oauth.ts')
    expect(oauth).toContain("provider: SocialAuthProvider")
    expect(oauth).toContain("redirectTo: OAUTH_REDIRECT_URL")
    expect(oauth).toContain("skipBrowserRedirect: true")
    expect(oauth).toContain("exchangeCodeForSession")
    expect(oauth).toContain("openAuthSessionAsync")
    expect(oauth).toContain("authentic://auth/callback")
  })

  it('offers working Google and Apple actions on login and signup', () => {
    const buttons = source('components/auth/SocialAuthButtons.tsx')
    expect(buttons).toContain("handleSocialAuth('google')")
    expect(buttons).toContain("handleSocialAuth('apple')")
    expect(source('app/(auth)/login.tsx')).toContain('<SocialAuthButtons')
    expect(source('app/(auth)/signup.tsx')).toContain('<SocialAuthButtons')
    expect(source('app/(auth)/login.tsx')).not.toContain('Social login will be available soon')
  })

  it('has a resilient deep-link callback route and browser dependency', () => {
    expect(source('app/auth/callback.tsx')).toContain('completeOAuthCallback(url)')
    expect(source('package.json')).toContain('expo-web-browser')
  })
})
