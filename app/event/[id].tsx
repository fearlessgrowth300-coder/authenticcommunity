import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Alert,
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
  Users,
} from 'lucide-react-native'

export default function EventDetailScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [isRsvped, setIsRsvped] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [attendeeCount, setAttendeeCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const loadEvent = async () => {
      setLoading(true)
      try {
        const [eRes, attRes] = await Promise.all([
          supabase
            .from('events')
            .select('*, communities(community_name, photo_url)')
            .eq('id', id)
            .maybeSingle(),
          (supabase as any)
            .from('event_attendees')
            .select('user_id')
            .eq('event_id', id),
        ])

        if (eRes.data) setEventData(eRes.data)
        if (attRes.data) setAttendeeCount(attRes.data.length || 1)

        if (user) {
          const { data: rsvp } = await (supabase as any)
            .from('event_attendees')
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
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to RSVP for events.')
      return
    }
    if (!id) return

    if (isRsvped) {
      setIsRsvped(false)
      setAttendeeCount((prev) => Math.max(1, prev - 1))
      await Promise.all([
        (supabase as any).from('event_attendees').delete().eq('event_id', id).eq('user_id', user.id),
        (supabase as any).from('event_rsvps').delete().eq('event_id', id).eq('user_id', user.id),
      ])
    } else {
      setIsRsvped(true)
      setAttendeeCount((prev) => prev + 1)
      await Promise.all([
        (supabase as any).from('event_attendees').upsert({
          event_id: id,
          user_id: user.id,
          status: 'going',
        }),
        (supabase as any).from('event_rsvps').upsert({
          event_id: id,
          user_id: user.id,
          status: 'going',
        }),
      ])
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me at ${eventData?.event_title || eventData?.title || 'this event'} on Authentic Community!`,
        url: `https://authenticcommunity.fun/event/${id}`,
      })
    } catch {
      // Ignore
    }
  }

  const d = eventData?.event_date || eventData?.start_time ? new Date(eventData.event_date || eventData.start_time) : new Date()
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

  const eventTitle = eventData?.event_title || eventData?.title || 'Community Gathering'
  const eventHost = eventData?.communities?.community_name || 'Authentic Community'
  const eventHostAvatar = eventData?.communities?.photo_url || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&fit=crop&q=80'
  const eventLocation = eventData?.location_name || eventData?.location_city || 'Community Space'
  const eventCover = eventData?.cover_image_url || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80'

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 12 }}>
            Loading event...
          </AppText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="bodySm" weight="bold" numberOfLines={1} style={{ flex: 1, textAlign: 'center', marginHorizontal: 8 }}>
          {eventTitle}
        </AppText>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Share2 color={Colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo & Date Badge */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: eventCover }} style={styles.coverImage} />
          <View style={styles.dateBadge}>
            <AppText variant="caption" weight="bold" color="#DC2626" style={{ fontSize: 10 }}>
              {months[d.getMonth()]}
            </AppText>
            <AppText variant="h3" weight="bold" color={Colors.text}>
              {d.getDate()}
            </AppText>
          </View>
        </View>

        {/* Title & Host */}
        <View style={styles.mainInfo}>
          <AppText variant="h2" weight="bold">
            {eventTitle}
          </AppText>

          <View style={styles.hostRow}>
            <Image source={{ uri: eventHostAvatar }} style={styles.hostAvatar} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodySm" weight="bold">
                Hosted by {eventHost}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Verified Organizer
              </AppText>
            </View>
            <TouchableOpacity onPress={() => setIsLiked(!isLiked)} style={styles.likeBtn}>
              <Heart color={isLiked ? '#DC2626' : Colors.textSecondary} fill={isLiked ? '#DC2626' : 'none'} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Calendar color={Colors.primary} size={20} />
            <View>
              <AppText variant="bodySm" weight="bold">
                {d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin color={Colors.coral} size={20} />
            <View>
              <AppText variant="bodySm" weight="bold">
                {eventLocation}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Open to all verified community members
              </AppText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Users color={Colors.sage} size={20} />
            <View>
              <AppText variant="bodySm" weight="bold">
                {attendeeCount} going · Limit {eventData?.attendee_limit || 50}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Spots filling up
              </AppText>
            </View>
          </View>
        </Card>

        {/* About / Description */}
        <View style={styles.aboutSection}>
          <AppText variant="bodySm" weight="bold" style={{ marginBottom: 8 }}>
            About this Event
          </AppText>
          <AppText variant="body" color={Colors.textSecondary} style={{ lineHeight: 22 }}>
            {eventData?.description ||
              'Join fellow members for a welcoming community gathering. Connect, share experiences, and build authentic connections in your local hub.'}
          </AppText>
        </View>
      </ScrollView>

      {/* Bottom RSVP Bar */}
      <View style={styles.bottomBar}>
        <AppButton
          title={isRsvped ? '✓ You Are Going' : 'RSVP Now'}
          variant={isRsvped ? 'outline' : 'primary'}
          onPress={handleToggleRsvp}
          style={{ flex: 1 }}
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  coverWrapper: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: Colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  dateBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    alignItems: 'center',
    elevation: 3,
  },
  mainInfo: {
    padding: Spacing.md,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: Spacing.md,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
  },
  likeBtn: {
    padding: 8,
  },
  detailsCard: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutSection: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
