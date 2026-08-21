import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { X } from 'lucide-react-native'

export interface CommunityFilterState {
  categories: string[]
  distance: string
  groupSize: string
  activityLevel: string
  privacy: string
}

interface CommunityFilterModalProps {
  visible: boolean
  onClose: () => void
  onApply: (filters: CommunityFilterState) => void
  currentFilters?: CommunityFilterState
  resultCount?: number
}

const CATEGORIES = [
  'All',
  'Wellness',
  'Outdoors',
  'Learning',
  'Faith',
  'Arts & Culture',
  'Technology',
  'Food',
  'Community',
  'Music',
  'Business',
]

const DISTANCE_OPTIONS = ['Any distance', '10 mi', '25 mi', '50+ mi']
const GROUP_SIZES = ['Any Size', 'Small (1-25)', 'Medium (26-100)', 'Large (100+)']
const ACTIVITY_LEVELS = ['Any', 'Low-Key', 'Moderate', 'Very Active']
const PRIVACY_OPTIONS = ['All', 'Public', 'Private']

export const CommunityFilterModal: React.FC<CommunityFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters,
  resultCount = 42,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters?.categories || ['All']
  )
  const [distance, setDistance] = useState(
    currentFilters?.distance || 'Any distance'
  )
  const [groupSize, setGroupSize] = useState(
    currentFilters?.groupSize || 'Any Size'
  )
  const [activityLevel, setActivityLevel] = useState(
    currentFilters?.activityLevel || 'Any'
  )
  const [privacy, setPrivacy] = useState(
    currentFilters?.privacy || 'All'
  )

  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setSelectedCategories(['All'])
      return
    }
    const filtered = selectedCategories.filter((c) => c !== 'All')
    if (filtered.includes(cat)) {
      const next = filtered.filter((c) => c !== cat)
      setSelectedCategories(next.length === 0 ? ['All'] : next)
    } else {
      setSelectedCategories([...filtered, cat])
    }
  }

  const handleReset = () => {
    setSelectedCategories(['All'])
    setDistance('Any distance')
    setGroupSize('Any Size')
    setActivityLevel('Any')
    setPrivacy('All')
  }

  const handleApply = () => {
    onApply({
      categories: selectedCategories,
      distance,
      groupSize,
      activityLevel,
      privacy,
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={Colors.text} size={20} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold">
            Filter Communities
          </AppText>
          <TouchableOpacity onPress={handleReset}>
            <AppText variant="bodySm" weight="semibold" color={Colors.primary}>
              Reset
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. Category */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
              Category
            </AppText>
            <View style={styles.chipsWrap}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat)
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
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
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 2. Distance */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
              Distance
            </AppText>
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

          {/* 3. Group Size */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
              Group Size
            </AppText>
            <View style={styles.pillsRow}>
              {GROUP_SIZES.map((size) => {
                const isSelected = groupSize === size
                return (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setGroupSize(size)}
                    style={[
                      styles.pill,
                      isSelected ? styles.pillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                      numberOfLines={1}
                    >
                      {size}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 4. Activity Level */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
              Activity Level
            </AppText>
            <View style={styles.pillsRow}>
              {ACTIVITY_LEVELS.map((lvl) => {
                const isSelected = activityLevel === lvl
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setActivityLevel(lvl)}
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
                      {lvl}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* 5. Privacy */}
          <View style={styles.section}>
            <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
              Privacy
            </AppText>
            <View style={styles.pillsRow}>
              {PRIVACY_OPTIONS.map((priv) => {
                const isSelected = privacy === priv
                return (
                  <TouchableOpacity
                    key={priv}
                    onPress={() => setPrivacy(priv)}
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
                      {priv}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionsContainer}>
            <AppButton
              title={`Show Results (${resultCount})`}
              onPress={handleApply}
              style={styles.applyButton}
            />
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <AppText variant="bodySm" color={Colors.textSecondary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
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
  sectionTitle: {
    marginBottom: 2,
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
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
  actionsContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: 8,
  },
  applyButton: {
    width: '100%',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
})
