import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Radii } from '@/constants/theme'
import { AppText } from './AppText'

export interface BadgeProps {
  label: string
  variant?: 'primary' | 'coral' | 'sage' | 'amber' | 'neutral'
  size?: 'sm' | 'md'
  style?: ViewStyle
}

export function Badge({ label, variant = 'primary', size = 'md', style }: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'coral':
        return { bg: Colors.coralLight, text: Colors.coral }
      case 'sage':
        return { bg: Colors.sageLight, text: Colors.sage }
      case 'amber':
        return { bg: Colors.amberLight, text: Colors.amber }
      case 'neutral':
        return { bg: Colors.surfaceSubtle, text: Colors.textSecondary }
      case 'primary':
      default:
        return { bg: Colors.primaryLight, text: Colors.primary }
    }
  }

  const { bg, text } = getColors()

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          paddingVertical: size === 'sm' ? 2 : 4,
          paddingHorizontal: size === 'sm' ? 6 : 10,
        },
        style,
      ]}
    >
      <AppText
        weight="medium"
        color={text}
        style={{ fontSize: size === 'sm' ? 11 : 12 }}
      >
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radii.full,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
