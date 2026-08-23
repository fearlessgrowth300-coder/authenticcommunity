import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { MatchCard, MatchProfile } from '@/components/matches/MatchCard'
import { FilterModal, FilterState } from '@/components/matches/FilterModal'
import { SortMenuModal, SortOption } from '@/components/matches/SortMenuModal'
import { CommunityCard, CommunityItem } from '@/components/communities/CommunityCard'
import { CommunityFilterModal, CommunityFilterState } from '@/components/communities/CommunityFilterModal'
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  PlusCircle,
  Bell,
  Users,
  Compass,
} from 'lucide-react-native'

const SAMPLE_MATCHES: MatchProfile[] = [
  {
    id: 'm1',
    name: 'Maya',
    age: 28,
    isVerified: true,
    location: 'Austin, Texas',
    distance: '1.2 mi away',
    matchScore: 92,
    photoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80',
    bio: 'Community builder, book lover, and weekend hiker. Always up for meaningful conversations and trying new local spots.',
    sharedInterests: ['Hiking', 'Books', 'Community', 'Travel'],
    sharedValues: ['Kindness', 'Growth', 'Community', 'Learning'],
    conversationStarters: [
      "What's a book that changed your perspective?",
      "What's a cause you care deeply about?",
    ],
    mutualCommunity: {
      name: 'Austin Trail Buddies',
      members: '245 members',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&fit=crop&q=80',
    },
  },
  {
    id: 'm2',
    name: 'Marcus',
    age: 31,
    isVerified: true,
    location: 'Austin, Texas',
    distance: '2.5 mi away',
    matchScore: 88,
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&fit=crop&q=80',
    bio: 'Designer passionate about sustainable architecture, specialty coffee, and local trail running.',
    sharedInterests: ['Design', 'Technology', 'Fitness', 'Coffee'],
    sharedValues: ['Creativity', 'Honesty', 'Growth', 'Community'],
  },
  {
    id: 'm3',
    name: 'Elena',
    age: 26,
    isVerified: true,
    location: 'Austin, Texas',
    distance: '3.1 mi away',
    matchScore: 85,
    photoUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&fit=crop&q=80',
    bio: 'Storyteller & yoga teacher. Love organizing intimate dinners and creative writing workshops.',
    sharedInterests: ['Yoga', 'Writing', 'Music', 'Cooking'],
    sharedValues: ['Kindness', 'Health', 'Learning', 'Faith'],
  },
]

const COMMUNITY_CATEGORY_TABS = [
  'All',
  'Wellness',
  'Outdoors',
  'Learning',
  'Faith',
  'Arts & Culture',
  'Technology',
  'Food',
]

const SAMPLE_COMMUNITIES: CommunityItem[] = [
  {
    id: 'c1',
    name: 'Sunrise Hikers Austin',
    category: 'Outdoors',
    distance: '2.4 mi',
    membersCount: 320,
    description: 'Weekend hikes, trail cleanups, and adventures in Austin and beyond.',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&fit=crop&q=80',
    isTrusted: true,
  },
  {
    id: 'c2',
    name: 'Austin Book Circle',
    category: 'Learning',
    distance: '3.1 mi',
    membersCount: 156,
    description: 'Thoughtful reads and friendly discussions for curious minds.',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&fit=crop&q=80',
  },
  {
    id: 'c3',
    name: 'Mindful Living Collective',
    category: 'Wellness',
    distance: '1.7 mi',
    membersCount: 278,
    description: 'Mindfulness, meditation, and wellness for everyday life.',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&fit=crop&q=80',
  },
  {
    id: 'c4',
    name: 'Community Garden ATX',
    category: 'Outdoors',
    distance: '2.6 mi',
    membersCount: 189,
    description: 'Growing food, friendships, and a stronger local community.',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&fit=crop&q=80',
  },
]

