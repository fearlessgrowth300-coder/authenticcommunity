import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Colors, Spacing } from '@/constants/theme'
import { completeOAuthCallback } from '@/services/oauth'

export default function OAuthCallbackScreen() {
  const router = useRouter()
  const url = Linking.useURL()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    completeOAuthCallback(url)
      .then(() => router.replace('/'))
      .catch((callbackError: any) => setError(callbackError?.message || 'Sign-in could not be completed.'))
  }, [router, url])

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <AppText variant="h3" weight="bold">Sign-in failed</AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center">{error}</AppText>
          <AppButton title="Back to Sign In" onPress={() => router.replace('/(auth)/login')} />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="bodySm" color={Colors.textSecondary}>Finishing your secure sign-in…</AppText>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
})
