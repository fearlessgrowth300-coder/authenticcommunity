import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { MatchCard, MatchProfile } from '@/components/matches/MatchCard'
import { FilterModal, FilterState } from '@/components/matches/FilterModal'
import { SortMenuModal, SortOption } from '@/components/matches/SortMenuModal'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react-native'

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

export default function DiscoverMatchesScreen() {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [matches, setMatches] = useState<MatchProfile[]>(SAMPLE_MATCHES)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [connectedIds, setConnectedIds] = useState<string[]>([])

  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [sortModalVisible, setSortModalVisible] = useState(false)
  const [currentSort, setCurrentSort] = useState<SortOption>('best_match')
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    distance: '25 mi',
    ageRange: '22-40',
    selectedInterests: ['Community'],
    selectedValues: ['Kindness', 'Growth', 'Community'],
    verifiedOnly: true,
    minMatchScore: 70,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  const handlePass = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleConnect = (id: string) => {
    setConnectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="h2" weight="bold">
            Discover Matches
          </AppText>
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
            <ArrowUpDown color={Colors.text} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[styles.headerButton, styles.filterActiveButton]}
            accessibilityLabel="Filter Matches"
          >
            <SlidersHorizontal color={Colors.primary} size={20} />
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
            isSaved={savedIds.includes(profile.id)}
            isConnected={connectedIds.includes(profile.id)}
            onPass={() => handlePass(profile.id)}
            onSave={() => handleSave(profile.id)}
            onConnect={() => handleConnect(profile.id)}
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

      {/* Filter Modal (Screen 3 in Reference) */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={activeFilters}
      />

      {/* Sort Menu Modal (Screen 4 in Reference) */}
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
  headerText: {
    flex: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterActiveButton: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#C7D2FE',
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
