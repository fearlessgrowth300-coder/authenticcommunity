import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Check,
  Sparkles,
  ShieldCheck,
  Heart,
} from 'lucide-react-native'

export default function SubscriptionScreen() {
  const router = useRouter()

  const perks = [
    'Verified Member Trust Badge',
    'Unlimited high-compatibility match discovery',
    'Host & organize unlimited community events',
    'Priority placement in local hub discovery',
    'Direct messaging anti-spam protection',
    'Ad-free, non-commercial community experience',
  ]

  const handleSubscribe = () => {
    Alert.alert(
      'Authentic Supporter',
      'Authentic Community is currently 100% free for all verified founding members! Thank you for being an early pillar of the community.',
      [{ text: 'Great!', style: 'default' }]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Supporter Status
        </AppText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.badgePill}>
            <Sparkles color="#FFFFFF" size={14} />
            <AppText variant="caption" weight="bold" color="#FFFFFF">
              FOUNDING MEMBER
            </AppText>
          </View>
          <AppText variant="h2" weight="bold" color="#FFFFFF" style={{ marginTop: 12 }}>
            Authentic Pioneer
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.85)" style={{ marginTop: 6, textAlign: 'center' }}>
            Enjoy complete access to all community hubs, matching algorithms, and verified event hosting.
          </AppText>
        </View>

        <Card style={styles.perksCard}>
          <AppText variant="bodySm" weight="bold" style={{ marginBottom: 12 }}>
            Included Member Privileges
          </AppText>

          {perks.map((perk, idx) => (
            <View key={idx} style={styles.perkRow}>
              <View style={styles.checkCircle}>
                <Check color="#FFFFFF" size={12} />
              </View>
              <AppText variant="bodySm" color={Colors.text} style={{ flex: 1 }}>
                {perk}
              </AppText>
            </View>
          ))}
        </Card>

        <AppButton
          title="Active Pioneer Membership (Free)"
          variant="primary"
          onPress={handleSubscribe}
          style={{ marginTop: 16 }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  perksCard: {
    padding: Spacing.md,
    gap: 12,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
