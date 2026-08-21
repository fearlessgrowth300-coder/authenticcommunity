import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Share,
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
import {
  ArrowLeft,
  Share2,
  Users,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Globe,
  Settings,
  Plus,
  Hash,
  ChevronRight,
  Shield,
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

export default function CommunityDetailScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [activeTab, setActiveTab] = useState<CommunityTab>('Feed')
  const [isJoined, setIsJoined] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member' | 'guest'>('guest')
  const [loading, setLoading] = useState(true)
  const [communityData, setCommunityData] = useState<any>(null)
  const [feedPosts, setFeedPosts] = useState<any[]>([])
  const [communityEvents, setCommunityEvents] = useState<any[]>([])
  const [membersList, setMembersList] = useState<any[]>([])
  const [memberCount, setMemberCount] = useState(1)

  const loadCommunity = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [commRes, memRes, postsRes, eventsRes, allMemsRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).maybeSingle(),
        user
          ? (supabase as any).from('community_members').select('role').eq('community_id', id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        (supabase as any)
          .from('posts')
          .select('*, profiles(first_name, last_name, profile_image_url, is_verified, location_city)')
          .or(`community_id.eq.${id},audience.eq.community`)
          .order('created_at', { ascending: false })
          .limit(10),
        (supabase as any)
          .from('events')
          .select('*, communities(community_name, photo_url)')
          .or(`community_id.eq.${id}`)
          .order('created_at', { ascending: false })
          .limit(10),
        (supabase as any)
          .from('community_members')
          .select('role, user_id, profiles(user_id, first_name, last_name, profile_image_url, is_verified, location_city)')
          .eq('community_id', id)
          .limit(20),
      ])

      if (commRes.data) {
        setCommunityData(commRes.data)
        setMemberCount(commRes.data.member_count || 1)
      }

      if (memRes.data) {
        setIsJoined(true)
        setUserRole(memRes.data.role || 'member')
      } else {
        setIsJoined(false)
        setUserRole('guest')
      }

      if (postsRes.data) setFeedPosts(postsRes.data)
      if (eventsRes.data) setCommunityEvents(eventsRes.data)
      if (allMemsRes.data) {
        setMembersList(
          allMemsRes.data.map((m: any) => ({
            role: m.role,
            userId: m.user_id,
            profile: m.profiles,
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunity()
  }, [id, user])

  const handleToggleJoin = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to join communities.')
      return
    }
    if (!id) return

    if (isJoined) {
      setIsJoined(false)
      setUserRole('guest')
      setMemberCount((prev) => Math.max(1, prev - 1))
      await (supabase as any).from('community_members').delete().eq('community_id', id).eq('user_id', user.id)
    } else {
      setIsJoined(true)
      setUserRole('member')
      setMemberCount((prev) => prev + 1)
      await (supabase as any).from('community_members').upsert({
        community_id: id,
        user_id: user.id,
        role: 'member',
      })
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join ${communityData?.community_name || 'this hub'} on Authentic Community!`,
        url: `https://authenticcommunity.fun/community/${id}`,
      })
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 12 }}>
            Loading community hub...
          </AppText>
        </View>
      </SafeAreaView>
    )
  }

  const name = communityData?.community_name || 'Community Hub'
  const category = communityData?.category || 'General'
  const location = communityData?.location_city || 'Local Area'
  const photo = communityData?.photo_url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80'
  const description = communityData?.description || 'A welcoming space for creators, builders, and community members.'

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="bodySm" weight="bold" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 8 }}>
          {name}
        </AppText>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Share2 color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          <Image source={{ uri: photo }} style={styles.coverPhoto} />
        </View>

        {/* Title, Badge & Meta */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <AppText variant="h2" weight="bold" style={{ flex: 1 }}>
              {name}
            </AppText>
            {(userRole === 'owner' || userRole === 'admin') && (
              <TouchableOpacity
                onPress={() => router.push(`/community/admin/${id}`)}
                style={styles.adminBadgeBtn}
              >
                <Settings color={Colors.primary} size={16} />
                <AppText variant="caption" weight="bold" color={Colors.primary}>
                  Admin
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Globe color={Colors.textSecondary} size={14} />
              <AppText variant="caption" color={Colors.textSecondary}>
                Public · {location}
              </AppText>
            </View>
            <View style={styles.metaPill}>
              <Users color={Colors.primary} size={14} />
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                {memberCount} members
              </AppText>
            </View>
          </View>

          {/* Join / Leave CTA */}
          <View style={styles.ctaRow}>
            <AppButton
              title={isJoined ? '✓ Joined' : 'Join Community'}
              variant={isJoined ? 'outline' : 'primary'}
              onPress={handleToggleJoin}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              onPress={() => router.push(`/community-chat/${id}`)}
              style={styles.chatIconBtn}
            >
              <MessageSquare color={Colors.primary} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Channels Row */}
        <View style={styles.channelsSection}>
          <AppText variant="caption" weight="bold" color={Colors.textSecondary} style={{ marginBottom: 8, paddingHorizontal: Spacing.md }}>
            CHANNELS
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsScroll}>
            {COMMUNITY_CHANNELS.map((ch) => (
              <TouchableOpacity
                key={ch}
                onPress={() => router.push(`/community-chat/${id}?channel=${ch}`)}
                style={styles.channelChip}
              >
                <Hash color={Colors.primary} size={14} />
                <AppText variant="caption" weight="medium" color={Colors.text}>
                  {ch}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsNavRow}>
          {COMMUNITY_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabNavItem, activeTab === tab && styles.activeTabNavItem]}
            >
              <AppText
                variant="caption"
                weight={activeTab === tab ? 'bold' : 'medium'}
                color={activeTab === tab ? Colors.primary : Colors.textSecondary}
              >
                {tab}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Viewport */}
        {activeTab === 'Feed' && (
          <View style={styles.tabContent}>
            {feedPosts.length === 0 ? (
              <View style={styles.emptyCard}>
                <AppText variant="bodySm" color={Colors.textSecondary}>
                  No community posts yet. Start the conversation!
                </AppText>
                <AppButton
                  title="Create Post"
                  variant="outline"
                  leftIcon={<Plus color={Colors.primary} size={16} />}
                  onPress={() => router.push('/post/create')}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              feedPosts.map((post) => (
                <Card key={post.id} style={styles.postCard}>
                  <View style={styles.postAuthorRow}>
                    <Image
                      source={{
                        uri: post.profiles?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                      }}
                      style={styles.postAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <AppText variant="bodySm" weight="bold">
                          {post.profiles?.first_name} {post.profiles?.last_name}
                        </AppText>
                        {post.profiles?.is_verified && <VerifiedBadge size={12} />}
                      </View>
                      <AppText variant="caption" color={Colors.textMuted}>
                        {new Date(post.created_at).toLocaleDateString()}
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="bodySm" style={{ marginTop: 8 }}>
                    {post.content}
                  </AppText>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'Chat' && (
          <View style={styles.tabContent}>
            <View style={styles.emptyCard}>
              <MessageSquare color={Colors.primary} size={32} />
              <AppText variant="bodySm" weight="bold" style={{ marginTop: 8 }}>
                Live Group Discussions
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
                Join members in real-time channel chats and updates.
              </AppText>
              <AppButton
                title="Open Community Chat"
                variant="primary"
                onPress={() => router.push(`/community-chat/${id}`)}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        )}

        {activeTab === 'Events' && (
          <View style={styles.tabContent}>
            {communityEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Calendar color={Colors.textMuted} size={32} />
                <AppText variant="bodySm" color={Colors.textSecondary} style={{ marginTop: 8 }}>
                  No upcoming community events scheduled.
                </AppText>
                <AppButton
                  title="Host an Event"
                  variant="outline"
                  onPress={() => router.push('/event/create')}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              communityEvents.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => router.push(`/event/${ev.id}`)}
                  style={styles.eventItemRow}
                >
                  <Calendar color={Colors.primary} size={20} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySm" weight="bold">{ev.title || ev.event_title}</AppText>
                    <AppText variant="caption" color={Colors.textMuted}>{ev.location_city || 'Local'}</AppText>
                  </View>
                  <ChevronRight color={Colors.textMuted} size={18} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'Members' && (
          <View style={styles.tabContent}>
            {membersList.map((m, idx) => {
              const p = m.profile
              const mName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member' : 'Member'
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => p?.user_id && router.push(`/profile/${p.user_id}`)}
                  style={styles.memberRow}
                >
                  <Image
                    source={{
                      uri: p?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                    }}
                    style={styles.memberAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppText variant="bodySm" weight="bold">{mName}</AppText>
                      {p?.is_verified && <VerifiedBadge size={12} />}
                    </View>
                    <AppText variant="caption" color={Colors.textMuted}>
                      {p?.location_city || 'Local'} · {m.role}
                    </AppText>
                  </View>
                  <ChevronRight color={Colors.textMuted} size={18} />
                </TouchableOpacity>
              )
            })}
          </View>
        )}

        {activeTab === 'About' && (
          <View style={styles.tabContent}>
            <Card style={styles.aboutCard}>
              <AppText variant="bodySm" weight="bold" style={{ marginBottom: 6 }}>
                About this Hub
              </AppText>
              <AppText variant="body" color={Colors.textSecondary} style={{ lineHeight: 22 }}>
                {description}
              </AppText>

              <AppText variant="bodySm" weight="bold" style={{ marginTop: 16, marginBottom: 6 }}>
                Category & Focus
              </AppText>
              <AppText variant="caption" color={Colors.primary} weight="bold">
                {category}
              </AppText>
            </Card>
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  coverPhotoContainer: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.border,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  mainInfo: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  chatIconBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelsSection: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  channelsScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabsNavRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabNavItem: {
    paddingVertical: 12,
    marginRight: 18,
  },
  activeTabNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabContent: {
    padding: Spacing.md,
    gap: 10,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postCard: {
    padding: Spacing.md,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
  },
  eventItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  aboutCard: {
    padding: Spacing.md,
  },
})
