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
import { Check } from 'lucide-react-native'

interface ValueItem {
  id: string
  name: string
  icon: string
  activeColor: string
}

const VALUES_LIST: ValueItem[] = [
  { id: 'kindness', name: 'Kindness', icon: '💖', activeColor: Colors.primary },
  { id: 'growth', name: 'Growth', icon: '📈', activeColor: Colors.sage },
  { id: 'honesty', name: 'Honesty', icon: '🤝', activeColor: Colors.primary },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧', activeColor: Colors.amber },
  { id: 'creativity', name: 'Creativity', icon: '🎨', activeColor: Colors.coral },
  { id: 'community', name: 'Community', icon: '👥', activeColor: Colors.sage },
  { id: 'faith', name: 'Faith', icon: '⛪', activeColor: Colors.coral },
  { id: 'health', name: 'Health', icon: '🤍', activeColor: Colors.sage },
  { id: 'learning', name: 'Learning', icon: '💡', activeColor: Colors.amber },
]

const IMPORTANCE_OPTIONS = ['Somewhat', 'Important', 'Essential']

export default function OnboardingValuesScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Kindness',
    'Growth',
    'Community',
  ])
  const [importance, setImportance] = useState<string>('Important')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleValue = (name: string) => {
    setSelectedValues((prev) =>
      prev.includes(name)
        ? prev.filter((v) => v !== name)
        : [...prev, name]
    )
  }

  const handleSave = async (skip: boolean = false) => {
    if (!user) {
      setError('Authentication required.')
      return
    }

    if (!skip && selectedValues.length === 0) {
      setError('Please select at least 1 value that matters to you, or tap "Skip for now".')
      return
    }

    setError(null)
    setLoading(true)

    try {
      if (selectedValues.length > 0) {
        await supabase.from('user_values').delete().eq('user_id', user.id)

        const rows = selectedValues.map((name) => ({
          user_id: user.id,
          value_name: name,
        }))

        const { error: insertError } = await supabase
          .from('user_values')
          .insert(rows)

        if (insertError) throw insertError
      }

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
        {/* Step Indicator Header (✓ ── ✓ ── 3 ── 4) */}
        <StepIndicator currentStep={3} />

        {/* Title & Subtitle */}
        <View style={styles.header}>
          <AppText variant="h2" weight="bold" style={styles.title}>
            What matters most to you?
          </AppText>
          <AppText variant="body" color={Colors.textSecondary}>
            Choose the values that guide you.
          </AppText>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <AppText variant="caption" color={Colors.danger}>
              {error}
            </AppText>
          </View>
        )}

        {/* 2-Column Values Grid */}
        <View style={styles.valuesGrid}>
          {VALUES_LIST.map((item) => {
            const isSelected = selectedValues.includes(item.name)
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleValue(item.name)}
                style={[
                  styles.valueCard,
                  isSelected ? { borderColor: item.activeColor, backgroundColor: Colors.surface } : null,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.valueCardContent}>
                  <AppText variant="body" style={styles.valueEmoji}>
                    {item.icon}
                  </AppText>
                  <AppText
                    variant="bodySm"
                    weight={isSelected ? 'bold' : 'medium'}
                    color={Colors.text}
                    style={styles.valueName}
                  >
                    {item.name}
                  </AppText>
                </View>

                {isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: item.activeColor }]}>
                    <Check color={Colors.surface} size={12} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.uncheckCircle} />
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Importance Level */}
        <View style={styles.section}>
          <AppText variant="label" weight="medium" style={styles.sectionLabel}>
            How important are these values to you?
          </AppText>
          <View style={styles.segmentedContainer}>
            {IMPORTANCE_OPTIONS.map((opt) => {
              const isSelected = importance === opt
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setImportance(opt)}
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
                    {opt}
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
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  valueCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  valueCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  valueEmoji: {
    fontSize: 16,
  },
  valueName: {
    flex: 1,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
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
