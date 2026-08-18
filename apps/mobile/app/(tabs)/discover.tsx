import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EmptyState } from '@/components/primitives/EmptyState'
import { Compass } from 'lucide-react-native'

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppText variant="h2" weight="bold" style={styles.title}>
          Discover
        </AppText>
        <EmptyState
          icon={<Compass color={Colors.primary} size={48} />}
          title="Discovery Feed"
          description="Explore people, communities, and events nearby matched to your values and passions."
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.lg,
  },
})
