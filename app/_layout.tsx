import React, { useEffect } from 'react'
import { AppState } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '@/contexts/AuthContext'
import { recommendationEventBuffer } from '@/services/recommendationEventBuffer'

function RecommendationEventLifecycle() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') void recommendationEventBuffer.flush()
    })
    return () => {
      subscription.remove()
      void recommendationEventBuffer.flush()
    }
  }, [])
  return null
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RecommendationEventLifecycle />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
