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
} from 'lucide-react-native'

export default function MatchProfileDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [isConnected, setIsConnected] = useState(false)

  // Demo profile data matching Maya in reference Screen 2
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

  const handleConnect = () => {
    setIsConnected(!isConnected)
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
              <CheckCircle2 color="#22C55E" fill="#22C55E" size={20} />
            )}
          </View>

          <AppText variant="bodySm" color={Colors.textSecondary} style={styles.locationText}>
            {profile.location} · {profile.distance}
          </AppText>

          <AppText variant="body" color={Colors.text} style={styles.bioText}>
            {profile.bio}
          </AppText>
        </View>

        {/* Trust Signals (4 Icons Grid) */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Trust Signals
          </AppText>
          <View style={styles.trustSignalsGrid}>
            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Shield color={Colors.primary} size={18} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary} align="center">
                Verified{'\n'}Profile
              </AppText>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Zap color="#D97706" size={18} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary} align="center">
                Active{'\n'}This Week
              </AppText>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Users color="#0284C7" size={18} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary} align="center">
                Community{'\n'}Contributor
              </AppText>
            </View>

            <View style={styles.trustItem}>
              <View style={[styles.trustIconCircle, { backgroundColor: '#FEF9C3' }]}>
                <Star color="#CA8A04" size={18} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary} align="center">
                Positive{'\n'}Reviews
              </AppText>
            </View>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Interests
          </AppText>
          <View style={styles.pillsWrap}>
            {profile.interests.map((int, idx) => (
              <View key={idx} style={styles.interestPill}>
                <AppText variant="caption" color={Colors.text}>
                  {int}
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
          <View style={styles.pillsWrap}>
            {profile.values.map((val, idx) => (
              <View key={idx} style={styles.valuePill}>
                <AppText variant="caption" color={Colors.primaryDark}>
                  {val}
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
                style={styles.starterCard}
                onPress={() => router.push('/(tabs)/messages')}
              >
                <MessageCircle color={Colors.primary} size={18} />
                <AppText variant="bodySm" color={Colors.text} style={styles.starterText}>
                  {starter}
                </AppText>
                <ChevronRight color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mutual Communities */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Mutual Communities
          </AppText>
          <Card style={styles.mutualCard}>
            <Image
              source={{ uri: profile.mutualCommunity.image }}
              style={styles.mutualImage}
            />
            <View style={styles.mutualInfo}>
              <AppText variant="bodySm" weight="bold">
                {profile.mutualCommunity.name}
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                {profile.mutualCommunity.members}
              </AppText>
            </View>
            <View style={styles.stackedAvatars}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
                }}
                style={styles.smallAvatar}
              />
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
                }}
                style={[styles.smallAvatar, { marginLeft: -8 }]}
              />
              <AppText variant="caption" color={Colors.textSecondary} style={styles.moreAvatars}>
                +18
              </AppText>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Fixed Bottom Connect Button */}
      <View style={styles.bottomBar}>
        <AppButton
          title={isConnected ? 'Connected ✓' : 'Connect'}
          onPress={handleConnect}
          style={[styles.connectButton, isConnected ? styles.connectedButton : null]}
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
    paddingBottom: 90,
  },
  photoContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  matchScoreBadge: {
    position: 'absolute',
    bottom: -20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  matchLabel: {
    fontSize: 9,
    marginTop: -2,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  locationText: {
    marginBottom: Spacing.md,
  },
  bioText: {
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  trustSignalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  trustIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  startersList: {
    gap: 10,
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starterText: {
    flex: 1,
  },
  mutualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  mutualImage: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  mutualInfo: {
    flex: 1,
  },
  stackedAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  moreAvatars: {
    marginLeft: 6,
    fontSize: 11,
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
  connectedButton: {
    backgroundColor: Colors.sage,
  },
})
