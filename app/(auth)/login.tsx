import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email.trim(), password)
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
            <AppText variant="h1" weight="bold" style={styles.title}>
              Welcome back
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              Good to see you again.
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

            <View style={styles.passwordContainer}>
              <AppInput
                label="Password"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                leftIcon={<Lock color={Colors.textMuted} size={18} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff color={Colors.textMuted} size={18} />
                    ) : (
                      <Eye color={Colors.textMuted} size={18} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>

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

            {/* Social Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <AppText variant="caption" color={Colors.textMuted} style={styles.dividerText}>
                or continue with
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <SocialAuthButtons onError={setError} />
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
  },
  title: {
    marginBottom: 4,
  },
  card: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -4,
  },
  submitButton: {
    marginBottom: Spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
})
