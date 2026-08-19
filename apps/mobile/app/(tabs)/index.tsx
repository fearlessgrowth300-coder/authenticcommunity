import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  Menu,
  Bell,
  Search,
  SlidersHorizontal,
  Calendar,
  Users,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react-native'

export default function HomeScreen() {
  const router = useRouter()
  const { user, profile } = useAuth()

  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'highlights'>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([])
  const [rsvpedEvents, setRsvpedEvents] = useState<string[]>([])

  const firstName = profile?.first_name || 'Jane'
  const timeOfDay = new Date().getHours() < 12 ? 'morning' : 'afternoon'
  const greetingEmoji = timeOfDay === 'morning' ? '👋' : '☀️'

  const onRefresh = async () => {
    setRefreshing(true)
    // Refresh live state
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  const toggleJoinCommunity = (name: string) => {
    setJoinedCommunities((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    )
  }

  const toggleRsvp = (title: string) => {
    setRsvpedEvents((prev) =>
      prev.includes(title) ? prev.filter((e) => e !== title) : [...prev, title]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.push('/quick-start')}
          style={styles.headerIconButton}
          accessibilityLabel="Open Quick Start Guide"
        >
          <Menu color={Colors.text} size={24} />
        </TouchableOpacity>

        <View style={styles.greetingContainer}>
          <AppText variant="h3" weight="bold" numberOfLines={1}>
            Good {timeOfDay}, {firstName}! {greetingEmoji}
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {activeTab === 'dashboard'
              ? "Let's make meaningful connections today."
              : "Here's your community snapshot."}
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          style={styles.bellButton}
          accessibilityLabel="Open Notifications"
        >
          <Bell color={Colors.text} size={22} />
          <View style={styles.bellBadge} />
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search people, communities, or events..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal color={Colors.textMuted} size={18} />
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
        {/* Toggle Mode Pills: Dashboard vs Highlights */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            style={[
              styles.modePill,
              activeTab === 'dashboard' ? styles.modePillActive : null,
            ]}
          >
            <AppText
              variant="caption"
              weight={activeTab === 'dashboard' ? 'bold' : 'medium'}
              color={activeTab === 'dashboard' ? Colors.surface : Colors.textSecondary}
            >
              Dashboard
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('highlights')}
            style={[
              styles.modePill,
              activeTab === 'highlights' ? styles.modePillActive : null,
            ]}
          >
            <AppText
              variant="caption"
              weight={activeTab === 'highlights' ? 'bold' : 'medium'}
              color={activeTab === 'highlights' ? Colors.surface : Colors.textSecondary}
            >
              Highlights
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* VIEW 1: HOME DASHBOARD (Screen 1 in Reference) */}
        {/* ============================================================ */}
        {activeTab === 'dashboard' ? (
          <>
            {/* 1. Featured Connection */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Featured Connection
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <Card style={styles.featuredCard}>
              <View style={styles.featuredTopRow}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
                  }}
                  style={styles.featuredAvatar}
                />
                <View style={styles.featuredInfo}>
                  <View style={styles.nameBadgeRow}>
                    <AppText variant="body" weight="bold">
                      Sophie Martin
                    </AppText>
                    <View style={styles.newMatchBadge}>
                      <AppText variant="caption" weight="bold" color="#166534" style={styles.badgeLabel}>
                        New Match
                      </AppText>
                    </View>
                  </View>

                  <AppText variant="caption" color={Colors.textSecondary}>
                    Photographer · Austin, TX
                  </AppText>

                  <View style={styles.interestPills}>
                    <View style={styles.pill}>
                      <AppText variant="caption" color={Colors.primary}>Travel</AppText>
                    </View>
                    <View style={[styles.pill, { backgroundColor: '#F3E8FF' }]}>
                      <AppText variant="caption" color="#9333EA">Creativity</AppText>
                    </View>
                    <View style={[styles.pill, { backgroundColor: '#DCFCE7' }]}>
                      <AppText variant="caption" color="#16A34A">Outdoors</AppText>
                    </View>
                  </View>
                </View>
              </View>

              <AppText variant="caption" color={Colors.textSecondary} style={styles.matchReason}>
                You both love hiking and live in Austin!
              </AppText>

              <AppButton
                title="Say Hello"
                onPress={() => router.push('/(tabs)/messages')}
                style={styles.sayHelloButton}
              />
            </Card>

            {/* 2. Communities for You */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Communities for You
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollList}
            >
              <TouchableOpacity
                style={styles.communityCard}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300&fit=crop&q=80',
                  }}
                  style={styles.communityImage}
                />
                <View style={styles.communityCardBody}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    Austin Creatives
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    2.1K members
                  </AppText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.communityCard}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&fit=crop&q=80',
                  }}
                  style={styles.communityImage}
                />
                <View style={styles.communityCardBody}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    Wellness Together
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    1.8K members
                  </AppText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.communityCard}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&fit=crop&q=80',
                  }}
                  style={styles.communityImage}
                />
                <View style={styles.communityCardBody}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    Tech Connect
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    3.4K members
                  </AppText>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* 3. Events Nearby */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Events Nearby
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <Card style={styles.eventCard}>
              <View style={styles.eventLeft}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&fit=crop&q=80',
                  }}
                  style={styles.eventThumbnail}
                />
                <View style={styles.eventInfo}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    Sunset Hike at Mount Bonnell
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Sat, May 24 · 7:00 AM
                  </AppText>
                  <View style={styles.locationPinRow}>
                    <MapPin color={Colors.textMuted} size={11} />
                    <AppText variant="caption" color={Colors.textMuted}>
                      Mount Bonnell, Austin, TX
                    </AppText>
                  </View>
                  <View style={styles.attendeesRow}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
                      }}
                      style={styles.attendeeAvatar}
                    />
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
                      }}
                      style={[styles.attendeeAvatar, { marginLeft: -8 }]}
                    />
                    <AppText variant="caption" color={Colors.textSecondary} style={styles.attendeesCount}>
                      +12
                    </AppText>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleRsvp('Sunset Hike')}
                style={[
                  styles.rsvpButton,
                  rsvpedEvents.includes('Sunset Hike') ? styles.rsvpButtonActive : null,
                ]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  color={rsvpedEvents.includes('Sunset Hike') ? Colors.surface : Colors.surface}
                >
                  {rsvpedEvents.includes('Sunset Hike') ? 'RSVP ✓' : 'RSVP'}
                </AppText>
              </TouchableOpacity>
            </Card>

            {/* 4. Recent Conversations */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Recent Conversations
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/messages')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.conversationsList}>
              <TouchableOpacity
                style={styles.conversationRow}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
                  }}
                  style={styles.convoAvatar}
                />
                <View style={styles.convoContent}>
                  <AppText variant="bodySm" weight="bold">
                    Maya Patel
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                    That trail looks amazing!
                  </AppText>
                </View>
                <View style={styles.convoRight}>
                  <AppText variant="caption" color={Colors.textMuted}>
                    2m
                  </AppText>
                  <View style={styles.unreadDot} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.conversationRow}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
                  }}
                  style={styles.convoAvatar}
                />
                <View style={styles.convoContent}>
                  <AppText variant="bodySm" weight="bold">
                    David Chen
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                    Thanks for the book rec!
                  </AppText>
                </View>
                <View style={styles.convoRight}>
                  <AppText variant="caption" color={Colors.textMuted}>
                    1h
                  </AppText>
                  <View style={styles.readCircle} />
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ============================================================ */
          /* VIEW 2: HOME HIGHLIGHTS (Screen 4 in Reference) */
          /* ============================================================ */
          <>
            {/* 1. Your Highlights Metrics */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Your Highlights
              </AppText>
              <TouchableOpacity onPress={() => router.push('/quick-start')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  View all
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsRow}>
              {/* Profile Completion */}
              <Card style={styles.metricCard}>
                <View style={styles.circularRing}>
                  <AppText variant="caption" weight="bold" color={Colors.sage}>
                    80%
                  </AppText>
                </View>
                <AppText variant="caption" weight="semibold" color={Colors.textSecondary} align="center" style={styles.metricLabel}>
                  Profile Completion
                </AppText>
              </Card>

              {/* New Matches */}
              <Card style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Users color="#EA580C" size={20} />
                </View>
                <AppText variant="h2" weight="bold" color={Colors.text}>
                  3
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary} align="center">
                  New Matches
                </AppText>
              </Card>

              {/* Upcoming Events */}
              <Card style={styles.metricCard}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Calendar color="#0284C7" size={20} />
                </View>
                <AppText variant="h2" weight="bold" color={Colors.text}>
                  2
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary} align="center">
                  Upcoming Events
                </AppText>
              </Card>
            </View>

            {/* 2. Featured Communities (Vertical List with Join buttons) */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Featured Communities
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.verticalCommunitiesList}>
              {[
                {
                  id: 'c1',
                  name: 'Photography Lovers',
                  tagline: 'Share. Learn. Get inspired.',
                  members: '2.7K members',
                  image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&fit=crop&q=80',
                },
                {
                  id: 'c2',
                  name: 'Sustainable Living',
                  tagline: 'Live consciously, together.',
                  members: '1.9K members',
                  image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&fit=crop&q=80',
                },
                {
                  id: 'c3',
                  name: 'Music Connect',
                  tagline: 'For the love of music.',
                  members: '2.3K members',
                  image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop&q=80',
                },
              ].map((comm) => {
                const isJoined = joinedCommunities.includes(comm.name)
                return (
                  <View key={comm.id} style={styles.verticalCommunityRow}>
                    <Image source={{ uri: comm.image }} style={styles.verticalCommunityImage} />
                    <View style={styles.verticalCommunityInfo}>
                      <AppText variant="bodySm" weight="bold">
                        {comm.name}
                      </AppText>
                      <AppText variant="caption" color={Colors.textSecondary}>
                        {comm.tagline}
                      </AppText>
                      <AppText variant="caption" color={Colors.textMuted}>
                        {comm.members}
                      </AppText>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleJoinCommunity(comm.name)}
                      style={[styles.joinButton, isJoined ? styles.joinButtonActive : null]}
                    >
                      <AppText
                        variant="caption"
                        weight="bold"
                        color={isJoined ? Colors.primary : Colors.surface}
                      >
                        {isJoined ? 'Joined ✓' : 'Join'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </View>

            {/* 3. Upcoming Events (Farmers Market Mixer) */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="h3" weight="bold">
                Upcoming Events
              </AppText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                <AppText variant="caption" weight="semibold" color={Colors.primary}>
                  See all
                </AppText>
              </TouchableOpacity>
            </View>

            <Card style={styles.eventCard}>
              <View style={styles.eventLeft}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=300&fit=crop&q=80',
                  }}
                  style={styles.eventThumbnail}
                />
                <View style={styles.eventInfo}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    Farmers Market Mixer
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Sun, May 25 · 9:00 AM
                  </AppText>
                  <View style={styles.locationPinRow}>
                    <MapPin color={Colors.textMuted} size={11} />
                    <AppText variant="caption" color={Colors.textMuted}>
                      Mueller Market District
                    </AppText>
                  </View>
                  <View style={styles.attendeesRow}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
                      }}
                      style={styles.attendeeAvatar}
                    />
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
                      }}
                      style={[styles.attendeeAvatar, { marginLeft: -8 }]}
                    />
                    <AppText variant="caption" color={Colors.textSecondary} style={styles.attendeesCount}>
                      +18
                    </AppText>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleRsvp('Farmers Market')}
                style={[
                  styles.rsvpButton,
                  rsvpedEvents.includes('Farmers Market') ? styles.rsvpButtonActive : null,
                ]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  color={Colors.surface}
                >
                  {rsvpedEvents.includes('Farmers Market') ? 'RSVP ✓' : 'RSVP'}
                </AppText>
              </TouchableOpacity>
            </Card>
          </>
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  headerIconButton: {
    padding: 6,
  },
  greetingContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  bellButton: {
    padding: 6,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    height: 44,
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
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    padding: 3,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modePill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  modePillActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featuredCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
  },
  featuredTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featuredAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
  },
  featuredInfo: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  newMatchBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  badgeLabel: {
    fontSize: 10,
  },
  interestPills: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  pill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  matchReason: {
    marginVertical: Spacing.sm,
    lineHeight: 16,
  },
  sayHelloButton: {
    marginTop: 4,
  },
  horizontalScrollList: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
    paddingBottom: 4,
  },
  communityCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  communityImage: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.border,
  },
  communityCardBody: {
    padding: 8,
  },
  eventCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  eventThumbnail: {
    width: 68,
    height: 68,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  locationPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  attendeeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  attendeesCount: {
    marginLeft: 6,
    fontSize: 11,
  },
  rsvpButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  rsvpButtonActive: {
    backgroundColor: Colors.sage,
  },
  conversationsList: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  convoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  convoContent: {
    flex: 1,
  },
  convoRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  readCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  circularRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  metricLabel: {
    marginTop: 2,
  },
  verticalCommunitiesList: {
    marginHorizontal: Spacing.lg,
    gap: 10,
    marginBottom: Spacing.md,
  },
  verticalCommunityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verticalCommunityImage: {
    width: 50,
    height: 50,
    borderRadius: Radii.md,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  verticalCommunityInfo: {
    flex: 1,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radii.md,
  },
  joinButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
})
