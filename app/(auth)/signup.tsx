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
import { Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react-native'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password rules validation
  const hasMinLength = password.length >= 8
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in your name, email, and password.')
      return
    }

    if (!hasMinLength) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || fullName.trim()
      const lastName = nameParts.slice(1).join(' ') || undefined

      const { error: signUpError, session: newSession, user: newUser } = await signUp(
        email.trim(),
        password,
        {
          firstName,
          lastName,
        }
      )

      if (signUpError) {
        setError(signUpError.message)
      } else if (newSession) {
        router.replace('/')
      } else if (newUser) {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: email.trim() },
        })
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.')
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
              Create your account
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              Let's get you started.
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
              label="Full name"
              placeholder="Jane Doe"
              value={fullName}
              onChangeText={setFullName}
              leftIcon={<User color={Colors.textMuted} size={18} />}
            />

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
                placeholder="Create a strong password"
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

            {/* Password Validation Checklist */}
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <View
                  style={[
                    styles.checkBadge,
                    hasMinLength ? styles.checkBadgeActive : null,
                  ]}
                >
                  <Check
                    color={hasMinLength ? Colors.surface : Colors.textMuted}
                    size={10}
                    strokeWidth={3}
                  />
                </View>
                <AppText
                  variant="caption"
                  color={hasMinLength ? Colors.text : Colors.textMuted}
                >
                  At least 8 characters
                </AppText>
              </View>

              <View style={styles.checkItem}>
                <View
                  style={[
                    styles.checkBadge,
                    hasNumber ? styles.checkBadgeActive : null,
                  ]}
                >
                  <Check
                    color={hasNumber ? Colors.surface : Colors.textMuted}
                    size={10}
                    strokeWidth={3}
                  />
                </View>
                <AppText
                  variant="caption"
                  color={hasNumber ? Colors.text : Colors.textMuted}
                >
                  One number
                </AppText>
              </View>

              <View style={styles.checkItem}>
                <View
                  style={[
                    styles.checkBadge,
                    hasSpecial ? styles.checkBadgeActive : null,
                  ]}
                >
                  <Check
                    color={hasSpecial ? Colors.surface : Colors.textMuted}
                    size={10}
                    strokeWidth={3}
                  />
                </View>
                <AppText
                  variant="caption"
                  color={hasSpecial ? Colors.text : Colors.textMuted}
                >
                  One special character
                </AppText>
              </View>
            </View>

            <AppButton
              title="Create my account"
              onPress={handleSignup}
              loading={loading}
              style={styles.submitButton}
            />

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
              Already have an account?{' '}
            </AppText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <AppText variant="bodySm" color={Colors.primary} weight="semibold">
                Sign In
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
  checklist: {
    marginVertical: Spacing.md,
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeActive: {
    backgroundColor: Colors.sage,
  },
  submitButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
})
