import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Card } from '@/components/primitives/Card'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  Users,
  Compass,
  Calendar,
  Sparkles,
  ChevronRight,
  MapPin,
  Flame,
} from 'lucide-react-native'

/**
 * 1. People You May Connect With Module
 */
export const PeopleYouMayConnectWithModule: React.FC = () => {
  const router = useRouter()

  const candidates = [
    {
      id: 'maya-patel',
      name: 'Maya Patel',
      role: 'Product Designer',
      location: 'Lagos · 2.4 km',
      isVerified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
      matchScore: 94,
    },
    {
      id: 'david-chen',
      name: 'David Chen',
      role: 'Full Stack Engineer',
      location: 'Lagos · 4.1 km',
      isVerified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
      matchScore: 89,
    },
    {
      id: 'amara-okafor',
      name: 'Amara Okafor',
      role: 'Community Lead',
      location: 'Lagos · 1.8 km',
      isVerified: true,
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
      matchScore: 91,
    },
  ]

  return (
    <View style={styles.moduleContainer}>
      <View style={styles.moduleHeader}>
        <View style={styles.headerTitleRow}>
          <Users color={Colors.primary} size={18} />
          <AppText variant="bodySm" weight="bold">
            People you may connect with
          </AppText>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
          <AppText variant="caption" weight="semibold" color={Colors.primary}>
            See All
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {candidates.map((cand) => (
          <Card key={cand.id} style={styles.personCard}>
            <TouchableOpacity
              onPress={() => router.push(`/profile/${cand.id}`)}
              style={styles.personClick}
            >
              <View style={styles.personAvatarWrap}>
                <Image source={{ uri: cand.avatarUrl }} style={styles.personAvatar} />
                <View style={styles.matchScoreBadge}>
                  <AppText variant="caption" weight="bold" color={Colors.primary} style={styles.matchText}>
                    {cand.matchScore}%
                  </AppText>
                </View>
              </View>

              <View style={styles.nameRow}>
                <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                  {cand.name}
                </AppText>
                {cand.isVerified && <VerifiedBadge size={13} />}
              </View>

              <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                {cand.role}
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} numberOfLines={1} style={styles.locText}>
                {cand.location}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/profile/${cand.id}`)}
              style={styles.connectBtn}
            >
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                Connect
              </AppText>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

/**
 * 2. Communities For You Module
 */
export const CommunitiesForYouModule: React.FC = () => {
  const router = useRouter()

  const communities = [
    {
      id: 'lagos-creators',
      name: 'Lagos Creators & Builders',
      membersCount: 420,
      category: 'Design & Code',
      imageUrl:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
    },
    {
      id: 'fitness-runners',
      name: 'Lekki Morning Runners',
      membersCount: 185,
      category: 'Fitness & Health',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&fit=crop&q=80',
    },
  ]

  return (
    <View style={styles.moduleContainer}>
      <View style={styles.moduleHeader}>
        <View style={styles.headerTitleRow}>
          <Compass color={Colors.sage} size={18} />
          <AppText variant="bodySm" weight="bold">
            Communities for you
          </AppText>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
          <AppText variant="caption" weight="semibold" color={Colors.primary}>
            Explore
          </AppText>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {communities.map((c) => (
          <TouchableOpacity
            key={c.id}
            activeOpacity={0.88}
            onPress={() => router.push(`/community/${c.id}`)}
            style={styles.communityCard}
          >
            <Image source={{ uri: c.imageUrl }} style={styles.communityImage} />
            <View style={styles.communityOverlay}>
              <View style={styles.categoryPill}>
                <AppText variant="caption" weight="semibold" color="#FFFFFF" style={styles.categoryPillText}>
                  {c.category}
                </AppText>
              </View>
              <AppText variant="bodySm" weight="bold" color="#FFFFFF" numberOfLines={1}>
                {c.name}
              </AppText>
              <AppText variant="caption" color="rgba(255, 255, 255, 0.85)">
                {c.membersCount} members
              </AppText>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

/**
 * 3. Events Near You Module
 */
export const EventsNearYouModule: React.FC = () => {
  const router = useRouter()

  return (
    <View style={styles.moduleContainer}>
      <View style={styles.moduleHeader}>
        <View style={styles.headerTitleRow}>
          <Calendar color={Colors.coral} size={18} />
          <AppText variant="bodySm" weight="bold">
            Events near you
          </AppText>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
          <AppText variant="caption" weight="semibold" color={Colors.primary}>
            View All
          </AppText>
        </TouchableOpacity>
      </View>

      <Card style={styles.eventCard}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&fit=crop&q=80',
          }}
          style={styles.eventThumb}
        />
        <View style={styles.eventInfo}>
          <View style={styles.eventDateBadge}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              SAT, JUN 15 · 9:00 AM
            </AppText>
          </View>
          <AppText variant="bodySm" weight="bold" numberOfLines={1}>
            Tech Founders Coffee & Hike
          </AppText>
          <View style={styles.eventLocRow}>
            <MapPin color={Colors.textMuted} size={12} />
            <AppText variant="caption" color={Colors.textSecondary}>
              Lekki Conservation Centre · 1.2 km
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/event/e1')}
          style={styles.rsvpBtn}
        >
          <AppText variant="caption" weight="bold" color={Colors.primary}>
            RSVP
          </AppText>
        </TouchableOpacity>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  moduleContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  personCard: {
    width: 145,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  personClick: {
    alignItems: 'center',
    width: '100%',
  },
  personAvatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  personAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.border,
  },
  matchScoreBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radii.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  matchText: {
    fontSize: 9,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    fontSize: 10,
    marginTop: 2,
  },
  connectBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: Radii.full,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  communityCard: {
    width: 220,
    height: 120,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  communityImage: {
    width: '100%',
    height: '100%',
  },
  communityOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 12,
    justifyContent: 'flex-end',
    gap: 2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginBottom: 2,
  },
  categoryPillText: {
    fontSize: 9,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    padding: 10,
    gap: 12,
  },
  eventThumb: {
    width: 60,
    height: 60,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventDateBadge: {
    marginBottom: 2,
  },
  eventLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rsvpBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
})
