import React from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  MapPin,
  CheckCircle2,
  X,
  Bookmark,
  Users,
} from 'lucide-react-native'

export interface MatchProfile {
  id: string
  name: string
  age: number
  isVerified: boolean
  location: string
  distance: string
  matchScore: number
  photoUrl: string
  bio: string
  sharedInterests: string[]
  sharedValues: string[]
  trustSignals?: {
    isVerifiedProfile: boolean
    isActiveThisWeek: boolean
    isCommunityContributor: boolean
    hasPositiveReviews: boolean
  }
  conversationStarters?: string[]
  mutualCommunity?: {
    name: string
    members: string
    image: string
  }
  distanceKm?: number | null
  country?: string | null
  createdAt?: string
}

interface MatchCardProps {
  profile: MatchProfile
  onPass?: () => void
  onSave?: () => void
  onConnect?: () => void
  onPressDetails?: () => void
  isSaved?: boolean
  isConnected?: boolean
}

export const MatchCard: React.FC<MatchCardProps> = ({
  profile,
  onPass,
  onSave,
  onConnect,
  onPressDetails,
  isSaved = false,
  isConnected = false,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Clickable Profile Card */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPressDetails}
        style={styles.cardContent}
      >
        {/* Photo Container */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: profile.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />

          {/* Distance Badge */}
          <View style={styles.distanceBadge}>
            <MapPin color="#FFFFFF" size={12} />
            <AppText variant="caption" weight="medium" color="#FFFFFF">
              {profile.distance}
            </AppText>
          </View>

          {/* Match Score Badge floating on top right */}
          <View style={styles.matchScoreBadge}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              {profile.matchScore}%
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.matchLabel}>
              Match
            </AppText>
          </View>

          {/* Name & Location Overlay */}
          <View style={styles.photoOverlay}>
            <View style={styles.nameRow}>
              <AppText variant="h2" weight="bold" color="#FFFFFF">
                {profile.name}, {profile.age}
              </AppText>
              {profile.isVerified && (
                <CheckCircle2 color="#22C55E" fill="#22C55E" size={18} />
              )}
            </View>
            <AppText variant="bodySm" color="rgba(255, 255, 255, 0.85)">
              {profile.location}
            </AppText>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.body}>
          {/* Shared Interests */}
          <View style={styles.section}>
            <AppText variant="caption" weight="semibold" color={Colors.textSecondary} style={styles.sectionLabel}>
              Shared Interests
            </AppText>
            <View style={styles.pillsRow}>
              {profile.sharedInterests.map((interest, idx) => (
                <View key={idx} style={styles.interestPill}>
                  <AppText variant="caption" color={Colors.text}>
                    {interest}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Shared Values */}
          <View style={styles.section}>
            <AppText variant="caption" weight="semibold" color={Colors.textSecondary} style={styles.sectionLabel}>
              Shared Values
            </AppText>
            <View style={styles.pillsRow}>
              {profile.sharedValues.map((val, idx) => (
                <View key={idx} style={styles.valuePill}>
                  <AppText variant="caption" color={Colors.primaryDark}>
                    {val}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        {/* Pass Button */}
        <View style={styles.actionItem}>
          <TouchableOpacity
            onPress={onPass}
            style={styles.circleActionButton}
            accessibilityLabel="Pass"
          >
            <X color={Colors.textMuted} size={22} />
          </TouchableOpacity>
          <AppText variant="caption" color={Colors.textMuted} style={styles.actionLabel}>
            Pass
          </AppText>
        </View>

        {/* Save Bookmark Button */}
        <View style={styles.actionItem}>
          <TouchableOpacity
            onPress={onSave}
            style={[styles.circleActionButton, isSaved ? styles.circleActionSaved : null]}
            accessibilityLabel="Save Match"
          >
            <Bookmark
              color={isSaved ? Colors.amber : Colors.textMuted}
              fill={isSaved ? Colors.amber : 'transparent'}
              size={20}
            />
          </TouchableOpacity>
          <AppText variant="caption" color={Colors.textMuted} style={styles.actionLabel}>
            {isSaved ? 'Saved' : 'Save'}
          </AppText>
        </View>

        {/* Connect Button */}
        <View style={styles.actionItem}>
          <TouchableOpacity
            onPress={onConnect}
            style={[styles.circleActionButton, styles.connectActionButton, isConnected ? styles.connectActionConnected : null]}
            accessibilityLabel="Connect"
          >
            <Users color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <AppText variant="caption" weight="semibold" color={Colors.primary} style={styles.actionLabel}>
            {isConnected ? 'Connected' : 'Connect'}
          </AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  cardContent: {
    backgroundColor: Colors.surface,
  },
  photoContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  matchScoreBadge: {
    position: 'absolute',
    bottom: 16,
    right: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  matchLabel: {
    fontSize: 9,
    marginTop: -2,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 70,
    padding: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  body: {
    padding: Spacing.md,
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    letterSpacing: 0.3,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  circleActionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActionSaved: {
    borderColor: Colors.amber,
    backgroundColor: '#FEF3C7',
  },
  connectActionButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  connectActionConnected: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  actionLabel: {
    marginTop: 2,
  },
})
