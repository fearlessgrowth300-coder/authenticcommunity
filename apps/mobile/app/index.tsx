import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { LoadingState } from '@/components/primitives/LoadingState'

export default function SplashScreen() {
  const router = useRouter()
  const { user, profile, loading, isOnboarded, isSuspended } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/(auth)/login')
    } else if (isSuspended) {
      router.replace('/(auth)/login')
    } else if (!isOnboarded) {
      router.replace('/(onboarding)/location')
    } else {
      router.replace('/(tabs)')
    }
  }, [user, profile, loading, isOnboarded, isSuspended, router])

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <AppText variant="h1" weight="bold" color={Colors.primary} align="center">
          🌟 Authentic
        </AppText>
        <AppText variant="body" color={Colors.textSecondary} align="center" style={styles.tagline}>
          Genuine connections, meaningful communities
        </AppText>
      </View>
      <LoadingState message="Initializing session..." />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  tagline: {
    marginTop: 8,
  },
})
