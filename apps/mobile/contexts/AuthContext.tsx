import React, { createContext, useContext, useEffect, useState, useMemo } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'

declare const __DEV__: boolean

export type Profile = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  bio: string | null
  age: number | null
  location_city: string | null
  location_state: string | null
  location_country: string | null
  profile_image_url: string | null
  account_status: string | null
  is_verified: boolean | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isOnboarded: boolean
  isSuspended: boolean
  signIn: (email: string, pass: string) => Promise<{ error: AuthError | Error | null }>
  signUp: (
    email: string,
    pass: string,
    data?: { firstName?: string; lastName?: string }
  ) => Promise<{ error: AuthError | Error | null; user: User | null; session: Session | null }>
  verifyOtp: (
    email: string,
    token: string
  ) => Promise<{
    error: (AuthError & { code?: string; status?: number }) | Error | null
    user: User | null
    session: Session | null
    debug?: {
      projectRef: string
      email: string
      tokenLength: number
      verificationType: string
      errorCode?: string
      errorMessage?: string
    }
  }>
  resendOtp: (email: string) => Promise<{ error: AuthError | Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        setProfile(data as unknown as Profile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: initSession } }) => {
      setSession(initSession)
      setUser(initSession?.user ?? null)
      if (initSession?.user) {
        fetchProfile(initSession.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // 2. Realtime auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    })
    return { error }
  }

  const signUp = async (
    email: string,
    pass: string,
    data?: { firstName?: string; lastName?: string }
  ) => {
    const cleanEmail = email.trim().toLowerCase()
    const { data: resData, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          first_name: data?.firstName,
          last_name: data?.lastName,
        },
      },
    })
    return {
      error,
      user: resData?.user ?? null,
      session: resData?.session ?? null,
    }
  }

  const verifyOtp = async (email: string, token: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanToken = token.trim()
    const projectRef = 'sqzegh'
    const maskedEmail = cleanEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(1, b.length)) + c)

    let usedType = 'email'
    let { data: resData, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'email',
    })

    // If 'email' type fails and error indicates invalid token/type, also attempt 'signup' type
    if (error && (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('expired'))) {
      const fallbackRes = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      })

      if (!fallbackRes.error) {
        resData = fallbackRes.data
        error = null
        usedType = 'signup'
      } else {
        // Keep primary error or fallback info
        error = fallbackRes.error || error
      }
    }

    const debug = {
      projectRef,
      email: maskedEmail,
      tokenLength: cleanToken.length,
      verificationType: usedType,
      errorCode: (error as any)?.code || (error as any)?.status?.toString() || (error ? 'unknown_error' : undefined),
      errorMessage: error?.message,
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log('OTP DEBUG:', debug)
    }

    if (!error && resData?.session) {
      setSession(resData.session)
      setUser(resData.user)
      if (resData.user) {
        await fetchProfile(resData.user.id)
      }
    }

    return {
      error,
      user: resData?.user ?? null,
      session: resData?.session ?? null,
      debug,
    }
  }

  const resendOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const isOnboarded = useMemo(() => {
    if (!profile) return false
    return Boolean(profile.first_name && profile.location_city && profile.age)
  }, [profile])

  const isSuspended = useMemo(() => {
    return profile?.account_status === 'suspended' || profile?.account_status === 'banned'
  }, [profile])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isOnboarded,
        isSuspended,
        signIn,
        signUp,
        verifyOtp,
        resendOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
