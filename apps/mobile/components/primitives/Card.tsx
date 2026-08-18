import React from 'react'
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native'
import { Colors, Radii, Spacing } from '@/constants/theme'

export interface CardProps extends ViewProps {
  style?: ViewStyle
  children: React.ReactNode
  variant?: 'elevated' | 'outlined' | 'flat'
}

export function Card({ style, children, variant = 'elevated', ...props }: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined
      case 'flat':
        return styles.flat
      case 'elevated':
      default:
        return styles.elevated
    }
  }

  return (
    <View style={[styles.card, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  flat: {
    backgroundColor: Colors.surfaceSubtle,
  },
})
