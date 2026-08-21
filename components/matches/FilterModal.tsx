import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  X,
  MapPin,
  User,
  Shield,
  Sparkles,
} from 'lucide-react-native'

export interface FilterState {
  distance: string
  ageRange: string
  selectedInterests: string[]
  selectedValues: string[]
  verifiedOnly: boolean
  minMatchScore: number
  discoveryArea: 'nearby' | 'country' | 'worldwide'
}

interface FilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: FilterState) => void
  currentFilters?: FilterState
}

const DISTANCE_OPTIONS = ['5 mi', '10 mi', '25 mi', '50 mi', '100+ mi']
const AGE_RANGE_OPTIONS = ['18-25', '22-40', '30-50', '40-60+']
const INTEREST_OPTIONS = [
  'Hiking',
  'Books',
  'Community',
  'Travel',
  'Yoga',
  'Music',
  'Art',
  'Tech',
]
const VALUE_OPTIONS = [
  'Kindness',
  'Growth',
  'Community',
  'Learning',
  'Creativity',
  'Honesty',
  'Faith',
  'Health',
]
const MATCH_SCORE_OPTIONS = [50, 70, 85, 90]
const DISCOVERY_AREAS: Array<{ value: FilterState['discoveryArea']; label: string }> = [
  { value: 'nearby', label: 'Nearby' },
  { value: 'country', label: 'My Country' },
  { value: 'worldwide', label: 'Worldwide' },
]

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [distance, setDistance] = useState(currentFilters?.distance || '25 mi')
  const [ageRange, setAgeRange] = useState(currentFilters?.ageRange || '22-40')
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentFilters?.selectedInterests || ['Community']
  )
  const [selectedValues, setSelectedValues] = useState<string[]>(
    currentFilters?.selectedValues || ['Kindness', 'Growth', 'Community']
  )
  const [verifiedOnly, setVerifiedOnly] = useState(
    currentFilters?.verifiedOnly ?? true
  )
  const [minMatchScore, setMinMatchScore] = useState(
    currentFilters?.minMatchScore || 70
  )
  const [discoveryArea, setDiscoveryArea] = useState<FilterState['discoveryArea']>(
    currentFilters?.discoveryArea || 'nearby'
  )

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
        ? [...prev, interest]
        : prev
    )
  }

  const toggleValue = (val: string) => {
    setSelectedValues((prev) =>
      prev.includes(val)
        ? prev.filter((v) => v !== val)
        : prev.length < 5
        ? [...prev, val]
        : prev
    )
  }

  const handleReset = () => {
    setDistance('25 mi')
    setAgeRange('22-40')
    setSelectedInterests([])
    setSelectedValues([])
    setVerifiedOnly(false)
    setMinMatchScore(50)
    setDiscoveryArea('nearby')
  }

  const handleApply = () => {
    onApply({
      distance,
      ageRange,
      selectedInterests,
      selectedValues,
      verifiedOnly,
      minMatchScore,
      discoveryArea,
    })
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={Colors.text} size={20} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold">
            Filter Matches
          </AppText>
          <TouchableOpacity onPress={handleReset}>
            <AppText variant="bodySm" weight="semibold" color={Colors.primary}>
              Reset
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. Distance */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <MapPin color={Colors.primary} size={16} />
                <AppText variant="label" weight="semibold">
                  Distance
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                Within {distance}
              </AppText>
            </View>

            <View style={styles.pillsRow}>
              {DISTANCE_OPTIONS.map((d) => {
                const isSelected = distance === d
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDistance(d)}
                    style={[
                      styles.pill,
                      isSelected ? styles.pillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                    >
                      {d}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 2. Age Range */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <User color={Colors.primary} size={16} />
                <AppText variant="label" weight="semibold">
                  Age Range
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {ageRange.replace('-', ' - ')}
              </AppText>
            </View>

            <View style={styles.pillsRow}>
              {AGE_RANGE_OPTIONS.map((a) => {
                const isSelected = ageRange === a
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() => setAgeRange(a)}
                    style={[
                      styles.pill,
                      isSelected ? styles.pillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                    >
                      {a}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 3. Interests */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="label" weight="semibold">
                Interests
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                Select up to 5
              </AppText>
            </View>

            <View style={styles.chipsWrap}>
              {INTEREST_OPTIONS.map((int) => {
                const isSelected = selectedInterests.includes(int)
                return (
                  <TouchableOpacity
                    key={int}
                    onPress={() => toggleInterest(int)}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.text}
                    >
                      {int}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 4. Values */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <AppText variant="label" weight="semibold">
                Values
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                Select up to 5
              </AppText>
            </View>

            <View style={styles.chipsWrap}>
              {VALUE_OPTIONS.map((val) => {
                const isSelected = selectedValues.includes(val)
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => toggleValue(val)}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.text}
                    >
                      {val}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 5. Verified Only Switch */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold">Discovery Area</AppText>
            <View style={styles.pillsRow}>
              {DISCOVERY_AREAS.map((item) => {
                const isSelected = discoveryArea === item.value
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => setDiscoveryArea(item.value)}
                    style={[styles.pill, isSelected ? styles.pillActive : null]}
                  >
                    <AppText variant="caption" weight={isSelected ? 'bold' : 'normal'} color={isSelected ? Colors.surface : Colors.textSecondary}>
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 6. Verified Only Switch */}
          <View style={styles.verifiedRow}>
            <View style={styles.verifiedLeft}>
              <Shield color={Colors.sage} size={20} />
              <View>
                <AppText variant="bodySm" weight="semibold">
                  Verified Only
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  Show only verified profiles
                </AppText>
              </View>
            </View>
            <Switch
              value={verifiedOnly}
              onValueChange={setVerifiedOnly}
              trackColor={{ false: Colors.border, true: Colors.sage }}
              thumbColor={Colors.surface}
            />
          </View>

          {/* 7. Minimum Match Score */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Sparkles color={Colors.primary} size={16} />
                <AppText variant="label" weight="semibold">
                  Minimum Match Score
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {minMatchScore}% or higher
              </AppText>
            </View>

            <View style={styles.pillsRow}>
              {MATCH_SCORE_OPTIONS.map((score) => {
                const isSelected = minMatchScore === score
                return (
                  <TouchableOpacity
                    key={score}
                    onPress={() => setMinMatchScore(score)}
                    style={[
                      styles.pill,
                      isSelected ? styles.pillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                    >
                      {score}%+
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Bottom Button */}
          <AppButton
            title="Apply Filters"
            onPress={handleApply}
            style={styles.applyButton}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  verifiedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  applyButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
})
