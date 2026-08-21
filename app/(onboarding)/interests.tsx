import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/primitives/Card'
import { Check } from 'lucide-react-native'

interface InterestItem {
  id: string
  name: string
  icon: string
  color: string
}

const POPULAR_INTERESTS: InterestItem[] = [
  { id: 'design', name: 'Design', icon: '🎨', color: Colors.primary },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: Colors.primary },
  { id: 'fitness', name: 'Fitness', icon: '🏃', color: Colors.sage },
  { id: 'books', name: 'Books', icon: '📖', color: Colors.coral },
  { id: 'tech', name: 'Technology', icon: '💻', color: Colors.primary },
  { id: 'music', name: 'Music', icon: '🎵', color: Colors.coral },
  { id: 'travel', name: 'Travel', icon: '✈️', color: Colors.amber },
  { id: 'startups', name: 'Entrepreneurship', icon: '🚀', color: Colors.amber },
  { id: 'cooking', name: 'Cooking & Food', icon: '🍳', color: Colors.coral },
  { id: 'wellness', name: 'Yoga & Wellness', icon: '🧘', color: Colors.sage },
  { id: 'photo', name: 'Photography', icon: '📸', color: Colors.primary },
  { id: 'ai', name: 'AI & Innovation', icon: '🧠', color: Colors.primary },
]

const PROFICIENCY_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

export default function OnboardingInterestsScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Design',
    'Gaming',
    'Technology',
  ])
  const [selectedProficiency, setSelectedProficiency] = useState<string>('Intermediate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleInterest = (name: string) => {
    setSelectedInterests((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    )
  }

  const handleSave = async (skip: boolean = false) => {
    if (!user) {
      setError('Authentication required.')
      return
    }

    if (!skip && selectedInterests.length === 0) {
      setError('Please choose at least 1 interest to continue, or tap "Skip for now".')
      return
    }

    setError(null)
    setLoading(true)

    try {
      if (selectedInterests.length > 0) {
        // Clear previous interests and insert selected
        await supabase.from('user_interests').delete().eq('user_id', user.id)

        const rows = selectedInterests.map((name) => ({
          user_id: user.id,
          interest_name: name,
          interest_category: 'general',
        }))

        const { error: insertError } = await supabase
          .from('user_interests')
          .insert(rows)

        if (insertError) throw insertError
      }

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
        {/* Step Indicator Header (✓ ── 2 ── 3 ── 4) */}
        <StepIndicator currentStep={2} />

        {/* Title & Subtitle */}
        <View style={styles.header}>
          <AppText variant="h2" weight="bold" style={styles.title}>
            What are you into?
          </AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            Select your interests to find your people.
          </AppText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <AppText variant="caption" color={Colors.danger}>
              {error}
            </AppText>
          </View>
        )}

        {/* Popular Interests Grid */}
        <View style={styles.section}>
          <AppText variant="label" weight="medium" style={styles.sectionLabel}>
            Popular interests
          </AppText>
          <View style={styles.chipsContainer}>
            {POPULAR_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest.name)
              return (
                <TouchableOpacity
                  key={interest.id}
                  onPress={() => toggleInterest(interest.name)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipSelected : null,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <AppText variant="bodySm" style={styles.chipEmoji}>
                    {interest.icon}
                  </AppText>
                  <AppText
                    variant="bodySm"
                    weight={isSelected ? 'semibold' : 'normal'}
                    color={isSelected ? Colors.surface : Colors.text}
                  >
                    {interest.name}
                  </AppText>
                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check color={Colors.surface} size={14} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Proficiency Selector */}
        <View style={styles.section}>
          <AppText variant="label" weight="medium" style={styles.sectionLabel}>
            Your proficiency (optional)
          </AppText>
          <View style={styles.segmentedContainer}>
            {PROFICIENCY_OPTIONS.map((level) => {
              const isSelected = selectedProficiency === level
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => setSelectedProficiency(level)}
                  style={[
                    styles.segmentedButton,
                    isSelected ? styles.segmentedButtonActive : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    color={isSelected ? Colors.surface : Colors.textSecondary}
                  >
                    {level}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Continue Button */}
        <AppButton
          title="Continue"
          onPress={() => handleSave(false)}
          loading={loading}
          style={styles.continueButton}
        />

        {/* Skip For Now Link */}
        <TouchableOpacity
          onPress={() => handleSave(true)}
          style={styles.skipButton}
        >
          <AppText variant="bodySm" color={Colors.textSecondary} weight="medium">
            Skip for now
          </AppText>
        </TouchableOpacity>
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
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 2,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    marginRight: 6,
  },
  checkIcon: {
    marginLeft: 6,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  segmentedButtonActive: {
    backgroundColor: Colors.primary,
  },
  continueButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xl,
  },
})
