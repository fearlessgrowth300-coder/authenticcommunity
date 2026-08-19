import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  ArrowLeft,
  Search,
} from 'lucide-react-native'

interface FollowingItem {
  id: string
  name: string
  avatarUrl: string
  city: string
  isVerified: boolean
  isFollowing: boolean
}

const SAMPLE_FOLLOWING: FollowingItem[] = [
  {
    id: 'g1',
    name: 'Sarah Williams',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 'g2',
    name: 'Alex Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: true,
    isFollowing: true,
  },
  {
    id: 'g3',
    name: 'Austin Hikers Group',
    avatarUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: false,
    isFollowing: true,
  },
]

export default function FollowingScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [following, setFollowing] = useState<FollowingItem[]>(SAMPLE_FOLLOWING)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const toggleFollowing = (id: string) => {
    setFollowing((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isFollowing: !item.isFollowing }
          : item
      )
    )
  }

  const filtered = following.filter(
    (item) =>
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Following ({following.filter((f) => f.isFollowing).length})
        </AppText>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search following"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* List */}
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
        {filtered.map((item) => (
          <View key={item.id} style={styles.followingRow}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/${item.id}`)}
              style={styles.profileClick}
            >
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <AppText variant="bodySm" weight="bold">
                    {item.name}
                  </AppText>
                  {item.isVerified && <VerifiedBadge size={14} />}
                </View>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {item.city}
                </AppText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFollowing(item.id)}
              style={[
                styles.unfollowBtn,
                item.isFollowing ? styles.unfollowBtnActive : styles.followBtnActive,
              ]}
            >
              <AppText
                variant="caption"
                weight="bold"
                color={item.isFollowing ? Colors.textSecondary : Colors.surface}
              >
                {item.isFollowing ? 'Following' : 'Follow'}
              </AppText>
            </TouchableOpacity>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <AppText variant="bodySm" color={Colors.textSecondary} align="center">
              No members found matching "{searchQuery}"
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
  backBtn: {
    padding: 4,
  },
  placeholder: {
    width: 30,
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
    height: 40,
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
  scrollContent: {
    paddingVertical: Spacing.xs,
  },
  followingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileClick: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  nameSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unfollowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  unfollowBtnActive: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnActive: {
    backgroundColor: Colors.primary,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
})
