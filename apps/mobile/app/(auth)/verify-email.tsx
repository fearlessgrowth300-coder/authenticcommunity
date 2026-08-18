import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react-native'

export default function VerifyEmailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email?: string }>()
  const email = params?.email || ''
  const { verifyOtp, resendOtp, isOnboarded } = useAuth()

  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<any>(null)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Focus input automatically on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus?.()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const handleVerify = async () => {
    const cleanOtp = otp.trim()
    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    if (!email) {
      setError('Missing email address. Please return to signup.')
      return
    }

    setError(null)
    setResendSuccess(null)
    setVerifying(true)

    try {
      const { error: verifyError } = await verifyOtp(email, cleanOtp)

      if (verifyError) {
        const msg = verifyError.message?.toLowerCase() || ''
        if (msg.includes('expired') || msg.includes('token has expired')) {
          setError('This code has expired. Please tap "Resend Code" to get a new one.')
        } else if (msg.includes('invalid') || msg.includes('token is invalid') || msg.includes('incorrect')) {
          setError('The code is incorrect. Check your email and try again.')
        } else if (msg.includes('rate limit') || msg.includes('too many')) {
          setError('Too many attempts. Please wait a moment before trying again.')
        } else {
          setError('Verification failed. Check the code and try again.')
        }
        return
      }

      // Successful verification! Route to onboarding or tabs
      if (isOnboarded) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(onboarding)/location')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return

    setError(null)
    setResending(true)

    try {
      const { error: resendError } = await resendOtp(email)
      if (resendError) {
        setError('Failed to resend code. Please wait a moment and try again.')
      } else {
        setResendSuccess('A new 6-digit code has been sent to your email.')
        setResendCooldown(60)
        setOtp('')
      }
    } catch {
      setError('Failed to resend verification email.')
    } finally {
      setResending(false)
    }
  }

  const handleOtpChange = (text: string) => {
    // Only accept numeric digits up to 6 characters
    const numericOnly = text.replace(/[^0-9]/g, '').slice(0, 6)
    setOtp(numericOnly)
    setError(null)
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
          {/* Back Navigation */}
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/signup')}
            style={styles.backButton}
          >
            <ArrowLeft color={Colors.text} size={20} />
            <AppText variant="bodySm" weight="medium">
              Change email
            </AppText>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Mail color={Colors.primary} size={32} />
            </View>
            <AppText variant="h2" weight="bold" align="center" style={styles.title}>
              Check your email
            </AppText>
            <AppText variant="body" color={Colors.textSecondary} align="center" style={styles.subtitle}>
              We sent a 6-digit verification code to:
            </AppText>
            <AppText variant="body" weight="semibold" color={Colors.primary} align="center" style={styles.emailText}>
              {email || 'your email'}
            </AppText>
          </View>

          {/* Card */}
          <Card style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.danger} align="center">
                  {error}
                </AppText>
              </View>
            )}

            {resendSuccess && (
              <View style={styles.successBanner}>
                <AppText variant="caption" color={Colors.success} align="center">
                  {resendSuccess}
                </AppText>
              </View>
            )}

            {/* Hidden actual TextInput with custom visual digit boxes */}
            <View style={styles.otpInputContainer}>
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenInput}
                accessibilityLabel="6-digit verification code"
              />

              {/* 6 Visual Digit Cells */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus?.()}
                style={styles.digitsRow}
              >
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = otp[index] || ''
                  const isCurrent = index === otp.length || (index === 5 && otp.length === 6)
                  return (
                    <View
                      key={index}
                      style={[
                        styles.digitCell,
                        digit ? styles.digitCellFilled : null,
                        isCurrent && !digit ? styles.digitCellFocused : null,
                      ]}
                    >
                      <AppText
                        variant="h2"
                        weight="bold"
                        color={digit ? Colors.text : Colors.textMuted}
                        align="center"
                      >
                        {digit || (isCurrent ? '|' : '•')}
                      </AppText>
                    </View>
                  )
                })}
              </TouchableOpacity>
            </View>

            <AppButton
              title="Verify Email"
              onPress={handleVerify}
              loading={verifying}
              disabled={otp.length !== 6 || verifying}
              style={styles.submitButton}
            />

            {/* Resend Action */}
            <View style={styles.resendSection}>
              <TouchableOpacity
                disabled={resendCooldown > 0 || resending}
                onPress={handleResend}
                style={styles.resendButton}
              >
                <RefreshCw
                  color={resendCooldown > 0 ? Colors.textMuted : Colors.primary}
                  size={16}
                />
                <AppText
                  variant="bodySm"
                  weight="medium"
                  color={resendCooldown > 0 ? Colors.textMuted : Colors.primary}
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Resend Code'}
                </AppText>
              </TouchableOpacity>
            </View>
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
    marginBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    marginBottom: 2,
  },
  emailText: {
    marginTop: 2,
  },
  card: {
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.lg,
  },
  successBanner: {
    backgroundColor: Colors.sageLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.lg,
  },
  otpInputContainer: {
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  digitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  digitCell: {
    flex: 1,
    height: 54,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitCellFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  digitCellFocused: {
    borderColor: Colors.primary,
  },
  submitButton: {
    marginBottom: Spacing.md,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
})
