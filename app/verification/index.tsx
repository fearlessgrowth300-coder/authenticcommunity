import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  Users,
  Lock,
  ChevronRight,
} from 'lucide-react-native'

export default function VerificationLandingScreen() {
  const router = useRouter()

  const benefits = [
    {
      title: 'Higher Community Trust',
      desc: 'Connect with verified members who value authentic, accountable relationships.',
      icon: <ShieldCheck color={Colors.primary} size={22} />,
    },
    {
      title: 'Official Verified Badge',
      desc: 'Receive the prominent blue checkmark badge across your profile and messages.',
      icon: <BadgeCheck color={Colors.sage} size={22} />,
    },
    {
      title: 'Priority Match Discovery',
      desc: 'Verified members receive boosted visibility in local matching and community invites.',
      icon: <Users color={Colors.amber} size={22} />,
    },
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Get Verified
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Emblem Hero */}
        <View style={styles.heroSection}>
          <View style={styles.emblemCircle}>
            <BadgeCheck color={Colors.primary} size={48} strokeWidth={2} />
          </View>
          <AppText variant="h1" weight="bold" align="center">
            Verify Your Identity
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.heroSub}>
            Authentic is built on real people and real relationships. Verification takes less than 2 minutes.
          </AppText>
        </View>

        {/* Benefits Cards */}
        <View style={styles.benefitsList}>
          {benefits.map((b, idx) => (
            <Card key={idx} style={styles.benefitCard}>
              <View style={styles.benefitIconWrap}>{b.icon}</View>
              <View style={styles.benefitTextWrap}>
                <AppText variant="bodySm" weight="bold">
                  {b.title}
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary} style={styles.benefitDesc}>
                  {b.desc}
                </AppText>
              </View>
            </Card>
          ))}
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Lock color={Colors.textMuted} size={14} />
          <AppText variant="caption" color={Colors.textMuted} style={styles.privacyText}>
            Your ID details are encrypted and securely verified. They are never shared publicly.
          </AppText>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.bottomBar}>
        <AppButton
          title="Start Verification"
          onPress={() => router.push('/verification/country')}
          style={styles.startBtn}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  placeholder: {
    width: 30,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.xl,
  },
  heroSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  emblemCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  heroSub: {
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  benefitsList: {
    gap: 12,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 14,
  },
  benefitIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextWrap: {
    flex: 1,
    gap: 2,
  },
  benefitDesc: {
    lineHeight: 17,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startBtn: {
    width: '100%',
  },
})
