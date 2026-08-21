import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
    await signOut()
    router.replace('/(auth)/login')
  }

  const settingsSections = [
    {
      id: 'account',
      title: 'Account',
      icon: <UserRound color={Colors.primary} size={20} />,
      route: '/settings/account',
    },
    {
      id: 'privacy',
      title: 'Privacy & Safety',
      icon: <Shield color={Colors.sage} size={20} />,
      route: '/settings/privacy',
    },
    {
      id: 'content_discovery',
      title: 'Content & Discovery',
      icon: <SlidersHorizontal color={Colors.amber} size={20} />,
      route: '/settings/content-discovery',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell color={Colors.coral} size={20} />,
      route: '/settings/notifications',
    },
    {
      id: 'verification',
      title: 'Identity Verification',
      icon: <BadgeCheck color={Colors.primary} size={20} />,
      route: '/verification',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Palette color={Colors.textSecondary} size={20} />,
      route: '/settings/appearance',
    },
    {
      id: 'support',
      title: 'Support & Help Center',
      icon: <CircleHelp color={Colors.textSecondary} size={20} />,
      route: '/settings/support',
    },
    {
      id: 'about',
      title: 'About Authentic',
      icon: <Info color={Colors.textSecondary} size={20} />,
      route: '/settings/about',
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuContainer}>
          {settingsSections.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(item.route as any)}
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

        {/* Log Out Action */}
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutRow}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconCircle, styles.logoutCircle]}>
              <LogOut color="#DC2626" size={18} />
            </View>
            <AppText variant="bodySm" weight="bold" color="#DC2626">
              Log Out
            </AppText>
          </View>
        </TouchableOpacity>

        <AppText variant="caption" color={Colors.textMuted} align="center" style={styles.versionText}>
          Authentic Community Connection v2.0.0 (Build 2026)
        </AppText>
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
    gap: Spacing.lg,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  logoutCircle: {
    backgroundColor: '#FEF2F2',
  },
  versionText: {
    marginTop: Spacing.md,
  },
})
