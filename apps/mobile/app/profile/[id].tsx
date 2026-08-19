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
} from 'lucide-react-native'

export default function MatchProfileDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  // Relationship states
  const [followState, setFollowState] = useState<'not_following' | 'following' | 'requested'>('not_following')
  const [connectionState, setConnectionState] = useState<'none' | 'pending_outgoing' | 'connected'>('none')

  // Profile data
  const profile = {
    name: 'Maya',
    age: 28,
    isVerified: true,
    location: 'Austin, Texas',
    distance: '1.2 miles away',
    matchScore: 92,
    photoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&fit=crop&q=80',
    bio: 'Community builder, book lover, and weekend hiker. Always up for meaningful conversations and trying new local spots.',
    interests: ['Hiking', 'Books', 'Community', 'Travel', 'Yoga', 'Live Music'],
    values: [
      'Kindness',
      'Growth',
      'Community',
      'Learning',
      'Creativity',
      'Honesty',
    ],
    conversationStarters: [
      "What's a book that changed your perspective?",
      "What's a cause you care deeply about?",
    ],
    mutualCommunity: {
      name: 'Austin Trail Buddies',
      members: '245 members',
      image:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&fit=crop&q=80',
    },
  }

  const handleToggleFollow = () => {
    if (followState === 'not_following') {
      setFollowState('following')
    } else {
      setFollowState('not_following')
    }
  }

  const handleToggleConnect = () => {
    if (connectionState === 'none') {
      setConnectionState('pending_outgoing')
    } else if (connectionState === 'pending_outgoing') {
      setConnectionState('none')
    } else if (connectionState === 'connected') {
      setConnectionState('none')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <MoreHorizontal color={Colors.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Container with Top-Right Match Score Badge */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: profile.photoUrl }} style={styles.photo} />
          <View style={styles.matchScoreBadge}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              {profile.matchScore}%
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.matchLabel}>
              Match
            </AppText>
          </View>
        </View>

        {/* Profile Info Header */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <AppText variant="h1" weight="bold">
              {profile.name}, {profile.age}
            </AppText>
            {profile.isVerified && (
              <CheckCircle2 color={Colors.primary} size={20} />
            )}
          </View>
          <View style={styles.locationRow}>
            <MapPin color={Colors.textSecondary} size={14} />
            <AppText variant="bodySm" color={Colors.textSecondary}>
              {profile.location} · {profile.distance}
            </AppText>
          </View>
          <AppText variant="body" color={Colors.text} style={styles.bioText}>
            {profile.bio}
          </AppText>

          {/* Follow & Message Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={handleToggleFollow}
              style={[
                styles.followBtn,
                followState === 'following' ? styles.followingBtn : null,
              ]}
            >
              <AppText
                variant="bodySm"
                weight="bold"
                color={followState === 'following' ? Colors.textSecondary : Colors.surface}
              >
                {followState === 'following' ? 'Following ✓' : 'Follow'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/chat/jane-doe')}
              style={styles.messageBtn}
            >
              <MessageCircle color={Colors.primary} size={18} />
              <AppText variant="bodySm" weight="bold" color={Colors.primary}>
                Message
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Signals Grid (2x2) */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Trust Signals
          </AppText>
          <View style={styles.trustGrid}>
            <Card style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Shield color={Colors.primary} size={18} />
              </View>
              <AppText variant="caption" weight="bold">
                Verified Profile
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.trustSub}>
                ID & photo confirmed
              </AppText>
            </Card>

            <Card style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Zap color={Colors.primary} size={18} />
              </View>
              <AppText variant="caption" weight="bold">
                Active This Week
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.trustSub}>
                Usually replies in 1h
              </AppText>
            </Card>

            <Card style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Users color={Colors.primary} size={18} />
              </View>
              <AppText variant="caption" weight="bold">
                Community Member
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.trustSub}>
                3 mutual communities
              </AppText>
            </Card>

            <Card style={styles.trustCard}>
              <View style={styles.trustIconWrap}>
                <Star color={Colors.primary} size={18} />
              </View>
              <AppText variant="caption" weight="bold">
                Positive Reviews
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.trustSub}>
                5 community vouches
              </AppText>
            </Card>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Interests
          </AppText>
          <View style={styles.chipsContainer}>
            {profile.interests.map((interest, idx) => (
              <View key={idx} style={styles.interestChip}>
                <AppText variant="bodySm" color={Colors.text}>
                  {interest}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Values
          </AppText>
          <View style={styles.chipsContainer}>
            {profile.values.map((value, idx) => (
              <View key={idx} style={styles.valueChip}>
                <AppText variant="bodySm" color={Colors.primaryDark}>
                  {value}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Conversation Starters */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Conversation Starters
          </AppText>
          <View style={styles.startersList}>
            {profile.conversationStarters.map((starter, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push('/chat/jane-doe')}
                style={styles.starterCard}
              >
                <AppText variant="bodySm" color={Colors.text} style={styles.starterText}>
                  "{starter}"
                </AppText>
                <ChevronRight color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mutual Communities */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Mutual Communities
          </AppText>
          <TouchableOpacity
            onPress={() => router.push('/community/austin-trail-buddies')}
            style={styles.mutualCommunityCard}
          >
            <Image
              source={{ uri: profile.mutualCommunity.image }}
              style={styles.communityThumb}
            />
            <View style={styles.communityInfo}>
              <AppText variant="bodySm" weight="bold">
                {profile.mutualCommunity.name}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {profile.mutualCommunity.members}
              </AppText>
            </View>
            <ChevronRight color={Colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Connection Bar */}
      <View style={styles.bottomBar}>
        <AppButton
          title={
            connectionState === 'connected'
              ? '✓ Connected'
              : connectionState === 'pending_outgoing'
              ? 'Request Sent · Tap to Cancel'
              : 'Connect'
          }
          variant={connectionState === 'connected' ? 'secondary' : 'primary'}
          onPress={handleToggleConnect}
          style={styles.connectButton}
        />
      </View>
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
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photoContainer: {
    width: '100%',
    height: 340,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  matchLabel: {
    fontSize: 8,
    marginTop: -2,
  },
  infoSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.md,
  },
  bioText: {
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  followBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 10,
    borderRadius: Radii.full,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  trustCard: {
    width: '48%',
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: 2,
  },
  trustIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  trustSub: {
    fontSize: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  startersList: {
    gap: 8,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starterText: {
    flex: 1,
    marginRight: 8,
  },
  mutualCommunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  communityThumb: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.border,
  },
  communityInfo: {
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  connectButton: {
    width: '100%',
  },
})
