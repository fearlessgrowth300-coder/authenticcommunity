import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from './AppText'
import { AppButton } from './AppButton'

export interface EmptyStateProps {
  title: string
  description?: string
  actionTitle?: string
  onAction?: () => void
  icon?: React.ReactNode
  style?: ViewStyle
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  icon,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <AppText variant="h3" weight="semibold" align="center" style={styles.title}>
        {title}
      </AppText>
      {description && (
        <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.description}>
          {description}
        </AppText>
      )}
      {actionTitle && onAction && (
        <AppButton
          title={actionTitle}
          onPress={onAction}
          style={styles.actionButton}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  actionButton: {
    minWidth: 160,
  },
})
