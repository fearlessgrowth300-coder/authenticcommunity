import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import type { Database } from '@authentic/core'

declare const process: { env: Record<string, string | undefined> }

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    try {
      return SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: (key: string, value: string) => {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch {
      return Promise.resolve()
    }
  },
  removeItem: (key: string) => {
    try {
      return SecureStore.deleteItemAsync(key)
    } catch {
      return Promise.resolve()
    }
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sqzeghkabqhhhiuidnvd.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rgbggmAfwHot4tP6D1748A_HcZhSPFH'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS !== 'web' ? ExpoSecureStoreAdapter : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
