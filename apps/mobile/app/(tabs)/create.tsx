import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EmptyState } from '@/components/primitives/EmptyState'
import { PlusCircle } from 'lucide-react-native'

export default function CreateScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppText variant="h2" weight="bold" style={styles.title}>
          Create Hub
        </AppText>
        <EmptyState
          icon={<PlusCircle color={Colors.primary} size={48} />}
          title="Share Something"
          description="Create a post, share a story, start a community, or organize an event."
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
