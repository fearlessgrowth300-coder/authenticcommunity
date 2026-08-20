import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { MatchCard, MatchProfile } from '@/components/matches/MatchCard'
import { FilterModal, FilterState } from '@/components/matches/FilterModal'
import { SortMenuModal, SortOption } from '@/components/matches/SortMenuModal'
import { CommunityCard, CommunityItem } from '@/components/communities/CommunityCard'
import { EventCard, EventItem } from '@/components/events/EventCard'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Play,
  Users,
  Compass,
  Calendar,
  Video,
} from 'lucide-react-native'

const DISCOVER_TABS = ['People', 'Communities', 'Events', 'Videos'] as const
type DiscoverTab = (typeof DISCOVER_TABS)[number]

const SAMPLE_MATCHES: MatchProfile[] = [
  {
    id: 'maya-patel',
    name: 'Maya Patel',
    age: 28,
    isVerified: true,
    location: 'Lagos, Nigeria',
    distance: '1.2 mi',
    matchScore: 94,
    photoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80',
    sharedInterests: ['Design', 'Startups', 'Photography'],
    sharedValues: ['Kindness', 'Growth'],
    bio: 'Product designer & creative director. Loving local art exhibitions and building collaborative tech communities.',
  },
  {
    id: 'david-chen',
    name: 'David Chen',
    age: 30,
    isVerified: true,
    location: 'Lagos, Nigeria',
    distance: '2.8 mi',
    matchScore: 89,
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&fit=crop&q=80',
    sharedInterests: ['Programming', 'AI', 'Hiking'],
    sharedValues: ['Learning', 'Community'],
    bio: 'Software architect passionate about decentralized protocols and weekend trail runs.',
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    age: 26,
    isVerified: true,
    location: 'Lagos, Nigeria',
    distance: '3.4 mi',
    matchScore: 86,
    photoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&fit=crop&q=80',
    sharedInterests: ['Yoga', 'Books', 'Wellness'],
    sharedValues: ['Kindness', 'Health'],
    bio: 'Yoga teacher & mental health advocate. Looking for mindful souls and weekend book club buddies.',
  },
]

const SAMPLE_COMMUNITIES: CommunityItem[] = [
  {
    id: 'lagos-creators',
    name: 'Lagos Creators & Builders',
    distance: '1.2 km away',
    membersCount: 420,
    category: 'Learning',
    description: 'A community for designers and software builders.',
    imageUrl:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
  },
  {
    id: 'lekki-runners',
    name: 'Lekki Morning Runners',
    distance: '2.4 km away',
    membersCount: 185,
    category: 'Outdoors',
    description: 'Weekly morning running club in Lekki.',
    imageUrl:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&fit=crop&q=80',
  },
  {
    id: 'mindful-living',
    name: 'Mindful Living Space',
    distance: '3.1 km away',
    membersCount: 248,
    category: 'Wellness',
    description: 'Mindfulness, meditation, and well-being.',
    imageUrl:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&fit=crop&q=80',
  },
]

const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'e1',
    title: 'Morning Yoga in the Park',
    host: 'Balance & Breathe',
    dateMonth: 'JUN',
    dateDay: '15',
    dateDayOfWeek: 'SAT',
    dateTimeFormatted: 'Sat, Jun 15 · 8:00 AM',
    distance: '0.6 km away',
    imageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&fit=crop&q=80',
    attendeesCount: 12,
  },
  {
    id: 'e2',
    title: 'Tech Founders Coffee & Hike',
    host: 'Lagos Tech Meetups',
    dateMonth: 'JUN',
    dateDay: '16',
    dateDayOfWeek: 'SUN',
    dateTimeFormatted: 'Sun, Jun 16 · 9:00 AM',
    distance: '1.4 km away',
    imageUrl:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&fit=crop&q=80',
    attendeesCount: 28,
  },
]

