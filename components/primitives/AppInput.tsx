import React, { forwardRef, useState } from 'react'
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native'
import { Colors, Radii, Spacing } from '@/constants/theme'
import { AppText } from './AppText'

export interface AppInputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  containerStyle?: ViewStyle
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const AppInput = forwardRef<any, AppInputProps>(
  (
    {
      label,
      error,
      hint,
      containerStyle,
      leftIcon,
      rightIcon,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <AppText variant="label" weight="medium" color={Colors.text} style={styles.label}>
            {label}
          </AppText>
        )}
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            Boolean(error) && styles.inputWrapperError,
          ]}
        >
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={Colors.textMuted}
            style={[styles.input, style]}
            onFocus={(e) => {
              setIsFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              onBlur?.(e)
            }}
            {...props}
          />
          {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
        </View>
        {error ? (
          <AppText variant="caption" color={Colors.danger} style={styles.helperText}>
            {error}
          </AppText>
        ) : hint ? (
          <AppText variant="caption" color={Colors.textSecondary} style={styles.helperText}>
            {hint}
          </AppText>
        ) : null}
      </View>
    )
  }
)

AppInput.displayName = 'AppInput'

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    paddingVertical: 10,
  },
  iconContainer: {
    marginHorizontal: 4,
  },
  helperText: {
    marginTop: 4,
  },
})
