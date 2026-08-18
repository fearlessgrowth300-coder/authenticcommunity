import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { ValueChip } from '@/components/primitives/ValueChip'
import { Card } from '@/components/primitives/Card'

const AVAILABLE_VALUES = [
  'Authenticity & Honesty',
  'Kindness & Compassion',
  'Continuous Growth',
  'Curiosity & Learning',
  'Empathy & Listening',
  'Creativity & Expression',
  'Reliability & Trust',
  'Mindfulness & Presence',
  'Adventure & Openness',
  'Humor & Lightheartedness',
]

export default function OnboardingValuesScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleValue = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val)
        ? prev.filter((v) => v !== val)
        : [...prev, val]
    )
  }

  const handleNext = async () => {
    if (selectedValues.length < 2) {
      setError('Please choose at least 2 core values that matter most to you.')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 1. Clear existing values
      await supabase.from('user_values').delete().eq('user_id', user.id)

      // 2. Insert selected values
      const rows = selectedValues.map((name) => ({
        user_id: user.id,
        value_name: name,
      }))

      const { error: insertError } = await supabase
        .from('user_values')
        .insert(rows)

      if (insertError) throw insertError

      router.push('/(onboarding)/bio')
    } catch (err: any) {
      setError(err?.message || 'Failed to save values.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <AppText variant="caption" color={Colors.coral} weight="semibold">
            Step 3 of 4: Values
          </AppText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
        </View>

        <View style={styles.header}>
          <AppText variant="h2" weight="bold" style={styles.title}>
            What do you value most?
          </AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            Authentic Community matches people based on shared character and values, not just vanity metrics.
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

          <View style={styles.chipsContainer}>
            {AVAILABLE_VALUES.map((val) => {
              const selected = selectedValues.includes(val)
              return (
                <ValueChip
                  key={val}
                  label={val}
                  selected={selected}
                  onPress={() => toggleValue(val)}
                />
              )
            })}
          </View>

          <AppButton
            title={`Continue (${selectedValues.length} selected)`}
            variant="primary"
            onPress={handleNext}
            loading={loading}
            style={styles.submitButton}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.coral,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
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
