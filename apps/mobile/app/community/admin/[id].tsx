import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  ArrowLeft,
  Users,
  Shield,
  Hash,
  FileText,
  Bell,
  Flag,
  VolumeX,
  Ban,
  Calendar,
  Settings,
  ChevronRight,
} from 'lucide-react-native'

export default function CommunityAdminScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const adminSections = [
    { id: 'requests', label: 'Join Requests', badge: '3', icon: <Users color={Colors.primary} size={20} /> },
    { id: 'members', label: 'Members & Roles', icon: <Shield color={Colors.sage} size={20} /> },
    { id: 'channels', label: 'Channels', badge: '6', icon: <Hash color={Colors.amber} size={20} /> },
    { id: 'rules', label: 'Community Rules', icon: <FileText color={Colors.primary} size={20} /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell color={Colors.coral} size={20} /> },
    { id: 'reports', label: 'Reports & Flagged Content', badge: '1', icon: <Flag color={Colors.coral} size={20} /> },
    { id: 'muted', label: 'Muted Users', icon: <VolumeX color={Colors.textSecondary} size={20} /> },
    { id: 'banned', label: 'Banned Users', icon: <Ban color="#DC2626" size={20} /> },
    { id: 'events', label: 'Community Events', icon: <Calendar color={Colors.amber} size={20} /> },
    { id: 'settings', label: 'General Settings', icon: <Settings color={Colors.textSecondary} size={20} /> },
  ]

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Community Admin
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText variant="caption" color={Colors.textSecondary} style={styles.subText}>
          Manage members, channel permissions, rules, and moderation settings for Lagos Creators & Builders.
        </AppText>

        <View style={styles.menuContainer}>
          {adminSections.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={styles.iconCircle}>{item.icon}</View>
                <AppText variant="bodySm" weight="medium">
                  {item.label}
                </AppText>
              </View>

              <View style={styles.menuRight}>
                {item.badge && (
                  <View style={styles.badge}>
                    <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.badgeText}>
                      {item.badge}
                    </AppText>
                  </View>
                )}
                <ChevronRight color={Colors.textMuted} size={18} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    gap: Spacing.md,
  },
  subText: {
    lineHeight: 18,
    marginBottom: Spacing.xs,
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
    paddingHorizontal: 14,
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
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 10,
  },
})
