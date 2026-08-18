import React from 'react'
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from './AppText'

export interface LoadingStateProps {
  message?: string
  style?: ViewStyle
}

export function LoadingState({ message = 'Loading...', style }: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message ? (
        <AppText variant="bodySm" color={Colors.textSecondary} style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  message: {
    marginTop: Spacing.md,
  },
})
