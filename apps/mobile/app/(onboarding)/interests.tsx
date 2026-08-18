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
import { InterestChip } from '@/components/primitives/InterestChip'
import { Card } from '@/components/primitives/Card'

const AVAILABLE_INTERESTS = [
  'Hiking & Outdoors',
  'Coding & Tech',
  'Startups & Business',
  'Yoga & Mindfulness',
  'Photography & Art',
  'Books & Reading',
  'Fitness & Running',
  'Music & Concerts',
  'Cooking & Food',
  'Travel & Exploring',
  'AI & Innovation',
  'Philosophy & Discussion',
]

export default function OnboardingInterestsScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = async () => {
    if (selectedInterests.length < 3) {
      setError('Please choose at least 3 interests to help us match you with relevant communities.')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      // 1. Clear existing interests
      await supabase.from('user_interests').delete().eq('user_id', user.id)

      // 2. Insert selected interests
      const rows = selectedInterests.map((name) => ({
        user_id: user.id,
        interest_name: name,
        interest_category: 'general',
      }))

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(rows)

      if (insertError) throw insertError

      router.push('/(onboarding)/values')
    } catch (err: any) {
      setError(err?.message || 'Failed to save interests.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <AppText variant="caption" color={Colors.primary} weight="semibold">
            Step 2 of 4: Interests
          </AppText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>

        <View style={styles.header}>
          <AppText variant="h2" weight="bold" style={styles.title}>
            What are your passions?
          </AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            Pick at least 3 topics you love discussing or doing.
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
            {AVAILABLE_INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest)
              return (
                <InterestChip
                  key={interest}
                  label={interest}
                  selected={selected}
                  onPress={() => toggleInterest(interest)}
                />
              )
            })}
          </View>

          <AppButton
            title={`Continue (${selectedInterests.length} selected)`}
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
