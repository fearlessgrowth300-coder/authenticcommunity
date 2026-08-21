import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'

export type SocialAuthProvider = 'google' | 'apple'

// Expo Go receives an exp:// callback while signed development/production
// builds receive the app-owned authentic:// callback from app.json.
export const OAUTH_REDIRECT_URL = Linking.createURL('auth/callback')

WebBrowser.maybeCompleteAuthSession()

function callbackParameters(url: string) {
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : ''
  const fragment = url.includes('#') ? url.split('#')[1] : ''
  const values = new Map<string, string>()
  for (const pair of [query, fragment].filter(Boolean).join('&').split('&')) {
    const [rawKey, ...rawValue] = pair.split('=')
    if (!rawKey) continue
    values.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue.join('=').replace(/\+/g, ' ')))
  }
  return values
}

export async function completeOAuthCallback(url: string) {
  const params = callbackParameters(url)
  const providerError = params.get('error_description') || params.get('error')
  if (providerError) throw new Error(providerError)

  const code = params.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data.session
  }

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) throw error
    return data.session
  }

  const existing = await supabase.auth.getSession()
  if (existing.data.session) return existing.data.session
  throw new Error('The provider returned without an authentication session.')
}

export async function signInWithSocialProvider(provider: SocialAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: OAUTH_REDIRECT_URL,
      skipBrowserRedirect: true,
      queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    },
  })

  if (error) throw error
  if (!data.url) throw new Error(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not configured.`)

  const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT_URL)
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign-in was cancelled.')
  }
  if (result.type !== 'success' || !result.url) {
    throw new Error('The sign-in window did not return a result.')
  }

  return completeOAuthCallback(result.url)
}
