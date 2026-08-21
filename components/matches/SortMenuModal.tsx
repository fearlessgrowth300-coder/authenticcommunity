import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  Calendar,
  Users,
  MapPin,
  Zap,
  Heart,
  Check,
} from 'lucide-react-native'

export type SortOption =
  | 'newest'
  | 'best_match'
  | 'nearest'
  | 'most_active'
  | 'shared_values'

interface SortMenuModalProps {
  visible: boolean
  onClose: () => void
  selectedSort: SortOption
  onSelectSort: (sort: SortOption) => void
}

interface SortItem {
  key: SortOption
  label: string
  subtitle: string
  icon: React.ReactNode
}

const SORT_OPTIONS: SortItem[] = [
  {
    key: 'newest',
    label: 'Newest',
    subtitle: 'Recently joined',
    icon: <Calendar color={Colors.textSecondary} size={20} />,
  },
  {
    key: 'best_match',
    label: 'Best Match',
    subtitle: 'Highest match score',
    icon: <Users color={Colors.primary} size={20} />,
  },
  {
    key: 'nearest',
    label: 'Nearest',
    subtitle: 'Closest to you',
    icon: <MapPin color={Colors.textSecondary} size={20} />,
  },
  {
    key: 'most_active',
    label: 'Most Active',
    subtitle: 'Recently active',
    icon: <Zap color={Colors.textSecondary} size={20} />,
  },
  {
    key: 'shared_values',
    label: 'Shared Values',
    subtitle: 'Most aligned values',
    icon: <Heart color={Colors.textSecondary} size={20} />,
  },
]

export const SortMenuModal: React.FC<SortMenuModalProps> = ({
  visible,
  onClose,
  selectedSort,
  onSelectSort,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h3" weight="bold">
              Sort Matches By
            </AppText>
          </View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = selectedSort === opt.key
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => {
                    onSelectSort(opt.key)
                    onClose()
                  }}
                  style={styles.optionRow}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.iconBox}>{opt.icon}</View>
                    <View>
                      <AppText
                        variant="bodySm"
                        weight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? Colors.primary : Colors.text}
                      >
                        {opt.label}
                      </AppText>
                      <AppText variant="caption" color={Colors.textMuted}>
                        {opt.subtitle}
                      </AppText>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioCircleSelected : null,
                    ]}
                  >
                    {isSelected && (
                      <Check color={Colors.surface} size={12} strokeWidth={3} />
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionsList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
})
