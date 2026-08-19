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
  UserCheck,
  UserPlus,
  MoreHorizontal,
  X,
} from 'lucide-react-native'

interface FollowerItem {
  id: string
  name: string
  avatarUrl: string
  city: string
  isVerified: boolean
  isFollowingBack: boolean
}

const SAMPLE_FOLLOWERS: FollowerItem[] = [
  {
    id: 'f1',
    name: 'Maya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: true,
    isFollowingBack: true,
  },
  {
    id: 'f2',
    name: 'David Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: false,
    isFollowingBack: false,
  },
  {
    id: 'f3',
    name: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    city: 'Round Rock, TX',
    isVerified: true,
    isFollowingBack: true,
  },
  {
    id: 'f4',
    name: 'Marcus Brody',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: false,
    isFollowingBack: false,
  },
]

export default function FollowersScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [followers, setFollowers] = useState<FollowerItem[]>(SAMPLE_FOLLOWERS)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const toggleFollowBack = (id: string) => {
    setFollowers((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isFollowingBack: !item.isFollowingBack }
          : item
      )
    )
  }

  const handleRemoveFollower = (id: string) => {
    setFollowers((prev) => prev.filter((item) => item.id !== id))
  }

  const filtered = followers.filter(
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
          Followers ({followers.length})
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
            placeholder="Search followers"
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
          <View key={item.id} style={styles.followerRow}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/${item.id}`)}
              style={styles.followerProfileClick}
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

            <View style={styles.actionsGroup}>
              <TouchableOpacity
                onPress={() => toggleFollowBack(item.id)}
                style={[
                  styles.followBtn,
                  item.isFollowingBack ? styles.followingBtn : null,
                ]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  color={item.isFollowingBack ? Colors.textSecondary : Colors.surface}
                >
                  {item.isFollowingBack ? 'Following' : 'Follow Back'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRemoveFollower(item.id)}
                style={styles.removeBtn}
                accessibilityLabel="Remove follower"
              >
                <X color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <AppText variant="bodySm" color={Colors.textSecondary} align="center">
              No followers found matching "{searchQuery}"
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
  followerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  followerProfileClick: {
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
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  followingBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtn: {
    padding: 6,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
})
