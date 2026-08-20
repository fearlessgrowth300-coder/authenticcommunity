import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchDiscoverMatches,
  fetchDiscoverCommunities,
  fetchDiscoverEvents,
  fetchDiscoverVideos,
  DiscoverVideoItem,
} from '@/services/discover'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { MatchCard, MatchProfile } from '@/components/matches/MatchCard'
import { FilterModal, FilterState } from '@/components/matches/FilterModal'
import { SortMenuModal, SortOption } from '@/components/matches/SortMenuModal'
import { CommunityCard, CommunityItem } from '@/components/communities/CommunityCard'
import { EventCard, EventItem } from '@/components/events/EventCard'
import { Card } from '@/components/primitives/Card'
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

export default function DiscoverScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<DiscoverTab>('People')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [currentSort, setCurrentSort] = useState<SortOption>('best_match')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [communities, setCommunities] = useState<CommunityItem[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [videos, setVideos] = useState<DiscoverVideoItem[]>([])

  const [filters, setFilters] = useState<FilterState>({
    distance: '25 mi',
    ageRange: '22-40',
    selectedInterests: [],
    selectedValues: [],
    verifiedOnly: false,
    minMatchScore: 60,
  })

  const loadDiscoverData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [matchesRes, commRes, eventsRes, videosRes] = await Promise.all([
        fetchDiscoverMatches(user.id),
        fetchDiscoverCommunities(),
        fetchDiscoverEvents(),
        fetchDiscoverVideos(),
      ])
      setMatches(matchesRes)
      setCommunities(commRes)
      setEvents(eventsRes)
      setVideos(videosRes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDiscoverData()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDiscoverData()
    setRefreshing(false)
  }

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  // Filter and sort matches
  const filteredMatches = matches
    .filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          m.name.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          m.sharedInterests.some((i) => i.toLowerCase().includes(q)) ||
          m.sharedValues.some((v) => v.toLowerCase().includes(q))
        )
      }
      return true
    })
    .filter((m) => {
      if (filters.verifiedOnly && !m.isVerified) return false
      if (m.matchScore < filters.minMatchScore) return false
      return true
    })

  const filteredCommunities = communities.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    }
    return true
  })

  const filteredEvents = events.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.host.toLowerCase().includes(q)
    }
    return true
  })

  const filteredVideos = videos.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return v.title.toLowerCase().includes(q) || v.authorName.toLowerCase().includes(q)
    }
    return true
  })

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

      {/* 2. Top Segmented Discover Tabs */}
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <AppText variant="bodySm" color={Colors.textSecondary} style={{ marginTop: 12 }}>
              Finding real matches and communities...
            </AppText>
          </View>
        ) : (
          <>
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

                {filteredMatches.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Users color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No matches found
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Try adjusting your search filters or discovery radius to see more members!
                    </AppText>
                  </Card>
                ) : (
                  filteredMatches.map((cand) => (
                    <MatchCard
                      key={cand.id}
                      profile={cand}
                      onPressDetails={() => router.push(`/profile/${cand.id}`)}
                      onConnect={() => router.push(`/profile/${cand.id}`)}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'Communities' && (
              <View style={styles.communitiesSection}>
                {filteredCommunities.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Compass color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No communities yet
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Be the first to start a local community hub!
                    </AppText>
                  </Card>
                ) : (
                  filteredCommunities.map((c) => (
                    <CommunityCard
                      key={c.id}
                      community={c}
                      onPress={() => router.push(`/community/${c.id}`)}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'Events' && (
              <View style={styles.eventsSection}>
                {filteredEvents.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Calendar color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No upcoming events
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Check back soon or organize a community meetup!
                    </AppText>
                  </Card>
                ) : (
                  filteredEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      onPress={() => router.push(`/event/${e.id}`)}
                    />
                  ))
                )}
              </View>
            )}

            {activeTab === 'Videos' && (
              <View style={styles.videosGrid}>
                {filteredVideos.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Video color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No videos shared yet
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Post the first video story in the community!
                    </AppText>
                  </Card>
                ) : (
                  filteredVideos.map((v) => (
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
                        <AppText variant="caption" color="rgba(255,255,255,0.85)" numberOfLines={1}>
                          {v.authorName}
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </>
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
        onSelectSort={(sort) => setCurrentSort(sort)}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    justifyContent: 'center',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  peopleSection: {
    gap: 14,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  communitiesSection: {
    gap: 12,
  },
  eventsSection: {
    gap: 12,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  videoCard: {
    width: '48%',
    height: 220,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  videoPlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
})
