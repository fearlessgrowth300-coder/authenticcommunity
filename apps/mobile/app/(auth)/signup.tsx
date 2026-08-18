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
import { Mail, Lock, User } from 'lucide-react-native'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async () => {
    if (!firstName.trim() || !email.trim() || !password) {
      setError('Please fill in your first name, email, and password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: signUpError } = await signUp(email, password, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
      })

      if (signUpError) {
        setError(signUpError.message)
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
            <AppText variant="h1" weight="bold" color={Colors.primary} align="center">
              🌟 Authentic
            </AppText>
            <AppText variant="h2" weight="bold" align="center" style={styles.title}>
              Create your account
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} align="center">
              Join people seeking genuine connection
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

            <View style={styles.row}>
              <View style={styles.col}>
                <AppInput
                  label="First Name"
                  placeholder="Alex"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<User color={Colors.textMuted} size={18} />}
                />
              </View>
              <View style={styles.col}>
                <AppInput
                  label="Last Name"
                  placeholder="Taylor"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

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
              placeholder="At least 6 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock color={Colors.textMuted} size={18} />}
            />

            <AppButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              style={styles.submitButton}
            />
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
    alignItems: 'center',
  },
  title: {
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  col: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
