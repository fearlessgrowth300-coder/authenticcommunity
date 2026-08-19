import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  ShieldCheck,
  Heart,
  MapPin,
  Globe,
  Calendar,
  Users,
  MessageSquare,
} from 'lucide-react-native'

const SUB_TABS = ['About', 'Chat', 'Events', 'Members']

export default function CommunityDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('About')
  const [isJoined, setIsJoined] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  // Demo community data matching Sunrise Hikers Austin in reference Screen 2
  const community = {
    name: 'Sunrise Hikers Austin',
    membersCount: 320,
    isTrusted: true,
    tags: ['Outdoors', 'Local', 'Active'],
    heroImage:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&fit=crop&q=80',
    description:
      "We're a welcoming group that loves exploring Austin's trails, staying active, and giving back to our beautiful city. All experience levels welcome!",
    location: 'Austin, Texas, USA',
    distance: '2.4 miles away',
    privacy: 'Public Community · Anyone can find and join',
    creator: {
      name: 'Sarah M.',
      joinedDate: 'Member since May 2023',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    },
    upcomingEvent: {
      title: 'Sunrise Hike at Mount Bonnell',
      date: 'Sat, May 18 · 7:00 AM',
      location: 'Mount Bonnell, Austin',
      attendees: 24,
      imageUrl:
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&fit=crop&q=80',
    },
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image & Header Navigation */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: community.heroImage }} style={styles.heroImage} />
          <SafeAreaView style={styles.heroOverlayNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navCircleButton}
            >
              <ArrowLeft color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <View style={styles.rightNavButtons}>
              <TouchableOpacity style={styles.navCircleButton}>
                <Share2 color="#FFFFFF" size={18} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navCircleButton}>
                <MoreHorizontal color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Community Info Header */}
        <View style={styles.infoCard}>
          <AppText variant="h1" weight="bold">
            {community.name}
          </AppText>

          <View style={styles.metaRow}>
            <AppText variant="bodySm" color={Colors.textSecondary}>
              {community.membersCount} members
            </AppText>
            {community.isTrusted && (
              <View style={styles.trustedBadge}>
                <ShieldCheck color="#166534" size={14} />
                <AppText variant="caption" weight="bold" color="#166534" style={styles.trustedLabel}>
                  Trusted Community
                </AppText>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {community.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagPill}>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {tag}
                </AppText>
              </View>
            ))}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <AppButton
              title={isJoined ? 'Joined ✓' : 'Join Community'}
              onPress={() => setIsJoined(!isJoined)}
              style={[styles.joinButton, isJoined ? styles.joinButtonActive : null]}
            />
            <TouchableOpacity
              onPress={() => setIsLiked(!isLiked)}
              style={[styles.heartButton, isLiked ? styles.heartButtonActive : null]}
            >
              <Heart
                color={isLiked ? '#EF4444' : Colors.textMuted}
                fill={isLiked ? '#EF4444' : 'transparent'}
                size={22}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub-Tabs Bar */}
        <View style={styles.subTabsContainer}>
          {SUB_TABS.map((tab) => {
            const isSelected = activeTab === tab
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.subTabItem,
                  isSelected ? styles.subTabItemActive : null,
                ]}
              >
                <AppText
                  variant="bodySm"
                  weight={isSelected ? 'bold' : 'medium'}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Tab 1: About Content */}
        {activeTab === 'About' && (
          <View style={styles.tabContent}>
            {/* Description */}
            <AppText variant="body" color={Colors.text} style={styles.descriptionText}>
              {community.description}
            </AppText>

            {/* Info List */}
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <MapPin color={Colors.textMuted} size={18} />
                <View style={styles.infoItemContent}>
                  <AppText variant="bodySm" weight="medium">
                    {community.location}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {community.distance}
                  </AppText>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Globe color={Colors.textMuted} size={18} />
                <View style={styles.infoItemContent}>
                  <AppText variant="bodySm" weight="medium">
                    Public Community
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Anyone can find and join
                  </AppText>
                </View>
              </View>

              {/* Creator Info */}
              <View style={styles.infoItem}>
                <Image
                  source={{ uri: community.creator.avatarUrl }}
                  style={styles.creatorAvatar}
                />
                <View style={styles.infoItemContent}>
                  <AppText variant="bodySm" weight="medium">
                    Created by {community.creator.name}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {community.creator.joinedDate}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Upcoming Event */}
            <View style={styles.upcomingEventSection}>
              <AppText variant="label" weight="semibold" style={styles.sectionHeading}>
                Upcoming Event
              </AppText>
              <Card style={styles.eventCard}>
                <Image
                  source={{ uri: community.upcomingEvent.imageUrl }}
                  style={styles.eventThumbnail}
                />
                <View style={styles.eventInfo}>
                  <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                    {community.upcomingEvent.title}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {community.upcomingEvent.date}
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {community.upcomingEvent.location}
                  </AppText>
                  <View style={styles.attendeesRow}>
                    <Users color={Colors.textMuted} size={12} />
                    <AppText variant="caption" color={Colors.textSecondary} style={styles.attendeesCount}>
                      {community.upcomingEvent.attendees} going
                    </AppText>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/events')}
                  style={styles.viewEventButton}
                >
                  <AppText variant="caption" weight="bold" color={Colors.primary}>
                    View Event
                  </AppText>
                </TouchableOpacity>
              </Card>
            </View>
          </View>
        )}

        {/* Tab 2: Chat */}
        {activeTab === 'Chat' && (
          <View style={styles.emptyTabContent}>
            <MessageSquare color={Colors.primary} size={40} />
            <AppText variant="body" weight="semibold" align="center" style={styles.tabMessage}>
              Community Chat
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} align="center">
              Join this community to start discussing hikes and trail meetups!
            </AppText>
          </View>
        )}

        {/* Tab 3: Events */}
        {activeTab === 'Events' && (
          <View style={styles.emptyTabContent}>
            <Calendar color={Colors.primary} size={40} />
            <AppText variant="body" weight="semibold" align="center" style={styles.tabMessage}>
              Community Events
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} align="center">
              Browse upcoming weekend hikes and RSVP with fellow members.
            </AppText>
          </View>
        )}

        {/* Tab 4: Members */}
        {activeTab === 'Members' && (
          <View style={styles.emptyTabContent}>
            <Users color={Colors.primary} size={40} />
            <AppText variant="body" weight="semibold" align="center" style={styles.tabMessage}>
              320 Members
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} align="center">
              Connect with fellow Austin outdoor and trail enthusiasts.
            </AppText>
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
    paddingBottom: Spacing.xl,
  },
  heroContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  navCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  trustedLabel: {
    fontSize: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tagPill: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  joinButton: {
    flex: 1,
  },
  joinButtonActive: {
    backgroundColor: Colors.sage,
  },
  heartButton: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabContent: {
    padding: Spacing.lg,
  },
  descriptionText: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  infoList: {
    gap: 14,
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoItemContent: {
    flex: 1,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  upcomingEventSection: {
    marginTop: Spacing.sm,
  },
  sectionHeading: {
    marginBottom: Spacing.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 10,
  },
  eventThumbnail: {
    width: 60,
    height: 60,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  attendeesCount: {
    fontSize: 10,
  },
  viewEventButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyTabContent: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  tabMessage: {
    marginTop: 8,
  },
})
