import React from 'react'
import { Text, TextProps, StyleSheet } from 'react-native'
import { Colors } from '@/constants/theme'

export interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption' | 'label'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: string
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify'
}

export function AppText({
  variant = 'body',
  weight = 'normal',
  color = Colors.text,
  align = 'left',
  style,
  children,
  ...props
}: AppTextProps) {
  const getFontSize = () => {
    switch (variant) {
      case 'h1': return 28
      case 'h2': return 22
      case 'h3': return 18
      case 'body': return 15
      case 'bodySm': return 13
      case 'caption': return 12
      case 'label': return 14
      default: return 15
    }
  }

  const getFontWeight = () => {
    switch (weight) {
      case 'bold': return '700'
      case 'semibold': return '600'
      case 'medium': return '500'
      case 'normal': return '400'
      default: return '400'
    }
  }

  const getLineHeight = () => {
    switch (variant) {
      case 'h1': return 34
      case 'h2': return 28
      case 'h3': return 24
      case 'body': return 22
      case 'bodySm': return 18
      case 'caption': return 16
      case 'label': return 20
      default: return 22
    }
  }

  return (
    <Text
      style={[
        {
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          lineHeight: getLineHeight(),
          color,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  )
}
