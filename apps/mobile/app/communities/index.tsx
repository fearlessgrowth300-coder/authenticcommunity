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
import { CommunityCard, CommunityItem } from '@/components/communities/CommunityCard'
import { CommunityFilterModal, CommunityFilterState } from '@/components/communities/CommunityFilterModal'
import {
  Search,
  SlidersHorizontal,
  Bell,
  PlusCircle,
} from 'lucide-react-native'

const CATEGORY_TABS = [
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

export default function CommunitiesFeedScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterState, setFilterState] = useState<CommunityFilterState>({
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

  const toggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const filteredCommunities = SAMPLE_COMMUNITIES.filter((item) => {
    const matchesCategory =
      activeCategory === 'All' || item.category.toLowerCase() === activeCategory.toLowerCase()
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Discover Communities
        </AppText>
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => router.push('/community/create')}
            style={styles.headerIconButton}
            accessibilityLabel="Create community"
          >
            <PlusCircle color={Colors.primary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.headerIconButton}
            accessibilityLabel="Notifications"
          >
            <Bell color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities, topics, or keywords"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterButton}
            accessibilityLabel="Filter communities"
          >
            <SlidersHorizontal color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORY_TABS.map((cat) => {
            const isSelected = activeCategory === cat
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
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

      {/* Communities Feed */}
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
              isSaved: savedIds.includes(community.id),
            }}
            onPress={() => router.push(`/community/${community.id}`)}
            onToggleSave={() => toggleSave(community.id)}
          />
        ))}

        {filteredCommunities.length === 0 && (
          <View style={styles.emptyState}>
            <AppText variant="body" weight="semibold" color={Colors.textSecondary} align="center">
              No communities found in "{activeCategory}"
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} align="center" style={styles.emptyHint}>
              Try searching for a different keyword or create your own community!
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Communities Filter Modal (Screen 4 in Reference) */}
      <CommunityFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(f) => setFilterState(f)}
        currentFilters={filterState}
        resultCount={filteredCommunities.length}
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconButton: {
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
  filterButton: {
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
