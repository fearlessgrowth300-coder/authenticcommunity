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
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  ArrowLeft,
  UserRound,
  Shield,
  SlidersHorizontal,
  Bell,
  Palette,
  BadgeCheck,
  Crown,
  CircleHelp,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react-native'

export default function SettingsHomeScreen() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of Authentic Community?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const handleOpenHelp = () => {
    Alert.alert(
      'Help & Support',
      'For assistance, feedback, or to report safety concerns, email our community team at support@authenticcommunity.fun.',
      [{ text: 'OK' }]
    )
  }

  const handleOpenAbout = () => {
    Alert.alert(
      'Authentic Community',
      'Version 1.0.0\n\nA mobile-first platform dedicated to real human connection, local hubs, and verified trust.',
      [{ text: 'Close' }]
    )
  }

  const handleOpenAppearance = () => {
    Alert.alert(
      'Appearance',
      'Authentic Community matches your device system theme (Light / Dark mode).',
      [{ text: 'OK' }]
    )
  }

  const settingsSections: {
    id: string
    title: string
    icon: React.ReactNode
    onPress: () => void
  }[] = [
    {
      id: 'account',
      title: 'Account',
      icon: <UserRound color={Colors.primary} size={20} />,
      onPress: () => router.push('/settings/account'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: <Shield color={Colors.sage} size={20} />,
      onPress: () => router.push('/settings/privacy'),
    },
    {
      id: 'content_discovery',
      title: 'Content & Discovery',
      icon: <SlidersHorizontal color={Colors.amber} size={20} />,
      onPress: () => router.push('/settings/content-discovery'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell color={Colors.coral} size={20} />,
      onPress: () => router.push('/settings/notifications'),
    },
    {
      id: 'subscription',
      title: 'Supporter & Tier Status',
      icon: <Crown color={Colors.amber} size={20} />,
      onPress: () => router.push('/settings/subscription'),
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      icon: <BadgeCheck color={Colors.primary} size={20} />,
      onPress: () => router.push('/verification'),
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette color={Colors.textSecondary} size={20} />,
      onPress: handleOpenAppearance,
    },
    {
      id: 'support',
      title: 'Support & Help Center',
      icon: <CircleHelp color={Colors.textSecondary} size={20} />,
      onPress: handleOpenHelp,
    },
    {
      id: 'about',
      title: 'About Authentic',
      icon: <Info color={Colors.textSecondary} size={20} />,
      onPress: handleOpenAbout,
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
          Settings
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {settingsSections.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={item.onPress}
              style={styles.menuRow}
            >
              <View style={styles.menuLeft}>
                <View style={styles.iconCircle}>{item.icon}</View>
                <AppText variant="bodySm" weight="medium">
                  {item.title}
                </AppText>
              </View>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log Out Button */}
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutRow}>
          <LogOut color="#DC2626" size={20} />
          <AppText variant="bodySm" weight="bold" color="#DC2626">
            Log Out
          </AppText>
        </TouchableOpacity>
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
  backBtn: {
    padding: 6,
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    marginTop: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
})
