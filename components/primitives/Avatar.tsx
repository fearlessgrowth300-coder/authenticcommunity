import React from 'react'
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native'
import { Colors, Radii } from '@/constants/theme'
import { AppText } from './AppText'

export interface AvatarProps {
  url?: string | null
  name?: string | null
  size?: number
  style?: ViewStyle
}

export function Avatar({ url, name, size = 40, style }: AvatarProps) {
  const getInitials = (n?: string | null) => {
    if (!n) return '?'
    const parts = n.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  }

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.image, containerStyle as ImageStyle, style as ImageStyle]}
      />
    )
  }

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      <AppText
        weight="semibold"
        color={Colors.primary}
        style={{ fontSize: size * 0.4 }}
      >
        {getInitials(name)}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceSubtle,
  },
  fallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