const SAMPLE_VIDEOS = [
  {
    id: 'v1',
    title: 'How we built a 400-member community in Lagos',
    authorName: 'Maya Patel',
    views: '1.8K',
    thumbnail:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
  },
  {
    id: 'v2',
    title: 'Sunrise meditation session highlights 🌿',
    authorName: 'Elena Rostova',
    views: '2.4K',
    thumbnail:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&fit=crop&q=80',
  },
  {
    id: 'v3',
    title: 'Weekend Trail Walk at Lekki Conservation',
    authorName: 'David Chen',
    views: '950',
    thumbnail:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&fit=crop&q=80',
  },
  {
    id: 'v4',
    title: '5 Books that transformed our startup journey',
    authorName: 'Marcus Brody',
    views: '3.1K',
    thumbnail:
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&fit=crop&q=80',
  },
]

export default function DiscoverScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DiscoverTab>('People')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [currentSort, setCurrentSort] = useState<SortOption>('best_match')
  const [refreshing, setRefreshing] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    distance: '25 mi',
    ageRange: '22-40',
    selectedInterests: [],
    selectedValues: [],
    verifiedOnly: false,
    minMatchScore: 60,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Discover
        </AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setSortModalVisible(true)}
            style={styles.headerIconBtn}
            accessibilityLabel="Sort"
          >
            <ArrowUpDown color={Colors.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.headerIconBtn}
            accessibilityLabel="Filter"
          >
            <SlidersHorizontal color={Colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search people, posts, communities, events..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 2. Top Segmented Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {DISCOVER_TABS.map((tab) => {
            const isSelected = activeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabPill,
                  isSelected ? styles.tabPillActive : null,
                ]}
              >
                <AppText
                  variant="bodySm"
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

      {/* 3. Main Discover Views */}
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
        {activeTab === 'People' && (
          <View style={styles.peopleSection}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3" weight="bold">
                Best Matches Near You
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Local-first recommendation based on your values & interests
              </AppText>
            </View>

            {SAMPLE_MATCHES.map((cand) => (
              <MatchCard
                key={cand.id}
                profile={cand}
                onPressDetails={() => router.push(`/profile/${cand.id}`)}
                onConnect={() => router.push(`/profile/${cand.id}`)}
              />
            ))}
          </View>
        )}

        {activeTab === 'Communities' && (
          <View style={styles.communitiesSection}>
            {SAMPLE_COMMUNITIES.map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                onPress={() => router.push(`/community/${c.id}`)}
              />
            ))}
          </View>
        )}

        {activeTab === 'Events' && (
          <View style={styles.eventsSection}>
            {SAMPLE_EVENTS.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onPress={() => router.push(`/event/${e.id}`)}
              />
            ))}
          </View>
        )}

        {activeTab === 'Videos' && (
          <View style={styles.videosGrid}>
            {SAMPLE_VIDEOS.map((v) => (
              <TouchableOpacity
                key={v.id}
                activeOpacity={0.88}
                onPress={() => router.push(`/video/${v.id}`)}
                style={styles.videoCard}
              >
                <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} />
                <View style={styles.videoPlayBadge}>
                  <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
                  <AppText variant="caption" weight="bold" color="#FFFFFF">
                    {v.views}
                  </AppText>
                </View>
                <View style={styles.videoInfo}>
                  <AppText variant="caption" weight="bold" color="#FFFFFF" numberOfLines={2}>
                    {v.title}
                  </AppText>
                  <AppText variant="caption" color="rgba(255, 255, 255, 0.85)">
                    {v.authorName}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
        onApply={handleApplyFilters}
      />

      {/* Sort Menu Modal */}
      <SortMenuModal
        visible={sortModalVisible}
        onClose={() => setSortModalVisible(false)}
        selectedSort={currentSort}
        onSelectSort={setCurrentSort}
      />
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
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  tabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  peopleSection: {
    gap: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
    gap: 2,
  },
  communitiesSection: {
    gap: Spacing.sm,
  },
  eventsSection: {
    gap: Spacing.sm,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  videoCard: {
    width: '48%',
    height: 220,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  videoPlayBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
    gap: 2,
  },
})
