import React from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Radii } from '@/constants/theme'
import { AppText } from './AppText'

export interface InterestChipProps {
  label: string
  selected?: boolean
  onPress?: () => void
  style?: ViewStyle
}

export function InterestChip({ label, selected = false, onPress, style }: InterestChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
        style,
      ]}
    >
      <AppText
        weight={selected ? 'semibold' : 'normal'}
        color={selected ? Colors.primary : Colors.text}
        style={{ fontSize: 13 }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radii.full,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  unselectedChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  selectedChip: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
})
