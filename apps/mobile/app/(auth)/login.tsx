import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { Mail, Lock } from 'lucide-react-native'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        setError(signInError.message)
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h1" weight="bold" color={Colors.primary} align="center">
              🌟 Authentic
            </AppText>
            <AppText variant="h2" weight="bold" align="center" style={styles.title}>
              Welcome back
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} align="center">
              Sign in to your community
            </AppText>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.danger}>
                  {error}
                </AppText>
              </View>
            )}

            <AppInput
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail color={Colors.textMuted} size={18} />}
            />

            <AppInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock color={Colors.textMuted} size={18} />}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <AppText variant="caption" color={Colors.primary} weight="medium">
                Forgot password?
              </AppText>
            </TouchableOpacity>

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <AppText variant="bodySm" color={Colors.textSecondary}>
              Don't have an account?{' '}
            </AppText>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <AppText variant="bodySm" color={Colors.primary} weight="semibold">
                Sign Up
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  submitButton: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
