import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Users2, Sparkles } from 'lucide-react-native'

export default function SplashScreen() {
  const router = useRouter()
  const { user, profile, loading, isOnboarded, isSuspended } = useAuth()

  useEffect(() => {
    if (loading) return

    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login')
      } else if (isSuspended) {
        router.replace('/(auth)/login')
      } else if (!isOnboarded) {
        router.replace('/(onboarding)/location')
      } else {
        router.replace('/(tabs)')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [user, profile, loading, isOnboarded, isSuspended, router])

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        {/* Emblem / Logo */}
        <View style={styles.logoBadge}>
          <Users2 color="#FFFFFF" size={48} />
          <View style={styles.sparkleIcon}>
            <Sparkles color="#3BAA7A" size={20} />
          </View>
        </View>

        {/* Brand Title */}
        <AppText variant="h1" weight="bold" color="#FFFFFF" align="center" style={styles.brandTitle}>
          Authentic{'\n'}Community{'\n'}Connection
        </AppText>

        {/* Tagline */}
        <AppText variant="body" weight="medium" color="rgba(255,255,255,0.85)" align="center" style={styles.tagline}>
          Find your people. ❤️
        </AppText>
      </View>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  brandTitle: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: 16,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
  },
})
