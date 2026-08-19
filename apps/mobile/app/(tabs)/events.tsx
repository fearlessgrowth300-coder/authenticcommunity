import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { EventCard, EventItem } from '@/components/events/EventCard'
import {
  Search,
  SlidersHorizontal,
  Bell,
  PlusCircle,
  MapPin,
} from 'lucide-react-native'

const TIME_FILTER_TABS = ['For You', 'Today', 'This Week', 'Nearby']

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Morning Yoga in the Park',
    host: 'Balance & Breathe',
    dateMonth: 'JUN',
    dateDay: '15',
    dateDayOfWeek: 'SAT',
    dateTimeFormatted: 'Sat, Jun 15 · 8:00 AM',
    distance: '0.6 mi away',
    imageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&fit=crop&q=80',
    attendeesCount: 12,
  },
  {
    id: 'e2',
    title: 'Local Farmers Market',
    host: 'Greenfield Collective',
    dateMonth: 'JUN',
    dateDay: '15',
    dateDayOfWeek: 'SAT',
    dateTimeFormatted: 'Sat, Jun 15 · 10:00 AM',
    distance: '1.2 mi away',
    imageUrl:
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&fit=crop&q=80',
    attendeesCount: 8,
  },
  {
    id: 'e3',
    title: 'Sunset Acoustic Night',
    host: 'Community Vibes',
    dateMonth: 'JUN',
    dateDay: '16',
    dateDayOfWeek: 'SUN',
    dateTimeFormatted: 'Sun, Jun 16 · 6:30 PM',
    distance: '2.1 mi away',
    imageUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop&q=80',
    attendeesCount: 24,
  },
  {
    id: 'e4',
    title: 'Community Mural Project',
    host: 'Art Together',
    dateMonth: 'JUN',
    dateDay: '17',
    dateDayOfWeek: 'MON',
    dateTimeFormatted: 'Mon, Jun 17 · 9:00 AM',
    distance: '0.9 mi away',
    imageUrl:
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&fit=crop&q=80',
    attendeesCount: 6,
  },
]

export default function EventsFeedScreen() {
  const router = useRouter()
  const [activeTimeTab, setActiveTimeTab] = useState('For You')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredEvents = SAMPLE_EVENTS.filter((e) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.host.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Events
        </AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/event/create')}
            style={styles.headerIconBtn}
            accessibilityLabel="Create event"
          >
            <PlusCircle color={Colors.primary} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.headerIconBtn}
            accessibilityLabel="Notifications"
          >
            <Bell color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, people, or topics"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterBtn}>
            <SlidersHorizontal color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Filter Pills */}
      <View style={styles.timeTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeTabsContainer}
        >
          {TIME_FILTER_TABS.map((tab) => {
            const isSelected = activeTimeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTimeTab(tab)}
                style={[
                  styles.timeTabPill,
                  isSelected ? styles.timeTabPillActive : null,
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

      {/* Section Sub-Header: Upcoming Events & View Map */}
      <View style={styles.subHeader}>
        <AppText variant="h3" weight="bold">
          Upcoming Events
        </AppText>
        <TouchableOpacity
          style={styles.viewMapBtn}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <AppText variant="caption" weight="semibold" color={Colors.primary}>
            View Map
          </AppText>
          <MapPin color={Colors.primary} size={14} />
        </TouchableOpacity>
      </View>

      {/* Events List */}
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
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={{
              ...event,
              isSaved: savedIds.includes(event.id),
            }}
            onPress={() => router.push(`/event/${event.id}`)}
            onToggleSave={() => toggleSave(event.id)}
          />
        ))}

        {filteredEvents.length === 0 && (
          <View style={styles.emptyState}>
            <AppText variant="body" weight="semibold" color={Colors.textSecondary} align="center">
              No upcoming events found
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} align="center" style={styles.emptyHint}>
              Try searching for another topic or create an event for your community!
            </AppText>
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  filterBtn: {
    padding: 4,
  },
  timeTabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  timeTabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  timeTabPill: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeTabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyHint: {
    marginTop: 8,
  },
})
