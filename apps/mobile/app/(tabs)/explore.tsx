import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EmptyState } from '@/components/primitives/EmptyState'
import { Compass } from 'lucide-react-native'

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppText variant="h2" weight="bold" style={styles.title}>
          Explore
        </AppText>
        <EmptyState
          icon={<Compass color={Colors.primary} size={48} />}
          title="Explore People & Communities"
          description="Find authentic connections, browse local groups, and expand your community."
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
