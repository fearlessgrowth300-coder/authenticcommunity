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
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { Mail, ArrowLeft } from 'lucide-react-native'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (resetError) {
        setError(resetError.message)
      } else {
        setSent(true)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send recovery email.')
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} />
            <AppText variant="bodySm" weight="medium">
              Back
            </AppText>
          </TouchableOpacity>

          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Reset Password
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              Enter your email and we'll send you recovery instructions.
            </AppText>
          </View>

          <Card style={styles.card}>
            {sent ? (
              <View style={styles.successContainer}>
                <AppText variant="h3" weight="semibold" color={Colors.success} align="center">
                  Check your email
                </AppText>
                <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.successMessage}>
                  We have sent password reset instructions to {email}.
                </AppText>
                <AppButton
                  title="Back to Sign In"
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.submitButton}
                />
              </View>
            ) : (
              <>
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

                <AppButton
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={loading}
                  style={styles.submitButton}
                />
              </>
            )}
          </Card>
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
    padding: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
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
  submitButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  successMessage: {
    marginTop: 8,
    marginBottom: Spacing.lg,
  },
})
