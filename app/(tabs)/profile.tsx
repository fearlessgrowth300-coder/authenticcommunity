import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { getProfileSocialStats, SocialProfileStats } from '@/services/socialGraph'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { PostCard } from '@/components/feed/PostCard'
import { MobilePostItem } from '@/services/feed'
import {
  MapPin,
  LogOut,
  Edit3,
  Share2,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Heart,
  ChevronRight,
} from 'lucide-react-native'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [userPosts, setUserPosts] = useState<MobilePostItem[]>([])
  const [stats, setStats] = useState<SocialProfileStats>({
    followersCount: 0,
    followingCount: 0,
    connectionsCount: 0,
  })
  const [interests, setInterests] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])
  const [contentTab, setContentTab] = useState<'Posts' | 'Videos' | 'Communities' | 'Events'>('Posts')
  const [joinedCommunities, setJoinedCommunities] = useState<Array<{ id: string; name: string; image: string | null }>>([])
  const [profileEvents, setProfileEvents] = useState<Array<{ id: string; name: string; date: string | null; location: string | null }>>([])

  const loadProfileData = async () => {
    if (!user) return
    try {
      const socialStats = await getProfileSocialStats(user.id)
      setStats(socialStats)

      const [intRes, valRes, postsRes, communitiesRes, eventsRes] = await Promise.all([
        supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
        supabase.from('user_values').select('value_name').eq('user_id', user.id),
        (supabase as any)
          .from('posts')
          .select('id, user_id, content, visibility, location_label, interest_tags, created_at, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20),
        (supabase as any)
          .from('community_members')
          .select('community_id, communities(id, community_name, profile_image_url)')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        (supabase as any)
          .from('events')
          .select('id, name, event_date, location')
          .eq('organizer_id', user.id)
          .order('event_date', { ascending: false })
          .limit(20),
      ])

      setJoinedCommunities((communitiesRes.data || []).map((row: any) => ({
        id: row.communities?.id || row.community_id,
        name: row.communities?.community_name || 'Community',
        image: row.communities?.profile_image_url || null,
      })))
      setProfileEvents((eventsRes.data || []).map((event: any) => ({
        id: event.id,
        name: event.name,
        date: event.event_date,
        location: event.location,
      })))

      if (intRes.data && intRes.data.length > 0) {
        setInterests(intRes.data.map((i) => i.interest_name))
      }
      if (valRes.data && valRes.data.length > 0) {
        setValues(valRes.data.map((v) => v.value_name))
      }

      if (postsRes.data && postsRes.data.length > 0) {
        const postIds = postsRes.data.map((p: any) => p.id)
        const [mediaRes, likesRes, commentsRes] = await Promise.all([
          (supabase as any).from('post_media').select('post_id, media_url, media_type').in('post_id', postIds),
          (supabase as any).from('post_likes').select('post_id').in('post_id', postIds),
          (supabase as any).from('post_comments').select('post_id').in('post_id', postIds),
        ])

        const mediaMap = new Map<string, { images: string[]; videoUrl?: string }>()
        ;(mediaRes.data || []).forEach((m: any) => {
          if (!mediaMap.has(m.post_id)) mediaMap.set(m.post_id, { images: [] })
          if (m.media_type === 'video') mediaMap.get(m.post_id)!.videoUrl = m.media_url
          else mediaMap.get(m.post_id)!.images.push(m.media_url)
        })

        const likesMap = new Map<string, number>()
        ;(likesRes.data || []).forEach((l: any) => {
          likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1)
        })

        const commentsMap = new Map<string, number>()
        ;(commentsRes.data || []).forEach((c: any) => {
          commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1)
        })

        const mapped: MobilePostItem[] = postsRes.data.map((p: any) => {
          const m = mediaMap.get(p.id)
          return {
            id: p.id,
            authorId: user.id,
            authorName: `${profile?.first_name || 'You'} ${profile?.last_name || ''}`.trim(),
            authorAvatar: profile?.profile_image_url || null,
            isVerified: Boolean(profile?.is_verified),
            location: p.location_label || profile?.location_city || 'Local',
            topic: (p.interest_tags && p.interest_tags[0]) || 'General',
            timeAgo: 'Recently',
            text: p.content || '',
            images: m?.images || [],
            videoUrl: m?.videoUrl,
            likesCount: likesMap.get(p.id) || 0,
            commentsCount: commentsMap.get(p.id) || 0,
            isLiked: false,
            isSaved: false,
            isFollowing: true,
          }
        })
        setUserPosts(mapped)
      } else {
        setUserPosts([])
      }
    } catch {
      // Graceful fallback
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProfileData()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  const fullName = `${profile?.first_name || 'Jane'} ${profile?.last_name || 'Doe'}`

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <AppText variant="h2" weight="bold">
          My Profile
        </AppText>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
          accessibilityLabel="Settings"
        >
          <Settings color={Colors.text} size={22} />
        </TouchableOpacity>
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
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <Image
              source={{
                uri:
                  profile?.profile_image_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            {profile?.is_verified && (
              <View style={styles.verifiedBadgeOverlay}>
                <VerifiedBadge size={20} />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <AppText variant="h2" weight="bold">
              {fullName}
            </AppText>
          </View>

          {profile?.location_city && (
            <View style={styles.locationRow}>
              <MapPin color={Colors.textSecondary} size={14} />
              <AppText variant="bodySm" color={Colors.textSecondary}>
                {profile.location_city}, {profile.location_country || 'USA'}
              </AppText>
            </View>
          )}

          {profile?.bio ? (
            <AppText variant="bodySm" color={Colors.text} style={styles.bioText} align="center">
              {profile.bio}
            </AppText>
          ) : (
            <AppText variant="caption" color={Colors.textMuted} style={styles.bioText} align="center">
              Add a bio to let other members know about your passions!
            </AppText>
          )}

          {/* Social Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              onPress={() => router.push('/profile/followers')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.text}>
                {stats.followersCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Followers
              </AppText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              onPress={() => router.push('/profile/following')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.text}>
                {stats.followingCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Following
              </AppText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              onPress={() => router.push('/profile/connections')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.primary}>
                {stats.connectionsCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Connections
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Edit & Share Profile Actions */}
          <View style={styles.actionButtonsRow}>
            <AppButton
              title="Edit Profile"
              variant="outline"
              size="sm"
              leftIcon={<Edit3 color={Colors.text} size={16} />}
              onPress={() => router.push('/profile/edit')}
              style={styles.editBtn}
            />
            <TouchableOpacity
              onPress={() => Share.share({
                title: 'Authentic Community profile',
                message: `Connect with ${fullName} on Authentic Community.`,
              })}
              style={styles.shareBtn}
              accessibilityLabel="Share profile"
            >
              <Share2 color={Colors.text} size={18} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Interests Section */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Interests
          </AppText>
          <View style={styles.chipsWrap}>
            {interests.map((int, idx) => (
              <View key={idx} style={styles.interestChip}>
                <AppText variant="caption" color={Colors.text}>
                  {int}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Values
          </AppText>
          <View style={styles.chipsWrap}>
            {values.map((val, idx) => (
              <View key={idx} style={styles.valueChip}>
                <AppText variant="caption" color={Colors.primaryDark}>
                  {val}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Signals & Verification Info Card */}
        <View style={styles.section}>
          <Card style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <ShieldCheck
                color={profile?.is_verified ? Colors.sage : Colors.textMuted}
                size={20}
              />
              <View style={styles.trustHeaderText}>
                <AppText variant="bodySm" weight="bold">
                  {profile?.is_verified ? 'Verified Member' : 'Standard Member'}
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {profile?.is_verified
                    ? 'Identity confirmed by authentic verification'
                    : 'Verification is managed securely on server'}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        {/* Profile content tabs */}
        <View style={styles.section}>
          <View style={styles.contentTabs}>
            {(['Posts', 'Videos', 'Communities', 'Events'] as const).map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setContentTab(tab)} style={[styles.contentTab, contentTab === tab ? styles.contentTabActive : null]}>
                <AppText variant="caption" weight={contentTab === tab ? 'bold' : 'medium'} color={contentTab === tab ? Colors.primary : Colors.textSecondary}>{tab}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {contentTab === 'Posts' && userPosts.length === 0 ? (
            <Card style={styles.emptyPostsCard}>
              <AppText variant="caption" color={Colors.textSecondary} align="center">
                You haven't posted anything yet. Share your first update!
              </AppText>
              <AppButton title="Create Post" size="sm" onPress={() => router.push('/post/create')} />
            </Card>
          ) : contentTab === 'Posts' ? (
            userPosts.filter((post) => !post.videoUrl).map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onPostDismissed={(id) => setUserPosts((prev) => prev.filter((item) => item.id !== id))}
              />
            ))
          ) : contentTab === 'Videos' ? (
            userPosts.filter((post) => Boolean(post.videoUrl)).length === 0 ? (
              <Card style={styles.emptyPostsCard}><AppText variant="caption" color={Colors.textSecondary}>No videos yet.</AppText><AppButton title="Upload Video" size="sm" onPress={() => router.push('/post/create?type=video')} /></Card>
            ) : userPosts.filter((post) => Boolean(post.videoUrl)).map((post) => (
              <PostCard key={post.id} post={post} onPostDismissed={(id) => setUserPosts((prev) => prev.filter((item) => item.id !== id))} />
            ))
          ) : contentTab === 'Communities' ? (
            joinedCommunities.length === 0 ? (
              <Card style={styles.emptyPostsCard}><AppText variant="caption" color={Colors.textSecondary}>You have not joined a community yet.</AppText><AppButton title="Discover Communities" size="sm" onPress={() => router.push('/(tabs)/discover')} /></Card>
            ) : joinedCommunities.map((community) => (
              <TouchableOpacity key={community.id} onPress={() => router.push(`/community/${community.id}`)} style={styles.profileListRow}>
                {community.image ? <Image source={{ uri: community.image }} style={styles.listImage} /> : <View style={styles.listImagePlaceholder}><Users color={Colors.primary} size={18} /></View>}
                <AppText variant="bodySm" weight="semibold" style={{ flex: 1 }}>{community.name}</AppText>
                <ChevronRight color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            ))
          ) : profileEvents.length === 0 ? (
            <Card style={styles.emptyPostsCard}><AppText variant="caption" color={Colors.textSecondary}>You have not created an event yet.</AppText><AppButton title="Create Event" size="sm" onPress={() => router.push('/event/create')} /></Card>
          ) : (
            profileEvents.map((event) => (
              <TouchableOpacity key={event.id} onPress={() => router.push(`/event/${event.id}`)} style={styles.profileListRow}>
                <View style={styles.eventDateBadge}><AppText variant="caption" weight="bold" color={Colors.primary}>{event.date ? new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon'}</AppText></View>
                <View style={{ flex: 1 }}><AppText variant="bodySm" weight="semibold">{event.name}</AppText><AppText variant="caption" color={Colors.textSecondary}>{event.location || 'Location to be confirmed'}</AppText></View>
                <ChevronRight color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Log Out Action */}
        <View style={styles.logoutSection}>
          <AppButton
            title="Log Out"
            variant="danger"
            leftIcon={<LogOut color={Colors.surface} size={18} />}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contentTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  contentTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  profileListRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  listImage: { width: 42, height: 42, borderRadius: 10 },
  listImagePlaceholder: { width: 42, height: 42, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  eventDateBadge: { minWidth: 48, height: 42, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  profileCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.border,
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  bioText: {
    lineHeight: 20,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  editBtn: {
    flex: 1,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  trustCard: {
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustHeaderText: {
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  emptyPostsCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  logoutSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
})
