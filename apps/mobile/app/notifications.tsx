import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  ArrowLeft,
  Settings,
  Heart,
  Calendar,
  MessageCircle,
  Users,
  Compass,
  Sparkles,
} from 'lucide-react-native'

const FILTER_TABS = ['All', 'Messages', 'Connections', 'Communities', 'Events']

interface NotificationItem {
  id: string
  type: 'like' | 'event' | 'message' | 'match' | 'invite' | 'reaction' | 'post' | 'reminder'
  category: 'Messages' | 'Connections' | 'Communities' | 'Events'
  avatarUrl?: string
  iconType?: 'community' | 'event' | 'matches' | 'post' | 'invite'
  title: string
  body?: string
  time: string
  isToday: boolean
  isHeart?: boolean
}

const NOTIFICATIONS: NotificationItem[] = [
  // Today
  {
    id: '1',
    type: 'like',
    category: 'Connections',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    title: 'Sophie Martin',
    body: 'liked your profile.',
    time: '2m',
    isToday: true,
    isHeart: true,
  },
  {
    id: '2',
    type: 'event',
    category: 'Events',
    iconType: 'community',
    title: 'Austin Hikers',
    body: 'New event posted: Sunrise Hike',
    time: '1h',
    isToday: true,
  },
  {
    id: '3',
    type: 'message',
    category: 'Messages',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    title: 'Maya Patel',
    body: 'sent you a message.',
    time: '2h',
    isToday: true,
  },
  {
    id: '4',
    type: 'match',
    category: 'Connections',
    iconType: 'matches',
    title: 'You have 3 new matches!',
    body: 'Check them out and start a conversation.',
    time: '3h',
    isToday: true,
  },

  // Earlier
  {
    id: '5',
    type: 'invite',
    category: 'Communities',
    iconType: 'invite',
    title: 'Wellness Together',
    body: 'Sarah invited you to join the community.',
    time: '1d',
    isToday: false,
  },
  {
    id: '6',
    type: 'reaction',
    category: 'Messages',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    title: 'David Chen',
    body: 'reacted to your message.',
    time: '1d',
    isToday: false,
    isHeart: true,
  },
  {
    id: '7',
    type: 'post',
    category: 'Communities',
    iconType: 'post',
    title: 'Community Update',
    body: 'Photography Lovers has a new post.',
    time: '2d',
    isToday: false,
  },
  {
    id: '8',
    type: 'reminder',
    category: 'Events',
    iconType: 'event',
    title: 'Event Reminder',
    body: 'You have an upcoming event tomorrow.',
    time: '2d',
    isToday: false,
  },
]

export default function NotificationsScreen() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredItems = NOTIFICATIONS.filter((item) => {
    if (activeFilter === 'All') return true
    return item.category === activeFilter
  })

  const todayItems = filteredItems.filter((item) => item.isToday)
  const earlierItems = filteredItems.filter((item) => !item.isToday)

  const renderIconBadge = (iconType?: string) => {
    switch (iconType) {
      case 'community':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#EEF2FF' }]}>
            <Users color={Colors.primary} size={18} />
          </View>
        )
      case 'event':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#E0F2FE' }]}>
            <Calendar color="#0284C7" size={18} />
          </View>
        )
      case 'matches':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#F3E8FF' }]}>
            <Sparkles color="#9333EA" size={18} />
          </View>
        )
      case 'invite':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#DCFCE7' }]}>
            <Users color="#16A34A" size={18} />
          </View>
        )
      case 'post':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Compass color="#D97706" size={18} />
          </View>
        )
      default:
        return (
          <View style={[styles.iconBadge, { backgroundColor: Colors.primaryLight }]}>
            <MessageCircle color={Colors.primary} size={18} />
          </View>
        )
    }
  }

  const renderItem = (item: NotificationItem) => (
    <View key={item.id} style={styles.notificationRow}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        renderIconBadge(item.iconType)
      )}

      <View style={styles.contentContainer}>
        <AppText variant="bodySm" style={styles.titleText}>
          <AppText variant="bodySm" weight="bold">
            {item.title}{' '}
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary}>
            {item.body}
          </AppText>
        </AppText>
      </View>

      <View style={styles.rightContainer}>
        <AppText variant="caption" color={Colors.textMuted}>
          {item.time}
        </AppText>
        {item.isHeart && (
          <Heart color="#EF4444" fill="#EF4444" size={12} style={styles.heartIcon} />
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h2" weight="bold" style={styles.headerTitle}>
          Notifications
        </AppText>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveFilter(tab)}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillActive : null,
                ]}
              >
                <AppText
                  variant="caption"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? Colors.surface : Colors.textSecondary}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {todayItems.length > 0 && (
          <View style={styles.section}>
            <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.sectionHeader}>
              Today
            </AppText>
            {todayItems.map(renderItem)}
          </View>
        )}

        {earlierItems.length > 0 && (
          <View style={styles.section}>
            <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.sectionHeader}>
              Earlier
            </AppText>
            {earlierItems.map(renderItem)}
          </View>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  settingsButton: {
    padding: 4,
  },
  filtersWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scrollContent: {
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  titleText: {
    lineHeight: 18,
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  heartIcon: {
    marginTop: 2,
  },
})
