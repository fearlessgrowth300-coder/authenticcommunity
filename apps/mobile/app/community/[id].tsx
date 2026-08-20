import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { PostCard } from '@/components/feed/PostCard'
import { EventCard, EventItem } from '@/components/events/EventCard'
import { MobilePostItem } from '@/services/feed'
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Users,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Lock,
  Globe,
  Settings,
  Plus,
  Hash,
} from 'lucide-react-native'

const COMMUNITY_TABS = ['Feed', 'Chat', 'Events', 'Members', 'About'] as const
type CommunityTab = (typeof COMMUNITY_TABS)[number]

const COMMUNITY_CHANNELS = [
  'general',
  'introductions',
  'events',
  'opportunities',
  'resources',
  'off-topic',
]

const SAMPLE_POST: MobilePostItem = {
  id: 'cp-1',
  authorId: 'maya-patel',
  authorName: 'Maya Patel (Admin)',
  authorAvatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
  isVerified: true,
  location: 'Lagos Creators Hub',
  topic: 'Announcement',
  timeAgo: '1h ago',
  text: '📌 Welcome all new members to Lagos Creators & Builders! Check out the #introductions channel to say hello and share what you are working on!',
  likesCount: 42,
  commentsCount: 15,
  isLiked: true,
  isSaved: true,
  isFollowing: true,
}

const SAMPLE_EVENT: EventItem = {
  id: 'e2',
  title: 'Tech Founders Coffee & Hike',
  host: 'Lagos Creators & Builders',
  dateMonth: 'JUN',
  dateDay: '16',
  dateDayOfWeek: 'SUN',
  dateTimeFormatted: 'Sun, Jun 16 · 9:00 AM',
  distance: '1.4 km away',
  imageUrl:
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&fit=crop&q=80',
  attendeesCount: 28,
}

