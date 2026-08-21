import React from 'react'
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native'
import { Colors, Radii } from '@/constants/theme'
import { AppText } from './AppText'

export interface AppButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: any
  textStyle?: TextStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function AppButton({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  onPress,
  ...props
}: AppButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.border
    switch (variant) {
      case 'primary': return Colors.primary
      case 'secondary': return Colors.primaryLight
      case 'outline': return 'transparent'
      case 'ghost': return 'transparent'
      case 'danger': return Colors.danger
      default: return Colors.primary
    }
  }

  const getTextColor = () => {
    if (disabled) return Colors.textMuted
    switch (variant) {
      case 'primary': return Colors.surface
      case 'secondary': return Colors.primary
      case 'outline': return Colors.primary
      case 'ghost': return Colors.text
      case 'danger': return Colors.surface
      default: return Colors.surface
    }
  }

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: 8, paddingHorizontal: 12 }
      case 'lg': return { paddingVertical: 16, paddingHorizontal: 24 }
      case 'md':
      default:
        return { paddingVertical: 12, paddingHorizontal: 16 }
    }
  }

  const getBorder = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1.5,
        borderColor: disabled ? Colors.border : Colors.primary,
      }
    }
    return {}
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
          ...getBorder(),
        },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon}
          <AppText
            weight="semibold"
            color={getTextColor()}
            style={[
              size === 'sm' ? { fontSize: 13 } : size === 'lg' ? { fontSize: 16 } : { fontSize: 14 },
              textStyle,
            ]}
          >
            {title}
          </AppText>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
})
