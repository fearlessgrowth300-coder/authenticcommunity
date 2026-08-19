import React from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Bookmark } from 'lucide-react-native'

export interface CommunityItem {
  id: string
  name: string
  category: string
  categoryColor?: string
  distance: string
  membersCount: number
  description: string
  imageUrl: string
  isSaved?: boolean
  isTrusted?: boolean
  isJoined?: boolean
  location?: string
  privacy?: string
  createdBy?: {
    name: string
    joinedDate: string
    avatarUrl: string
  }
  upcomingEvent?: {
    title: string
    date: string
    location: string
    attendeesCount: number
    imageUrl: string
  }
}

interface CommunityCardProps {
  community: CommunityItem
  onPress?: () => void
  onToggleSave?: () => void
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onPress,
  onToggleSave,
}) => {
  const getCategoryColorStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'outdoors':
        return { bg: '#DCFCE7', text: '#166534' }
      case 'learning':
        return { bg: '#FEF3C7', text: '#92400E' }
      case 'wellness':
        return { bg: '#E0F2FE', text: '#0369A1' }
      case 'faith':
        return { bg: '#FEE2E2', text: '#991B1B' }
      case 'arts & culture':
        return { bg: '#F3E8FF', text: '#6B21A8' }
      case 'technology':
        return { bg: '#EEF2FF', text: '#3730A3' }
      case 'food':
        return { bg: '#FFEDD5', text: '#9A3412' }
      default:
        return { bg: Colors.primaryLight, text: Colors.primaryDark }
    }
  }

  const catStyle = getCategoryColorStyle(community.category)

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      {/* Left Image Thumbnail */}
      <Image
        source={{ uri: community.imageUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Right Content */}
      <View style={styles.content}>
        {/* Title and Bookmark */}
        <View style={styles.topRow}>
          <AppText variant="bodySm" weight="bold" style={styles.title} numberOfLines={1}>
            {community.name}
          </AppText>
          <TouchableOpacity
            onPress={() => {
              onToggleSave?.()
            }}
            style={styles.bookmarkButton}
            accessibilityLabel="Bookmark community"
          >
            <Bookmark
              color={community.isSaved ? Colors.amber : Colors.textMuted}
              fill={community.isSaved ? Colors.amber : 'transparent'}
              size={18}
            />
          </TouchableOpacity>
        </View>

        {/* Distance & Member Count */}
        <AppText variant="caption" color={Colors.textSecondary} style={styles.metaText}>
          {community.distance} · {community.membersCount} members
        </AppText>

        {/* Category Pill */}
        <View style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}>
          <AppText variant="caption" weight="semibold" color={catStyle.text} style={styles.categoryLabel}>
            {community.category}
          </AppText>
        </View>

        {/* Description */}
        <AppText variant="caption" color={Colors.textSecondary} numberOfLines={2} style={styles.description}>
          {community.description}
        </AppText>

        {/* Stacked Member Avatars */}
        <View style={styles.memberAvatarsRow}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80' }}
            style={styles.smallAvatar}
          />
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80' }}
            style={[styles.smallAvatar, { marginLeft: -8 }]}
          />
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&fit=crop&q=80' }}
            style={[styles.smallAvatar, { marginLeft: -8 }]}
          />
          <AppText variant="caption" color={Colors.textMuted} style={styles.moreCount}>
            +12
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 12,
  },
  thumbnail: {
    width: 96,
    height: 120,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    marginRight: 6,
  },
  bookmarkButton: {
    padding: 2,
  },
  metaText: {
    marginTop: 1,
    marginBottom: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 10,
  },
  description: {
    lineHeight: 16,
    marginBottom: 6,
  },
  memberAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.surface,
    backgroundColor: Colors.border,
  },
  moreCount: {
    marginLeft: 6,
    fontSize: 11,
  },
})
