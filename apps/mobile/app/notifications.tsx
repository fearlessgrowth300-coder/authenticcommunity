import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Settings,
  Heart,
  Calendar,
  MessageCircle,
  Users,
  Compass,
  Sparkles,
  Bell,
} from 'lucide-react-native'

const FILTER_TABS = ['All', 'Messages', 'Connections', 'Communities', 'Events']

interface NotificationItem {
  id: string
  type: string
  category: 'Messages' | 'Connections' | 'Communities' | 'Events'
  avatarUrl?: string | null
  title: string
  body?: string
  time: string
  isToday: boolean
}

export default function NotificationsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        const today = new Date()
        const parsed = data.map((n: any) => {
          const createdAt = new Date(n.created_at || Date.now())
          const isToday =
            createdAt.getDate() === today.getDate() &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getFullYear() === today.getFullYear()

          let category: NotificationItem['category'] = 'Connections'
          if (n.type?.includes('message') || n.type?.includes('chat')) category = 'Messages'
          else if (n.type?.includes('community')) category = 'Communities'
          else if (n.type?.includes('event')) category = 'Events'

          return {
            id: n.id,
            type: n.type || 'notification',
            category,
            avatarUrl: n.metadata?.avatar_url || null,
            title: n.title || 'Community Update',
            body: n.body || n.content || 'You have a new update.',
            time: isToday
              ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            isToday,
          }
        })
        setNotifications(parsed)
      } else {
        setNotifications([])
      }
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadNotifications()
    setRefreshing(false)
  }

  const filteredList = notifications.filter((item) => {
    if (selectedFilter === 'All') return true
    return item.category === selectedFilter
  })

  const todayList = filteredList.filter((item) => item.isToday)
  const earlierList = filteredList.filter((item) => !item.isToday)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Messages':
        return <MessageCircle color={Colors.primary} size={18} />
      case 'Communities':
        return <Compass color="#10B981" size={18} />
      case 'Events':
        return <Calendar color="#F59E0B" size={18} />
      default:
        return <Users color="#6366F1" size={18} />
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Notifications
        </AppText>
        <TouchableOpacity
          onPress={() => router.push('/profile/privacy')}
          style={styles.headerBtn}
        >
          <Settings color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedFilter === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedFilter(tab)}
                style={[
                  styles.filterTab,
                  isSelected ? styles.filterTabActive : null,
                ]}
              >
                <AppText
                  variant="bodySm"
                  weight={isSelected ? 'bold' : 'normal'}
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Bell color={Colors.textMuted} size={40} />
            <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
              No notifications yet
            </AppText>
            <AppText
              variant="caption"
              color={Colors.textSecondary}
              align="center"
              style={{ marginTop: 4 }}
            >
              When members match, message, or invite you to events, updates will appear here!
            </AppText>
          </Card>
        ) : (
          <>
            {todayList.length > 0 && (
              <View style={styles.section}>
                <AppText variant="label" weight="bold" style={styles.sectionHeader}>
                  Today
                </AppText>
                {todayList.map((item) => (
                  <View key={item.id} style={styles.notificationItem}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.iconPlaceholder}>
                        {getCategoryIcon(item.category)}
                      </View>
                    )}
                    <View style={styles.contentCol}>
                      <AppText variant="bodySm" weight="medium">
                        {item.title}
                      </AppText>
                      {item.body ? (
                        <AppText variant="caption" color={Colors.textSecondary}>
                          {item.body}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={Colors.textMuted}>
                      {item.time}
                    </AppText>
                  </View>
                ))}
              </View>
            )}

            {earlierList.length > 0 && (
              <View style={styles.section}>
                <AppText variant="label" weight="bold" style={styles.sectionHeader}>
                  Earlier
                </AppText>
                {earlierList.map((item) => (
                  <View key={item.id} style={styles.notificationItem}>
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.iconPlaceholder}>
                        {getCategoryIcon(item.category)}
                      </View>
                    )}
                    <View style={styles.contentCol}>
                      <AppText variant="bodySm" weight="medium">
                        {item.title}
                      </AppText>
                      {item.body ? (
                        <AppText variant="caption" color={Colors.textSecondary}>
                          {item.body}
                        </AppText>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={Colors.textMuted}>
                      {item.time}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerBtn: {
    padding: 6,
  },
  filterTabsWrapper: {
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTabsContainer: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    color: Colors.textMuted,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  iconPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    gap: 2,
  },
})