export default function CommunityDetailScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<CommunityTab>('Feed')
  const [isJoined, setIsJoined] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member' | 'guest'>('guest')
  const [activeChannel, setActiveChannel] = useState('general')
  const [loading, setLoading] = useState(true)
  const [communityData, setCommunityData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const loadCommunity = async () => {
      setLoading(true)
      try {
        const { data: comm } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (comm) {
          setCommunityData(comm)
        }

        if (user) {
          const { data: member } = await supabase
            .from('community_members')
            .select('role')
            .eq('community_id', id)
            .eq('user_id', user.id)
            .maybeSingle()

          if (member) {
            setIsJoined(true)
            setUserRole((member as any).role || 'member')
          } else {
            setIsJoined(false)
            setUserRole('guest')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadCommunity()
  }, [id, user])

  const handleToggleJoin = async () => {
    if (!user || !id) return
    if (isJoined) {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', id)
        .eq('user_id', user.id)
      setIsJoined(false)
      setUserRole('guest')
    } else {
      await supabase
        .from('community_members')
        .insert({
          community_id: id,
          user_id: user.id,
          role: 'member',
        })
      setIsJoined(true)
      setUserRole('member')
    }
  }

  const community = {
    name: communityData?.community_name || 'Community Hub',
    membersCount: communityData?.member_count || 1,
    onlineCount: Math.max(1, Math.round((communityData?.member_count || 1) * 0.1)),
    type: 'Hybrid (Local & Online)',
    privacy: communityData?.is_private ? 'Private' : 'Public',
    category: communityData?.category || 'General',
    coverImage:
      communityData?.cover_image_url ||
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&fit=crop&q=80',
    avatarUrl:
      communityData?.profile_image_url ||
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&fit=crop&q=80',
    description:
      communityData?.description ||
      'A welcoming local community space to connect, share experiences, and grow together.',
    rules: [
      'Be respectful, inclusive, and constructive.',
      'No spam, self-promotion, or unsolicited promotional DMs.',
      'Celebrate diverse perspectives and foster real friendships.',
    ],
  }

  const isAdmin = userRole === 'owner' || userRole === 'admin' || userRole === 'moderator'

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image & Header */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: community.coverImage }} style={styles.coverImage} />
          <View style={styles.heroOverlay} />

          <SafeAreaView style={styles.heroNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navCircleBtn}>
              <ArrowLeft color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <View style={styles.heroRightActions}>
              <TouchableOpacity style={styles.navCircleBtn}>
                <Share2 color="#FFFFFF" size={18} />
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => router.push(`/community/admin/${id}`)}
                  style={styles.navCircleBtn}
                  accessibilityLabel="Community Admin"
                >
                  <Settings color="#FFFFFF" size={18} />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>

        {/* Community Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.avatarRow}>
            <Image source={{ uri: community.avatarUrl }} style={styles.communityAvatar} />
            <View style={styles.trustBadgeWrap}>
              <ShieldCheck color={Colors.primary} size={16} />
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                Trusted Space
              </AppText>
            </View>
          </View>

          <AppText variant="h1" weight="bold">
            {community.name}
          </AppText>

          <View style={styles.metaRow}>
            <AppText variant="caption" color={Colors.textSecondary}>
              {community.membersCount} members · {community.onlineCount} online · {community.type}
            </AppText>
          </View>

          {/* Action Buttons: Join, Invite, Share */}
          <View style={styles.actionRow}>
            <AppButton
              title={isJoined ? 'Joined ✓' : 'Join Community'}
              variant={isJoined ? 'secondary' : 'primary'}
              onPress={handleToggleJoin}
              style={styles.joinBtn}
            />
            <TouchableOpacity style={styles.iconBtn}>
              <Share2 color={Colors.text} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5 Sub-Tabs (Feed, Chat, Events, Members, About) */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {COMMUNITY_TABS.map((tab) => {
              const isSelected = activeTab === tab
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabItem,
                    isSelected ? styles.tabItemActive : null,
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
          </ScrollView>
        </View>

        {/* Tab Views */}
        {activeTab === 'Feed' && (
          <View style={styles.tabContent}>
            {/* Compose Box */}
            <TouchableOpacity
              onPress={() => router.push('/post/create')}
              style={styles.composeBox}
            >
              <Image source={{ uri: community.avatarUrl }} style={styles.composeAvatar} />
              <AppText variant="bodySm" color={Colors.textMuted}>
                Share with the community...
              </AppText>
            </TouchableOpacity>

            <PostCard post={SAMPLE_POST} />
          </View>
        )}

        {activeTab === 'Chat' && (
          <View style={styles.tabContent}>
            {/* Channels Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.channelsBar}
            >
              {COMMUNITY_CHANNELS.map((ch) => (
                <TouchableOpacity
                  key={ch}
                  onPress={() => setActiveChannel(ch)}
                  style={[
                    styles.channelChip,
                    activeChannel === ch ? styles.channelChipActive : null,
                  ]}
                >
                  <Hash color={activeChannel === ch ? '#FFFFFF' : Colors.textSecondary} size={14} />
                  <AppText
                    variant="caption"
                    weight={activeChannel === ch ? 'bold' : 'normal'}
                    color={activeChannel === ch ? '#FFFFFF' : Colors.text}
                  >
                    {ch}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Card style={styles.chatShortcutCard}>
              <View style={styles.chatShortcutInfo}>
                <AppText variant="bodySm" weight="bold">
                  #{activeChannel} Channel
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Tap below to open full real-time group chat
                </AppText>
              </View>
              <AppButton
                title="Open Chat"
                size="sm"
                onPress={() => router.push(`/community-chat/${id}`)}
              />
            </Card>
          </View>
        )}

        {activeTab === 'Events' && (
          <View style={styles.tabContent}>
            <View style={styles.eventsHeader}>
              <AppText variant="bodySm" weight="bold">
                Upcoming Community Events
              </AppText>
              <TouchableOpacity onPress={() => router.push('/event/create')}>
                <AppText variant="caption" weight="bold" color={Colors.primary}>
                  + Host Event
                </AppText>
              </TouchableOpacity>
            </View>
            <EventCard event={SAMPLE_EVENT} onPress={() => router.push('/event/e2')} />
          </View>
        )}

        {activeTab === 'Members' && (
          <View style={styles.tabContent}>
            <Card style={styles.memberCard}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
                }}
                style={styles.memberAvatar}
              />
              <View style={styles.memberInfo}>
                <View style={styles.memberNameRow}>
                  <AppText variant="bodySm" weight="bold">
                    Maya Patel
                  </AppText>
                  <View style={styles.adminRoleBadge}>
                    <AppText variant="caption" weight="bold" color={Colors.primary} style={styles.adminRoleText}>
                      Admin
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Product Designer · Lagos
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/profile/maya-patel')}
                style={styles.viewMemberBtn}
              >
                <AppText variant="caption" weight="bold" color={Colors.primary}>
                  View
                </AppText>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {activeTab === 'About' && (
          <View style={styles.aboutContainer}>
            <View style={styles.aboutSection}>
              <AppText variant="label" weight="bold">
                About Community
              </AppText>
              <AppText variant="bodySm" color={Colors.text} style={styles.aboutText}>
                {community.description}
              </AppText>
            </View>

            <View style={styles.aboutSection}>
              <AppText variant="label" weight="bold">
                Community Rules
              </AppText>
              {community.rules.map((rule, idx) => (
                <View key={idx} style={styles.ruleRow}>
                  <AppText variant="caption" weight="bold" color={Colors.primary}>
                    {idx + 1}.
                  </AppText>
                  <AppText variant="bodySm" color={Colors.textSecondary} style={styles.ruleText}>
                    {rule}
                  </AppText>
                </View>
              ))}
            </View>

            <View style={styles.aboutSection}>
              <AppText variant="label" weight="bold">
                Details
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Type: {community.type} · Privacy: {community.privacy} · Category: {community.category}
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  heroRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -38,
    marginBottom: 4,
  },
  communityAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: Colors.surface,
    backgroundColor: Colors.border,
  },
  trustBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  metaRow: {
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  joinBtn: {
    flex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 16,
  },
  tabItem: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  tabContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  composeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  composeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.border,
  },
  channelsBar: {
    gap: 8,
    marginBottom: Spacing.sm,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  channelChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chatShortcutCard: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatShortcutInfo: {
    flex: 1,
    gap: 2,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminRoleBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
  },
  adminRoleText: {
    fontSize: 9,
  },
  viewMemberBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  aboutContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  aboutSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  aboutText: {
    lineHeight: 20,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 2,
  },
  ruleText: {
    flex: 1,
    lineHeight: 18,
  },
})