export default function ExploreScreen() {
  const router = useRouter()
  const [exploreTab, setExploreTab] = useState<'matches' | 'communities'>('matches')
  const [refreshing, setRefreshing] = useState(false)

  // Matches State
  const [matches, setMatches] = useState<MatchProfile[]>(SAMPLE_MATCHES)
  const [savedMatchIds, setSavedMatchIds] = useState<string[]>([])
  const [connectedMatchIds, setConnectedMatchIds] = useState<string[]>([])
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [currentSort, setCurrentSort] = useState<SortOption>('best_match')
  const [matchFilters, setMatchFilters] = useState<FilterState>({
    distance: '25 mi',
    ageRange: '22-40',
    selectedInterests: ['Community'],
    selectedValues: ['Kindness', 'Growth', 'Community'],
    verifiedOnly: true,
    minMatchScore: 70,
    discoveryArea: 'nearby',
  })

  // Communities State
  const [activeCommunityCategory, setActiveCommunityCategory] = useState('All')
  const [communitySearchQuery, setCommunitySearchQuery] = useState('')
  const [savedCommunityIds, setSavedCommunityIds] = useState<string[]>([])
  const [communityFilterModalVisible, setCommunityFilterModalVisible] = useState(false)
  const [communityFilterState, setCommunityFilterState] = useState<CommunityFilterState>({
    categories: ['All'],
    distance: 'Any distance',
    groupSize: 'Any Size',
    activityLevel: 'Any',
    privacy: 'All',
  })

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  // Matches Handlers
  const handlePassMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSaveMatch = (id: string) => {
    setSavedMatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleConnectMatch = (id: string) => {
    setConnectedMatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Communities Handlers
  const toggleSaveCommunity = (id: string) => {
    setSavedCommunityIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredCommunities = SAMPLE_COMMUNITIES.filter((item) => {
    const matchesCategory =
      activeCommunityCategory === 'All' ||
      item.category.toLowerCase() === activeCommunityCategory.toLowerCase()
    const matchesSearch =
      communitySearchQuery.trim() === '' ||
      item.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(communitySearchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Segmented Tab Switcher: Matches vs Communities */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          onPress={() => setExploreTab('matches')}
          style={[
            styles.topTabButton,
            exploreTab === 'matches' ? styles.topTabButtonActive : null,
          ]}
        >
          <Users
            color={exploreTab === 'matches' ? Colors.primary : Colors.textSecondary}
            size={18}
          />
          <AppText
            variant="bodySm"
            weight={exploreTab === 'matches' ? 'bold' : 'medium'}
            color={exploreTab === 'matches' ? Colors.primary : Colors.textSecondary}
          >
            Discover Matches
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setExploreTab('communities')}
          style={[
            styles.topTabButton,
            exploreTab === 'communities' ? styles.topTabButtonActive : null,
          ]}
        >
          <Compass
            color={exploreTab === 'communities' ? Colors.primary : Colors.textSecondary}
            size={18}
          />
          <AppText
            variant="bodySm"
            weight={exploreTab === 'communities' ? 'bold' : 'medium'}
            color={exploreTab === 'communities' ? Colors.primary : Colors.textSecondary}
          >
            Communities
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ============================================================ */}
      {/* SECTION 3: DISCOVER MATCHES */}
      {/* ============================================================ */}
      {exploreTab === 'matches' ? (
        <>
          {/* Header Sub-Bar */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="caption" color={Colors.textSecondary}>
                People nearby who align with your values and interests.
              </AppText>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setSortModalVisible(true)}
                style={styles.headerButton}
                accessibilityLabel="Sort Matches"
              >
                <ArrowUpDown color={Colors.text} size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterModalVisible(true)}
                style={[styles.headerButton, styles.filterActiveButton]}
                accessibilityLabel="Filter Matches"
              >
                <SlidersHorizontal color={Colors.primary} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Matches List */}
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
            {matches.map((profile) => (
              <MatchCard
                key={profile.id}
                profile={profile}
                isSaved={savedMatchIds.includes(profile.id)}
                isConnected={connectedMatchIds.includes(profile.id)}
                onPass={() => handlePassMatch(profile.id)}
                onSave={() => handleSaveMatch(profile.id)}
                onConnect={() => handleConnectMatch(profile.id)}
                onPressDetails={() => router.push(`/profile/${profile.id}`)}
              />
            ))}

            {matches.length === 0 && (
              <View style={styles.emptyState}>
                <AppText variant="body" weight="semibold" color={Colors.textSecondary} align="center">
                  You've viewed all current matches!
                </AppText>
                <AppText variant="caption" color={Colors.textMuted} align="center" style={styles.emptyHint}>
                  Pull down to refresh or adjust your filter settings.
                </AppText>
              </View>
            )}
          </ScrollView>

          {/* Section 3 Filter Modal */}
          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            onApply={(f) => setMatchFilters(f)}
            currentFilters={matchFilters}
          />

          {/* Section 3 Sort Menu Modal */}
          <SortMenuModal
            visible={sortModalVisible}
            onClose={() => setSortModalVisible(false)}
            selectedSort={currentSort}
            onSelectSort={setCurrentSort}
          />
        </>
      ) : (
        /* ============================================================ */
        /* SECTION 4: DISCOVER COMMUNITIES */
        /* ============================================================ */
        <>
          {/* Header Sub-Bar for Communities */}
          <View style={styles.communitiesSubHeader}>
            <View style={styles.searchBar}>
              <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
              <TextInput
                value={communitySearchQuery}
                onChangeText={setCommunitySearchQuery}
                placeholder="Search communities, topics, or keywords"
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
              />
              <TouchableOpacity
                onPress={() => setCommunityFilterModalVisible(true)}
                style={styles.filterButton}
                accessibilityLabel="Filter communities"
              >
                <SlidersHorizontal color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/community/create')}
              style={styles.createCommunityIconButton}
              accessibilityLabel="Create community"
            >
              <PlusCircle color={Colors.primary} size={22} />
            </TouchableOpacity>
          </View>

          {/* Category Horizontal Filter Pills */}
          <View style={styles.categoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {COMMUNITY_CATEGORY_TABS.map((cat) => {
                const isSelected = activeCommunityCategory === cat
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCommunityCategory(cat)}
                    style={[
                      styles.categoryPill,
                      isSelected ? styles.categoryPillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'medium'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                    >
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Communities Feed List */}
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
            {filteredCommunities.map((community) => (
              <CommunityCard
                key={community.id}
                community={{
                  ...community,
                  isSaved: savedCommunityIds.includes(community.id),
                }}
                onPress={() => router.push(`/community/${community.id}`)}
                onToggleSave={() => toggleSaveCommunity(community.id)}
              />
            ))}

            {filteredCommunities.length === 0 && (
              <View style={styles.emptyState}>
                <AppText variant="body" weight="semibold" color={Colors.textSecondary} align="center">
                  No communities found in "{activeCommunityCategory}"
                </AppText>
                <AppText variant="caption" color={Colors.textMuted} align="center" style={styles.emptyHint}>
                  Try searching for a different keyword or create your own community!
                </AppText>
              </View>
            )}
          </ScrollView>

          {/* Section 4 Community Filter Modal */}
          <CommunityFilterModal
            visible={communityFilterModalVisible}
            onClose={() => setCommunityFilterModalVisible(false)}
            onApply={(f) => setCommunityFilterState(f)}
            currentFilters={communityFilterState}
            resultCount={filteredCommunities.length}
          />
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  topTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabButtonActive: {
    borderBottomColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 7,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterActiveButton: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#C7D2FE',
  },
  communitiesSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  searchBar: {
    flex: 1,
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
  filterButton: {
    padding: 4,
  },
  createCommunityIconButton: {
    padding: 4,
  },
  categoriesWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
