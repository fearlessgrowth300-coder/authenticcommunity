import React from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Bookmark, MapPin, Calendar } from 'lucide-react-native'

export interface EventItem {
  id: string
  title: string
  host: string
  dateMonth: string
  dateDay: string
  dateDayOfWeek: string
  dateTimeFormatted: string
  distance: string
  imageUrl: string
  attendeesCount: number
  isSaved?: boolean
  isRsvped?: boolean
  description?: string
  location?: string
  timeRange?: string
  organizer?: {
    name: string
    followers: string
    avatarUrl: string
  }
}

interface EventCardProps {
  event: EventItem
  onPress?: () => void
  onToggleSave?: () => void
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onToggleSave,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      {/* Left Image Thumbnail */}
      <Image
        source={{ uri: event.imageUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Right Content Body */}
      <View style={styles.content}>
        {/* Top Row: Date Badge + Title + Bookmark */}
        <View style={styles.headerRow}>
          <View style={styles.dateBadge}>
            <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.dateMonth}>
              {event.dateMonth}
            </AppText>
            <AppText variant="bodySm" weight="bold" color={Colors.text} style={styles.dateDay}>
              {event.dateDay}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.dateDow}>
              {event.dateDayOfWeek}
            </AppText>
          </View>

          <View style={styles.titleWrap}>
            <AppText variant="bodySm" weight="bold" numberOfLines={2} style={styles.titleText}>
              {event.title}
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
              {event.host}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => onToggleSave?.()}
            style={styles.bookmarkBtn}
            accessibilityLabel="Save event"
          >
            <Bookmark
              color={event.isSaved ? Colors.amber : Colors.textMuted}
              fill={event.isSaved ? Colors.amber : 'transparent'}
              size={18}
            />
          </TouchableOpacity>
        </View>

        {/* Date, Time & Distance Meta */}
        <View style={styles.metaRow}>
          <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {event.dateTimeFormatted}
          </AppText>
          <View style={styles.distanceRow}>
            <MapPin color={Colors.textMuted} size={11} />
            <AppText variant="caption" color={Colors.textMuted}>
              {event.distance}
            </AppText>
          </View>
        </View>

        {/* Stacked Attendee Avatars */}
        <View style={styles.attendeesRow}>
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
            +{event.attendeesCount}
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
    height: 110,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dateBadge: {
    width: 38,
    backgroundColor: Colors.background,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dateMonth: {
    fontSize: 9,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 14,
    lineHeight: 16,
  },
  dateDow: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'uppercase',
  },
  titleWrap: {
    flex: 1,
  },
  titleText: {
    lineHeight: 18,
    marginBottom: 2,
  },
  bookmarkBtn: {
    padding: 2,
  },
  metaRow: {
    gap: 2,
    marginVertical: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  attendeesRow: {
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
