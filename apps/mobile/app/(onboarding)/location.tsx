import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { MapPin, Globe } from 'lucide-react-native'

export default function OnboardingLocationScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [city, setCity] = useState(profile?.location_city || '')
  const [state, setState] = useState(profile?.location_state || '')
  const [country, setCountry] = useState(profile?.location_country || 'United States')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNext = async () => {
    if (!city.trim() || !country.trim()) {
      setError('Please provide your city and country to discover local connections.')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          location_city: city.trim(),
          location_state: state.trim() || null,
          location_country: country.trim(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (updateError) throw updateError

      await refreshProfile()
      router.push('/(onboarding)/interests')
    } catch (err: any) {
      setError(err?.message || 'Failed to save location.')
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <AppText variant="caption" color={Colors.primary} weight="semibold">
              Step 1 of 4: Location
            </AppText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
          </View>

          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Where are you based?
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              We prioritize showing you people, events, and communities nearby.
            </AppText>
          </View>

          <Card style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.danger}>
                  {error}
                </AppText>
              </View>
            )}

            <AppInput
              label="City"
              placeholder="e.g. Austin, Lagos, Toronto"
              value={city}
              onChangeText={setCity}
              leftIcon={<MapPin color={Colors.textMuted} size={18} />}
            />

            <AppInput
              label="State / Province (Optional)"
              placeholder="e.g. Texas, Ontario"
              value={state}
              onChangeText={setState}
            />

            <AppInput
              label="Country"
              placeholder="e.g. United States, Canada, Nigeria"
              value={country}
              onChangeText={setCountry}
              leftIcon={<Globe color={Colors.textMuted} size={18} />}
            />

            <AppButton
              title="Continue"
              onPress={handleNext}
              loading={loading}
              style={styles.submitButton}
            />
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
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
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
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: 8,
  },
})
