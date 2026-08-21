import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/primitives/AppText'
import { Colors, Radii } from '@/constants/theme'
import { signInWithSocialProvider, SocialAuthProvider } from '@/services/oauth'

interface SocialAuthButtonsProps {
  onError: (message: string | null) => void
}

export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<SocialAuthProvider | null>(null)

  const handleSocialAuth = async (provider: SocialAuthProvider) => {
    if (loadingProvider) return
    onError(null)
    setLoadingProvider(provider)
    try {
      await signInWithSocialProvider(provider)
      router.replace('/')
    } catch (error: any) {
      const message = error?.message || 'Social sign-in could not be completed.'
      onError(
        /provider.*(disabled|enabled|configured)|unsupported provider/i.test(message)
          ? `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not enabled by the app administrator yet.`
          : message
      )
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <View>
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => handleSocialAuth('google')}
        disabled={Boolean(loadingProvider)}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        <AppText variant="body" style={styles.googleIcon}>G</AppText>
        <AppText variant="bodySm" weight="medium">
          {loadingProvider === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => handleSocialAuth('apple')}
        disabled={Boolean(loadingProvider)}
        accessibilityRole="button"
        accessibilityLabel="Continue with Apple"
      >
        <AppText variant="body" style={styles.appleIcon}>●</AppText>
        <AppText variant="bodySm" weight="medium">
          {loadingProvider === 'apple' ? 'Connecting to Apple…' : 'Continue with Apple'}
        </AppText>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  socialButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: 12,
    marginBottom: 10,
  },
  googleIcon: { color: '#4285F4', fontWeight: 'bold' },
  appleIcon: { color: Colors.text, fontSize: 18, lineHeight: 18 },
})
