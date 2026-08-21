import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  BadgeCheck,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native'

export default function VerificationResultScreen() {
  const router = useRouter()

  const handleFinish = () => {
    router.replace('/(tabs)/profile')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successCircle}>
          <BadgeCheck color={Colors.sage} size={64} strokeWidth={2} />
        </View>

        <AppText variant="h1" weight="bold" align="center">
          Identity Verified!
        </AppText>

        <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.subText}>
          Congratulations! Your official verification badge is now active across your profile, matching feed, and community messages.
        </AppText>

        <Card style={styles.badgeSummaryCard}>
          <View style={styles.badgeSummaryRow}>
            <ShieldCheck color={Colors.primary} size={22} />
            <View style={styles.badgeSummaryText}>
              <AppText variant="bodySm" weight="bold">
                Authentic Verified Member
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Verified on {new Date().toLocaleDateString()}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.bottomBar}>
        <AppButton
          title="Back to My Profile"
          onPress={handleFinish}
          style={styles.finishBtn}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  subText: {
    lineHeight: 21,
    paddingHorizontal: Spacing.md,
  },
  badgeSummaryCard: {
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    marginTop: Spacing.lg,
    width: '100%',
  },
  badgeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeSummaryText: {
    flex: 1,
    gap: 2,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  finishBtn: {
    width: '100%',
  },
})
