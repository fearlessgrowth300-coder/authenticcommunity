import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Share2,
  Heart,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react-native'

export default function EventDetailScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [isRsvped, setIsRsvped] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      setLoading(true)
      try {
        const { data: e } = await supabase
          .from('events')
          .select('*, communities(community_name, profile_image_url)')
          .eq('id', id)
          .maybeSingle()

        if (e) setEventData(e)

        if (user) {
          const { data: rsvp } = await (supabase as any)
            .from('event_rsvps')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle()

          setIsRsvped(Boolean(rsvp))
        }
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [id, user])

  const handleToggleRsvp = async () => {
    if (!user || !id) return
    if (isRsvped) {
      await (supabase as any)
        .from('event_rsvps')
        .delete()
        .eq('event_id', id)
        .eq('user_id', user.id)
      setIsRsvped(false)
    } else {
      await (supabase as any)
        .from('event_rsvps')
        .insert({
          event_id: id,
          user_id: user.id,
          status: 'going',
        })
      setIsRsvped(true)
    }
  }

  const d = eventData?.event_date ? new Date(eventData.event_date) : new Date()
  const months = ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR', 'MAY']

  const event = {
    title: eventData?.event_title || 'Community Meetup & Gathering',
    host: eventData?.communities?.community_name || 'Authentic Community',
    hostFollowers: '500+ members',
    hostAvatar:
      eventData?.communities?.profile_image_url ||
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&fit=crop&q=80',
    dateMonth: months[d.getMonth()] || 'JUN',
    dateDay: String(d.getDate() || '15'),
    dateDayOfWeek: 'SAT',
    dateFull: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    timeRange: '9:00 AM - 11:00 AM',
    location: eventData?.location_name || 'Local Community Center',
    distance: 'In your city',
    heroImage:
      eventData?.cover_image_url ||
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&fit=crop&q=80',
    description:
      eventData?.description ||
      'Start your weekend with intention. All community members are welcome! Bring good energy. 🌿',
    attendeesCount: 16,
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Image & Overlay Header */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.heroImage }} style={styles.heroImage} />

          {/* Top Navigation */}
          <SafeAreaView style={styles.heroNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navCircleBtn}
            >
              <ArrowLeft color="#FFFFFF" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navCircleBtn}>
              <Share2 color="#FFFFFF" size={18} />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Date Badge on Bottom-Left */}
          <View style={styles.floatingDateBadge}>
            <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.dateBadgeMonth}>
              {event.dateMonth}
            </AppText>
            <AppText variant="h3" weight="bold" color={Colors.text} style={styles.dateBadgeDay}>
              {event.dateDay}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.dateBadgeDow}>
              {event.dateDayOfWeek}
            </AppText>
          </View>

          {/* Heart Button on Bottom-Right */}
          <TouchableOpacity
            onPress={() => setIsLiked(!isLiked)}
            style={[styles.floatingHeartBtn, isLiked ? styles.heartActive : null]}
          >
            <Heart
              color={isLiked ? '#EF4444' : Colors.textMuted}
              fill={isLiked ? '#EF4444' : 'transparent'}
              size={20}
            />
          </TouchableOpacity>
        </View>

        {/* Event Main Info */}
        <View style={styles.infoCard}>
          <AppText variant="h1" weight="bold">
            {event.title}
          </AppText>

          {/* Host Row */}
          <View style={styles.hostRow}>
            <Image source={{ uri: event.hostAvatar }} style={styles.hostAvatar} />
            <View style={styles.hostInfo}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Hosted by
              </AppText>
              <AppText variant="bodySm" weight="bold">
                {event.host}
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => setIsFollowing(!isFollowing)}
              style={[styles.followBtn, isFollowing ? styles.followingBtn : null]}
            >
              <AppText
                variant="caption"
                weight="bold"
                color={isFollowing ? Colors.surface : Colors.primary}
              >
                {isFollowing ? 'Following ✓' : 'Follow'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Date & Time Row */}
          <View style={styles.metaItem}>
            <Calendar color={Colors.primary} size={18} />
            <View style={styles.metaTexts}>
              <AppText variant="bodySm" weight="semibold">
                {event.dateFull}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {event.timeRange}
              </AppText>
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.metaItem}>
            <MapPin color={Colors.primary} size={18} />
            <View style={styles.metaTexts}>
              <AppText variant="bodySm" weight="semibold">
                {event.location}
              </AppText>
              <AppText variant="caption" color={Colors.sage} weight="semibold">
                {event.distance}
              </AppText>
            </View>
          </View>

          {/* Stylized Map Preview Card */}
          <View style={styles.mapCard}>
            <Image
              source={require('../../assets/city_map.jpg')}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapPinBadge}>
              <MapPin color="#FFFFFF" size={14} />
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                Riverside Dr
              </AppText>
            </View>
          </View>
        </View>

        {/* About the Organizer */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            About the Organizer
          </AppText>
          <Card style={styles.organizerCard}>
            <Image source={{ uri: event.hostAvatar }} style={styles.organizerAvatar} />
            <View style={styles.organizerInfo}>
              <AppText variant="bodySm" weight="bold">
                {event.host}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {event.hostFollowers}
              </AppText>
            </View>
            <TouchableOpacity style={styles.viewOrganizerBtn}>
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                View
              </AppText>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Attendees Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="label" weight="semibold">
              {event.attendeesCount} Going
            </AppText>
            <TouchableOpacity>
              <AppText variant="caption" weight="semibold" color={Colors.primary}>
                See All
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.attendeesListRow}>
            {[
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop&q=80',
              'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&fit=crop&q=80',
            ].map((url, idx) => (
              <Image key={idx} source={{ uri: url }} style={styles.attendeeCircle} />
            ))}
            <View style={styles.moreAttendeeCircle}>
              <AppText variant="caption" weight="bold" color={Colors.textSecondary}>
                +23
              </AppText>
            </View>
          </View>
        </View>

        {/* About This Event */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            About This Event
          </AppText>
          <AppText variant="body" color={Colors.text} style={styles.descriptionText}>
            {event.description}
          </AppText>
        </View>

        {/* Safety First Card */}
        <View style={styles.section}>
          <Card style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <ShieldCheck color={Colors.primary} size={18} />
              <AppText variant="bodySm" weight="bold" color={Colors.primary}>
                Safety First
              </AppText>
            </View>
            <AppText variant="caption" color={Colors.textSecondary} style={styles.safetyBody}>
              We prioritize a safe and inclusive space for all. Please respect others and follow community guidelines.
            </AppText>
          </Card>
        </View>
      </ScrollView>

      {/* Fixed Bottom RSVP Button */}
      <View style={styles.bottomBar}>
        <AppButton
          title={isRsvped ? "✓ RSVP'd · You're going!" : 'RSVP Now'}
          onPress={handleToggleRsvp}
          style={[styles.rsvpBtn, isRsvped ? styles.rsvpedBtn : null]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
    backgroundColor: Colors.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroNav: {
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
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDateBadge: {
    position: 'absolute',
    bottom: -16,
    left: 20,
    width: 50,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBadgeMonth: {
    fontSize: 9,
    lineHeight: 11,
  },
  dateBadgeDay: {
    lineHeight: 22,
  },
  dateBadgeDow: {
    fontSize: 9,
    lineHeight: 11,
  },
  floatingHeartBtn: {
    position: 'absolute',
    bottom: 12,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  heartActive: {
    backgroundColor: '#FEE2E2',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
  },
  hostInfo: {
    flex: 1,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  followingBtn: {
    backgroundColor: Colors.primary,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaTexts: {
    flex: 1,
  },
  mapCard: {
    width: '100%',
    height: 120,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPinBadge: {
    position: 'absolute',
    top: '40%',
    left: '35%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 10,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  organizerInfo: {
    flex: 1,
  },
  viewOrganizerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  attendeesListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.border,
  },
  moreAttendeeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionText: {
    lineHeight: 22,
  },
  safetyCard: {
    backgroundColor: '#EEF2FF',
    padding: Spacing.md,
    borderColor: '#C7D2FE',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  safetyBody: {
    lineHeight: 18,
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
  rsvpBtn: {
    width: '100%',
  },
  rsvpedBtn: {
    backgroundColor: Colors.sage,
  },
})
