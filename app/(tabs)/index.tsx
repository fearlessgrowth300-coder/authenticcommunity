import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Skeleton } from '@/components/primitives/Skeleton'
import { StoriesRow } from '@/components/feed/StoriesRow'
import { PostCard } from '@/components/feed/PostCard'
import {
  PeopleYouMayConnectWithModule,
  CommunitiesForYouModule,
  EventsNearYouModule,
} from '@/components/feed/FeedModules'
import { fetchFeedPosts, MobilePostItem, FeedStreamType } from '@/services/feed'
import { getActiveStories, MobileStoryItem } from '@/services/stories'
import { supabase } from '@/services/supabase'
import { recommendationEventBuffer } from '@/services/recommendationEventBuffer'
import {
  Search,
  Bell,
  Users,
  Compass,
} from 'lucide-react-native'

const FEED_TABS: FeedStreamType[] = ['For You', 'Following', 'Nearby']

export default function HomeFeedScreen() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<FeedStreamType>('For You')
  const [posts, setPosts] = useState<MobilePostItem[]>([])
  const [stories, setStories] = useState<MobileStoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const viewedPostIds = useRef(new Set<string>())
  const activeTabRef = useRef(activeTab)
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60, minimumViewTime: 500 }).current
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: MobilePostItem }> }) => {
    for (const viewable of viewableItems) {
      const post = viewable.item
      if (!post || viewedPostIds.current.has(post.id)) continue
      viewedPostIds.current.add(post.id)
      const currentTab = activeTabRef.current
      const surface = currentTab === 'Following' ? 'following' : currentTab === 'Nearby' ? 'nearby' : 'for_you'
      recommendationEventBuffer.enqueue({
        surface,
        event_type: 'recommendation_impression',
        item_type: 'post',
        item_id: post.id,
        algorithm_version: post.algorithmVersion || (surface === 'following' ? 'feed_following_v1' : surface === 'nearby' ? 'feed_nearby_v1' : 'feed_foryou_v1'),
        rank_position: post.rankPosition,
        reason_codes: post.reasonCodes,
      })
    }
  }).current

  useEffect(() => {
    activeTabRef.current = activeTab
    viewedPostIds.current.clear()
  }, [activeTab])

  const loadData = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        setLoadError(null)
        if (pageNum === 1) {
          const [storiesData, feedData] = await Promise.all([
            getActiveStories(),
            fetchFeedPosts({ stream: activeTab, page: 1, pageSize: 10 }),
          ])
          setStories(storiesData)
          setPosts(feedData.posts)
          setHasMore(feedData.hasMore)
          setPage(1)
        } else {
          setLoadingMore(true)
          const feedData = await fetchFeedPosts({
            stream: activeTab,
            page: pageNum,
            pageSize: 10,
          })
          setPosts((prev) => [...prev, ...feedData.posts])
          setHasMore(feedData.hasMore)
          setPage(pageNum)
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load your feed.')
      } finally {
        setLoading(false)
        if (isRefresh) setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [activeTab]
  )

  useEffect(() => {
    setLoading(true)
    loadData(1)
  }, [loadData])

  useEffect(() => {
    if (!user) return
    const loadUnread = async () => {
      const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      setUnreadCount(count || 0)
    }
    loadUnread()
    const channel = supabase
      .channel(`home-notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, loadUnread)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData(1, true)
  }

  const handleEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      loadData(page + 1)
    }
  }

  const handlePostDismissed = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  // Header component with Stories & Tabs
  const renderHeader = () => (
    <View>
      {/* 2. Stories Row */}
      <StoriesRow
        myAvatarUrl={profile?.profile_image_url || undefined}
        stories={stories}
      />

      {/* 3. Feed Tabs (For You, Following, Nearby) */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          {FEED_TABS.map((tab) => {
            const isSelected = activeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.feedTab, isSelected ? styles.feedTabActive : null]}
              >
                <AppText
                  variant="bodySm"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                >
                  {tab}
                </AppText>
                {isSelected && <View style={styles.activeTabUnderline} />}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )

  // Real Empty State without fake content fallback
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.feedSkeleton} accessibilityLabel="Loading your personalized feed">
          {[0, 1].map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <Skeleton width={44} height={44} borderRadius={22} />
                <View style={styles.skeletonTextColumn}>
                  <Skeleton width="45%" height={14} />
                  <Skeleton width="30%" height={11} />
                </View>
              </View>
              <Skeleton width="90%" height={14} />
              <Skeleton width="100%" height={220} borderRadius={Radii.lg} />
            </View>
          ))}
        </View>
      )
    }

    if (loadError) {
      return (
        <View style={styles.emptyContainer}>
          <Compass color={Colors.coral} size={40} />
          <AppText variant="h3" weight="bold" align="center">Couldn't load your feed</AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.emptySub}>Check your connection and try again. Technical details are kept out of the app.</AppText>
          <AppButton title="Try Again" onPress={() => { setLoading(true); loadData(1) }} style={styles.emptyBtn} />
        </View>
      )
    }

    if (activeTab === 'Following') {
      return (
        <View style={styles.emptyContainer}>
          <Users color={Colors.primary} size={40} />
          <AppText variant="h3" weight="bold" align="center">
            Follow people to build your feed
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.emptySub}>
            Discover members in your city, shared interest communities, and local creators.
          </AppText>
          <AppButton
            title="Discover People"
            variant="primary"
            onPress={() => router.push('/(tabs)/discover')}
            style={styles.emptyBtn}
          />
        </View>
      )
    }

    if (activeTab === 'Nearby') {
      return (
        <View style={styles.emptyContainer}>
          <Compass color={Colors.sage} size={40} />
          <AppText variant="h3" weight="bold" align="center">
            Nothing nearby yet
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.emptySub}>
            Be the first in your area to post or expand your discovery radius in settings.
          </AppText>
          <AppButton
            title="Create First Post"
            variant="primary"
            onPress={() => router.push('/post/create')}
            style={styles.emptyBtn}
          />
        </View>
      )
    }

    return (
      <View style={styles.emptyContainer}>
        <Users color={Colors.primary} size={40} />
        <AppText variant="h3" weight="bold" align="center">
          No posts yet
        </AppText>
        <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.emptySub}>
          Share your first update, join a community, or RSVP to an event!
        </AppText>
        <AppButton
          title="Share Something"
          variant="primary"
          onPress={() => router.push('/post/create')}
          style={styles.emptyBtn}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header (Brand Logo + Search + Notification Bell) */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandEmblem}>
            <Users color="#FFFFFF" size={18} />
          </View>
          <AppText variant="h2" weight="bold" color={Colors.primary}>
            Authentic
          </AppText>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/discover')}
            style={styles.headerIconBtn}
            accessibilityLabel="Search"
          >
            <Search color={Colors.text} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.headerIconBtn}
            accessibilityLabel="Notifications"
          >
            <Bell color={Colors.text} size={22} />
            {unreadCount > 0 && (
              <View style={styles.unreadCountBadge}>
                <AppText variant="caption" weight="bold" color="#FFFFFF">{unreadCount > 9 ? '9+' : unreadCount}</AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Virtualized FlatList for high performance */}
      <FlatList<MobilePostItem>
        data={posts}
        keyExtractor={(item: MobilePostItem) => item.id}
        renderItem={({ item, index }: { item: MobilePostItem; index: number }) => (
          <View>
            <PostCard post={item} onPostDismissed={handlePostDismissed} />
            {/* Interleave intelligent feed modules at sensible intervals */}
            {index === 0 && <PeopleYouMayConnectWithModule />}
            {index === 2 && <CommunitiesForYouModule />}
            {index === 4 && <EventsNearYouModule />}
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        onEndReached={handleEndReached}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
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
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmblem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 4,
    position: 'relative',
  },
  unreadCountBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
  },
  feedTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  feedTabActive: {},
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
  },
  feedSkeleton: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  skeletonCard: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  skeletonTextColumn: {
    flex: 1,
    gap: 7,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: 12,
  },
  emptySub: {
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  emptyBtn: {
    marginTop: 8,
    minWidth: 180,
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
})
