import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { fetchDiscoverEvents } from '@/services/discover'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EventCard, EventItem } from '@/components/events/EventCard'
import { Card } from '@/components/primitives/Card'
import {
  Search,
  SlidersHorizontal,
  Bell,
  PlusCircle,
  Calendar,
} from 'lucide-react-native'

const TIME_FILTER_TABS = ['For You', 'Today', 'This Week', 'Nearby']

export default function EventsFeedScreen() {
  const router = useRouter()
  const [activeTimeTab, setActiveTimeTab] = useState('For You')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await fetchDiscoverEvents()
      setEvents(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadEvents()
    setRefreshing(false)
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return e.title.toLowerCase().includes(q) || e.host.toLowerCase().includes(q)
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Events
        </AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.headerIconBtn}
            accessibilityLabel="Notifications"
          >
            <Bell color={Colors.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/event/create')}
            style={styles.createEventBtn}
            accessibilityLabel="Create Event"
          >
            <PlusCircle color={Colors.surface} size={18} />
            <AppText variant="bodySm" weight="bold" color={Colors.surface}>
              Host
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, workshops, meetups..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 3. Time Filter Segmented Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TIME_FILTER_TABS.map((tab) => {
            const isSelected = activeTimeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTimeTab(tab)}
                style={[
                  styles.tabPill,
                  isSelected ? styles.tabPillActive : null,
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

      {/* 4. Events Feed List */}
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
        ) : filteredEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Calendar color={Colors.textMuted} size={40} />
            <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
              No upcoming events
            </AppText>
            <AppText
              variant="caption"
              color={Colors.textSecondary}
              align="center"
              style={{ marginTop: 4 }}
            >
              Host a local community gathering or check back soon!
            </AppText>
          </Card>
        ) : (
          <View style={styles.eventsList}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/event/${event.id}`)}
              />
            ))}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  tabsWrapper: {
    paddingVertical: Spacing.xs,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
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
  eventsList: {
    gap: 14,
  },
})
