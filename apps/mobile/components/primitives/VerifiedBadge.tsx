import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/theme'
import { Check } from 'lucide-react-native'

export interface VerifiedBadgeProps {
  size?: number
  style?: ViewStyle
}

export function VerifiedBadge({ size = 16, style }: VerifiedBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Check color={Colors.surface} size={size * 0.65} strokeWidth={3} />
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
