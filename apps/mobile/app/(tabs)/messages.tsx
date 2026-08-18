import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EmptyState } from '@/components/primitives/EmptyState'
import { MessageCircle } from 'lucide-react-native'

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppText variant="h2" weight="bold" style={styles.title}>
          Messages
        </AppText>
        <EmptyState
          icon={<MessageCircle color={Colors.primary} size={48} />}
          title="Direct & Community Chat"
          description="Send messages, participate in channel discussions, and connect directly with your network."
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
