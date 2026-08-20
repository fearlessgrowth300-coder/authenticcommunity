import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { StoriesRow } from '@/components/feed/StoriesRow'
import { PostCard, PostItem } from '@/components/feed/PostCard'
import {
  PeopleYouMayConnectWithModule,
  CommunitiesForYouModule,
  EventsNearYouModule,
} from '@/components/feed/FeedModules'
import {
  Search,
  Bell,
  Users,
} from 'lucide-react-native'

const FEED_TABS = ['For You', 'Following', 'Nearby'] as const
type FeedTab = (typeof FEED_TABS)[number]

const SAMPLE_POSTS: PostItem[] = [
  {
    id: 'p1',
    authorId: 'maya-patel',
    authorName: 'Maya Patel',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    isVerified: true,
    location: 'Lagos, Nigeria',
    topic: 'Community',
    timeAgo: '2h ago',
    text: 'Building authentic communities is not about follower vanity—it’s about creating safe spaces where people genuinely connect, exchange ideas, and build lasting friendships. So excited for our upcoming weekend meetup! 🌿✨',
    images: [
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80',
    ],
    likesCount: 38,
    commentsCount: 12,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
  },
  {
    id: 'p2',
    authorId: 'david-chen',
    authorName: 'David Chen',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    isVerified: true,
    location: 'Lagos · Tech Hub',
    topic: 'Technology',
    timeAgo: '4h ago',
    text: 'Just finished prototyping our new local matching algorithm with deterministic local-first proximity. What are your favorite tech events in the city this week?',
    likesCount: 24,
    commentsCount: 7,
    isLiked: true,
    isSaved: true,
    isFollowing: true,
  },
  {
    id: 'p3',
    authorId: 'elena-rostova',
    authorName: 'Elena Rostova',
    authorAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    isVerified: true,
    location: 'Lagos · Nature',
    topic: 'Wellness',
    timeAgo: '6h ago',
    text: 'Morning sunrise yoga and meditation by the beach. Grounding yourself before the week starts makes all the difference. 🧘‍♀️🌊',
    videoUrl: 'https://sample-video.mp4',
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&fit=crop&q=80',
    ],
    likesCount: 52,
    commentsCount: 19,
    isLiked: false,
    isSaved: false,
    isFollowing: false,
  },
]

export default function HomeFeedScreen() {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<FeedTab>('For You')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
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
            <View style={styles.unreadBadge} />
          </TouchableOpacity>
        </View>
      </View>

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
        {/* 2. Stories Row */}
        <StoriesRow myAvatarUrl={profile?.profile_image_url || undefined} />

        {/* 3. Feed Tabs (For You, Following, Nearby) */}
        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            {FEED_TABS.map((tab) => {
              const isSelected = activeTab === tab
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.feedTab,
                    isSelected ? styles.feedTabActive : null,
                  ]}
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

        {/* 4. Mixed Social Feed Stream */}
        {/* Post 1 */}
        <PostCard post={SAMPLE_POSTS[0]} />

        {/* Module 1: People you may connect with */}
        <PeopleYouMayConnectWithModule />

        {/* Post 2 */}
        <PostCard post={SAMPLE_POSTS[1]} />

        {/* Module 2: Communities for you */}
        <CommunitiesForYouModule />

        {/* Post 3 */}
        <PostCard post={SAMPLE_POSTS[2]} />

        {/* Module 3: Events near you */}
        <EventsNearYouModule />
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
  unreadBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
})
