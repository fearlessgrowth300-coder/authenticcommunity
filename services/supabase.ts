import { createClient } from '@supabase/supabase-js'

declare const process: { env: Record<string, string | undefined> }

const memoryStorage = new Map<string, string>()

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const SecureStore = require('expo-secure-store')
      return await SecureStore.getItemAsync(key)
    } catch {
      // Fallback
    }
    return memoryStorage.get(key) || null
  },
  setItem: async (key: string, value: string) => {
    try {
      const SecureStore = require('expo-secure-store')
      await SecureStore.setItemAsync(key, value)
      return
    } catch {
      // Fallback
    }
    memoryStorage.set(key, value)
  },
  removeItem: async (key: string) => {
    try {
      const SecureStore = require('expo-secure-store')
      await SecureStore.deleteItemAsync(key)
      return
    } catch {
      // Fallback
    }
    memoryStorage.delete(key)
  },
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sqzeghkabqhhhiuidnvd.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_rgbggmAfwHot4tP6D1748A_HcZhSPFH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
