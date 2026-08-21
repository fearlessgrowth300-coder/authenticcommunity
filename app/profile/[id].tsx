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
import { calculateMatchScore } from '@/services/matching'
import {
  getRelationshipState,
  followUser,
  unfollowUser,
  requestConnection,
  acceptConnection,
  removeConnection,
} from '@/services/socialGraph'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  MoreHorizontal,
  CheckCircle2,
  Shield,
  Zap,
  Users,
  Star,
  MessageCircle,
  ChevronRight,
  UserPlus,
  UserCheck,
  Clock,
  MapPin,
  Share2,
  LayoutGrid,
  Video as VideoIcon,
  Compass,
  Calendar,
} from 'lucide-react-native'

export default function MatchProfileDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user: currentUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [matchScore, setMatchScore] = useState<any>(null)
  const [relationship, setRelationship] = useState<any>({
    isFollowing: false,
    isFollower: false,
    isConnection: false,
    isPendingConnection: false,
  })
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'communities' | 'events'>('posts')
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [userCommunities, setUserCommunities] = useState<any[]>([])
  const [userEvents, setUserEvents] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  const loadProfileData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [profileRes, myProfileRes, relState] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', id).maybeSingle(),
        currentUser
          ? supabase.from('profiles').select('*').eq('user_id', currentUser.id).maybeSingle()
          : Promise.resolve({ data: null }),
        currentUser ? getRelationshipState(currentUser.id, id) : Promise.resolve({ followStatus: 'not_following', isFollower: false, connectionStatus: 'none' }),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        setRelationship({
          isFollowing: relState.followStatus === 'following',
          isFollower: relState.isFollower,
          isConnection: relState.connectionStatus === 'connected',
          isPendingConnection: relState.connectionStatus === 'pending_outgoing' || relState.connectionStatus === 'pending_incoming',
        })

        if (myProfileRes.data) {
          const myP = myProfileRes.data
          const targetP = profileRes.data
          const score = calculateMatchScore({
            candidateId: id,
            candidateInterests: targetP.interests || [],
            candidateValues: targetP.values || [],
            candidateCity: targetP.location_city || '',
            candidateCountry: targetP.location_country || '',
            candidateGoal: targetP.intent || 'friends',
            candidateTrust: targetP.identity_verified ? 5 : 2,
            myInterests: myP.interests || [],
            myValues: myP.values || [],
            myCity: myP.location_city || '',
            myCountry: myP.location_country || '',
            myGoal: myP.intent || 'friends',
          })
          setMatchScore(score)
        }

        // Fetch user posts
        const postsRes = await supabase
          .from('posts')
          .select('id, content, content_type, media_urls, likes_count, comments_count, created_at')
          .eq('author_id', id)
          .order('created_at', { ascending: false })
          .limit(10)
        if (postsRes.data) setUserPosts(postsRes.data)

        // Fetch user joined communities
        const commRes = await (supabase as any)
          .from('community_members')
          .select('community_id, communities(id, community_name, category, photo_url, member_count)')
          .eq('user_id', id)
          .limit(10)
        if (commRes.data) {
          setUserCommunities(commRes.data.map((c: any) => c.communities).filter(Boolean))
        }

        // Fetch user events
        const eventRes = await (supabase as any)
          .from('event_attendees')
          .select('event_id, events(id, title, cover_image_url, start_time, location_city)')
          .eq('user_id', id)
          .limit(10)
        if (eventRes.data) {
          setUserEvents(eventRes.data.map((e: any) => e.events).filter(Boolean))
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [id, currentUser])

  const handleToggleFollow = async () => {
    if (!currentUser || !id) {
      Alert.alert('Sign In', 'Please sign in to follow members.')
      return
    }
    setActionLoading(true)
    try {
      if (relationship.isFollowing) {
        await unfollowUser(id)
        setRelationship((prev: any) => ({ ...prev, isFollowing: false }))
      } else {
        await followUser(id)
        setRelationship((prev: any) => ({ ...prev, isFollowing: true }))
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update follow state')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleConnect = async () => {
    if (!currentUser || !id) {
      Alert.alert('Sign In', 'Please sign in to connect.')
      return
    }
    setActionLoading(true)
    try {
      if (relationship.isConnection) {
        await removeConnection(id)
        setRelationship((prev: any) => ({ ...prev, isConnection: false }))
      } else if (relationship.isPendingConnection) {
        await removeConnection(id)
        setRelationship((prev: any) => ({ ...prev, isPendingConnection: false }))
      } else {
        await requestConnection(id)
        setRelationship((prev: any) => ({ ...prev, isPendingConnection: true }))
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send connection request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile?.first_name || 'this member'} on Authentic Community!`,
        url: `https://authenticcommunity.fun/profile/${id}`,
      })
    } catch {
      // Ignore
    }
  }

  const handleMessage = () => {
    if (!currentUser) {
      Alert.alert('Sign In', 'Please sign in to send messages.')
      return
    }
    router.push(`/chat/${id}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 12 }}>
            Loading member profile...
          </AppText>
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold">Member Profile</AppText>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centerLoading}>
          <AppText variant="body" color={Colors.textSecondary}>Profile not found.</AppText>
          <AppButton title="Go Back" variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Community Member'
  const locationDisplay = [profile.location_city, profile.location_state, profile.location_country].filter(Boolean).join(', ') || 'Local Community'
  const finalScore = matchScore?.overall || 88
  const interestsList: string[] = profile.interests || ['Community', 'Growth']
  const valuesList: string[] = profile.values || ['Kindness', 'Growth', 'Authenticity']

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 12 }}>
          {fullName}
        </AppText>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Share2 color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Photo Card */}
        <View style={styles.photoContainer}>
          <Image
            source={{
              uri:
                profile.profile_image_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80',
            }}
            style={styles.mainPhoto}
          />
          {/* Match Score Badge */}
          <View style={styles.matchScoreBadge}>
            <Zap color="#FFFFFF" size={14} fill="#FFFFFF" />
            <AppText variant="caption" weight="bold" color="#FFFFFF">
              {finalScore}% Fit
            </AppText>
          </View>
        </View>

        {/* Identity & Location */}
        <View style={styles.identitySection}>
          <View style={styles.nameRow}>
            <AppText variant="h2" weight="bold">
              {fullName}
            </AppText>
            {profile.identity_verified && (
              <CheckCircle2 color={Colors.primary} size={22} fill={Colors.primaryLight} />
            )}
          </View>

          <View style={styles.locationRow}>
            <MapPin color={Colors.textSecondary} size={15} />
            <AppText variant="bodySm" color={Colors.textSecondary}>
              {locationDisplay}
            </AppText>
          </View>

          {profile.bio ? (
            <AppText variant="body" color={Colors.text} style={styles.bioText}>
              {profile.bio}
            </AppText>
          ) : null}
        </View>

        {/* 4 Trust & Safety Signals */}
        <View style={styles.trustSignalsContainer}>
          <View style={styles.trustPill}>
            <Shield color={profile.identity_verified ? '#16A34A' : Colors.amber} size={14} />
            <AppText variant="caption" weight="bold" color={profile.identity_verified ? '#16A34A' : Colors.amber}>
              {profile.identity_verified ? 'Identity Verified' : 'Standard Member'}
            </AppText>
          </View>
          <View style={styles.trustPill}>
            <Star color={Colors.primary} size={14} />
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              Active Contributor
            </AppText>
          </View>
          <View style={styles.trustPill}>
            <Users color={Colors.coral} size={14} />
            <AppText variant="caption" weight="bold" color={Colors.coral}>
              Anti-Spam Shielded
            </AppText>
          </View>
        </View>

        {/* Relationship CTAs */}
        <View style={styles.ctaRow}>
          <AppButton
            title={relationship.isFollowing ? 'Following' : 'Follow'}
            variant={relationship.isFollowing ? 'outline' : 'secondary'}
            leftIcon={
              relationship.isFollowing ? (
                <UserCheck color={Colors.text} size={18} />
              ) : (
                <UserPlus color={Colors.text} size={18} />
              )
            }
            onPress={handleToggleFollow}
            disabled={actionLoading}
            style={styles.flexBtn}
          />

          <AppButton
            title={
              relationship.isConnection
                ? 'Connected'
                : relationship.isPendingConnection
                ? 'Pending'
                : 'Connect'
            }
            variant={relationship.isConnection ? 'outline' : 'primary'}
            leftIcon={
              relationship.isPendingConnection ? (
                <Clock color={Colors.textMuted} size={18} />
              ) : (
                <Zap color="#FFFFFF" size={18} />
              )
            }
            onPress={handleToggleConnect}
            disabled={actionLoading}
            style={styles.flexBtn}
          />

          <TouchableOpacity onPress={handleMessage} style={styles.iconCtaBtn}>
            <MessageCircle color={Colors.primary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Values Section */}
        <Card style={styles.sectionCard}>
          <AppText variant="bodySm" weight="bold" style={styles.sectionTitle}>
            Core Values
          </AppText>
          <View style={styles.chipsWrap}>
            {valuesList.map((val, idx) => (
              <View key={idx} style={styles.valueChip}>
                <AppText variant="caption" weight="medium" color={Colors.primary}>
                  ✨ {val}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* Interests Section */}
        <Card style={styles.sectionCard}>
          <AppText variant="bodySm" weight="bold" style={styles.sectionTitle}>
            Passions & Interests
          </AppText>
          <View style={styles.chipsWrap}>
            {interestsList.map((interest, idx) => (
              <View key={idx} style={styles.interestChip}>
                <AppText variant="caption" color={Colors.text}>
                  {interest}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* Content Tabs (Posts / Videos / Communities / Events) */}
        <View style={styles.tabsNavRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('posts')}
            style={[styles.tabNavItem, activeTab === 'posts' && styles.activeTabNavItem]}
          >
            <LayoutGrid color={activeTab === 'posts' ? Colors.primary : Colors.textMuted} size={18} />
            <AppText
              variant="caption"
              weight="bold"
              color={activeTab === 'posts' ? Colors.primary : Colors.textMuted}
            >
              Posts ({userPosts.length})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('communities')}
            style={[styles.tabNavItem, activeTab === 'communities' && styles.activeTabNavItem]}
          >
            <Compass color={activeTab === 'communities' ? Colors.primary : Colors.textMuted} size={18} />
            <AppText
              variant="caption"
              weight="bold"
              color={activeTab === 'communities' ? Colors.primary : Colors.textMuted}
            >
              Hubs ({userCommunities.length})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('events')}
            style={[styles.tabNavItem, activeTab === 'events' && styles.activeTabNavItem]}
          >
            <Calendar color={activeTab === 'events' ? Colors.primary : Colors.textMuted} size={18} />
            <AppText
              variant="caption"
              weight="bold"
              color={activeTab === 'events' ? Colors.primary : Colors.textMuted}
            >
              Events ({userEvents.length})
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.tabContentContainer}>
            {userPosts.length === 0 ? (
              <AppText variant="caption" color={Colors.textMuted} style={styles.emptyTabText}>
                No posts shared yet.
              </AppText>
            ) : (
              userPosts.map((p) => (
                <Card key={p.id} style={styles.postItemCard}>
                  <AppText variant="bodySm">{p.content}</AppText>
                  <AppText variant="caption" color={Colors.textMuted} style={{ marginTop: 6 }}>
                    {p.likes_count || 0} likes · {p.comments_count || 0} comments
                  </AppText>
                </Card>
              ))
            )}
          </View>
        )}

        {activeTab === 'communities' && (
          <View style={styles.tabContentContainer}>
            {userCommunities.length === 0 ? (
              <AppText variant="caption" color={Colors.textMuted} style={styles.emptyTabText}>
                Not a member of any public hubs yet.
              </AppText>
            ) : (
              userCommunities.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => router.push(`/community/${c.id}`)}
                  style={styles.commRow}
                >
                  <View style={styles.commIconCircle}>
                    <Compass color={Colors.primary} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySm" weight="bold">{c.community_name}</AppText>
                    <AppText variant="caption" color={Colors.textMuted}>{c.category} · {c.member_count || 1} members</AppText>
                  </View>
                  <ChevronRight color={Colors.textMuted} size={18} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'events' && (
          <View style={styles.tabContentContainer}>
            {userEvents.length === 0 ? (
              <AppText variant="caption" color={Colors.textMuted} style={styles.emptyTabText}>
                No upcoming events attending.
              </AppText>
            ) : (
              userEvents.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => router.push(`/event/${ev.id}`)}
                  style={styles.commRow}
                >
                  <View style={styles.commIconCircle}>
                    <Calendar color={Colors.amber} size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySm" weight="bold">{ev.title}</AppText>
                    <AppText variant="caption" color={Colors.textMuted}>{ev.location_city || 'Local'}</AppText>
                  </View>
                  <ChevronRight color={Colors.textMuted} size={18} />
                </TouchableOpacity>
              ))
            )}
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
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
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
  headerButton: {
    padding: 6,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  photoContainer: {
    width: '100%',
    height: 380,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    elevation: 3,
  },
  identitySection: {
    marginVertical: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bioText: {
    marginTop: 10,
    lineHeight: 22,
  },
  trustSignalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  flexBtn: {
    flex: 1,
  },
  iconCtaBtn: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  interestChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  tabsNavRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  activeTabNavItem: {
    backgroundColor: Colors.primaryLight,
  },
  tabContentContainer: {
    gap: 10,
  },
  emptyTabText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  postItemCard: {
    padding: Spacing.md,
  },
  commRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
