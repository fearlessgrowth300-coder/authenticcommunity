import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  Camera,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  Lock,
} from 'lucide-react-native'

const EVENT_TYPES = ['Wellness', 'Social', 'Business', 'Sports', 'Learning', 'Volunteer']
const EVENT_PRIVACY = ['public', 'followers', 'connections', 'community', 'private'] as const

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { uploadMediaFile } from '@/services/mediaUpload'

export default function CreateEventScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [coverPhoto, setCoverPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80'
  )
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [attendeeLimit, setAttendeeLimit] = useState('50')
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([])
  const [privacy, setPrivacy] = useState<(typeof EVENT_PRIVACY)[number]>('public')
  const [selectedType, setSelectedType] = useState<string>('Wellness')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('community_members')
      .select('community_id, communities(community_name)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => {
        setCommunities((data || []).map((row: any) => ({
          id: row.community_id,
          name: row.communities?.community_name || 'Community',
        })))
      })
  }, [user])

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!res.canceled && res.assets[0]) {
      setCoverPhoto(res.assets[0].uri)
    }
  }

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to create an event.')
      return
    }
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert('Complete Required Fields', 'Add a title, location, and description.')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim()) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) {
      Alert.alert('Check Date and Time', 'Use YYYY-MM-DD for the date and 24-hour HH:MM for the start time.')
      return
    }
    if (endTime.trim() && !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime.trim())) {
      Alert.alert('Check End Time', 'Use 24-hour HH:MM for the end time.')
      return
    }
    const parsedDate = new Date(`${date.trim()}T${time.trim()}:00`)
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
      Alert.alert('Choose a Future Date', 'Events must start in the future.')
      return
    }
    if (privacy === 'community' && !communityId) {
      Alert.alert('Choose a Community', 'Community-only events must belong to a community.')
      return
    }
    setLoading(true)
    try {
      let uploadedCoverUrl = null
      if (coverPhoto && (coverPhoto.startsWith('file:') || coverPhoto.startsWith('content:'))) {
        const uploadRes = await uploadMediaFile({
          localUri: coverPhoto,
          bucket: 'event-photos',
          type: 'image',
        })
        if (uploadRes.url) uploadedCoverUrl = uploadRes.url
      } else {
        uploadedCoverUrl = coverPhoto
      }

      const { data: newEvent, error: createError } = await (supabase as any)
        .from('events')
        .insert({
          name: title.trim(),
          description: description.trim() || `${selectedType} meetup event.`,
          event_date: date.trim(),
          start_time: `${time.trim()}:00`,
          end_time: endTime.trim() ? `${endTime.trim()}:00` : null,
          location: location.trim(),
          category: selectedType,
          event_image_url: uploadedCoverUrl || 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80',
          max_attendees: attendeeLimit.trim() ? Math.max(1, parseInt(attendeeLimit, 10) || 1) : null,
          organizer_id: user.id,
          community_id: communityId,
          privacy,
        })
        .select('id')
        .single()

      if (createError) throw createError

      if (newEvent?.id && user) {
        const { error: attendeeError } = await (supabase as any).from('event_attendees').upsert({
          event_id: newEvent.id,
          user_id: user.id,
          rsvp_status: 'going',
        })
        if (attendeeError) throw attendeeError
        router.replace(`/event/${newEvent.id}`)
      } else {
        router.replace('/(tabs)/events')
      }
    } catch (error: any) {
      Alert.alert('Could Not Create Event', error?.message || 'Please check the details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <AppText variant="bodySm" color={Colors.textSecondary}>
            Cancel
          </AppText>
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Create Event
        </AppText>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cover Photo */}
        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">
            Cover Photo
          </AppText>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.coverPhotoWrap}>
            {coverPhoto && (
              <Image source={{ uri: coverPhoto }} style={styles.coverImage} />
            )}
            <View style={styles.cameraBadge}>
              <Camera color="#FFFFFF" size={18} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Event Title */}
        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">
            Event Title *
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Community Picnic in the Park"
            placeholderTextColor={Colors.textMuted}
            style={styles.textInput}
          />
        </View>

        {/* Date & Time (2 Columns) */}
        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <AppText variant="label" weight="semibold">
              Date *
            </AppText>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
                style={styles.inputInside}
              />
              <Calendar color={Colors.textMuted} size={16} />
            </View>
          </View>

          <View style={styles.columnField}>
            <AppText variant="label" weight="semibold">
              Time *
            </AppText>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textMuted}
                style={styles.inputInside}
              />
              <Clock color={Colors.textMuted} size={16} />
            </View>
          </View>
        </View>

        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">End Time</AppText>
          <View style={styles.inputWithIcon}>
            <TextInput value={endTime} onChangeText={setEndTime} placeholder="HH:MM (optional)" placeholderTextColor={Colors.textMuted} style={styles.inputInside} />
            <Clock color={Colors.textMuted} size={16} />
          </View>
        </View>

        {/* Location */}
        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">
            Location *
          </AppText>
          <View style={styles.inputWithIcon}>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Search for a location"
              placeholderTextColor={Colors.textMuted}
              style={styles.inputInside}
            />
            <MapPin color={Colors.textMuted} size={16} />
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">
            Description *
          </AppText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people about your event..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={styles.textArea}
          />
          <AppText variant="caption" color={Colors.textMuted} align="right" style={styles.counterText}>
            {description.length}/500
          </AppText>
        </View>

        {/* Attendee Limit & Community (2 Columns) */}
        <View style={styles.twoColumnRow}>
          <View style={styles.columnField}>
            <AppText variant="label" weight="semibold">
              Attendee Limit
            </AppText>
            <TextInput
              value={attendeeLimit}
              onChangeText={setAttendeeLimit}
              keyboardType="number-pad"
              placeholder="50"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
            />
            <AppText variant="caption" color={Colors.textMuted}>
              Leave blank for unlimited
            </AppText>
          </View>

          <View style={styles.columnField}>
            <AppText variant="label" weight="semibold">Community</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compactChips}>
              <TouchableOpacity onPress={() => setCommunityId(null)} style={[styles.typeChip, !communityId ? styles.typeChipActive : null]}>
                <AppText variant="caption">None</AppText>
              </TouchableOpacity>
              {communities.map((item) => (
                <TouchableOpacity key={item.id} onPress={() => setCommunityId(item.id)} style={[styles.typeChip, communityId === item.id ? styles.typeChipActive : null]}>
                  <AppText variant="caption" numberOfLines={1}>{item.name}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">Privacy</AppText>
          <View style={styles.typesRow}>
            {EVENT_PRIVACY.map((item) => (
              <TouchableOpacity key={item} onPress={() => setPrivacy(item)} style={[styles.typeChip, privacy === item ? styles.typeChipActive : null]}>
                <AppText variant="caption" weight={privacy === item ? 'bold' : 'normal'} color={privacy === item ? Colors.primary : Colors.textSecondary}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Event Type (Optional) */}
        <View style={styles.fieldSection}>
          <AppText variant="label" weight="semibold">
            Event Type (Optional)
          </AppText>
          <View style={styles.typesRow}>
            {EVENT_TYPES.map((type) => {
              const isSelected = selectedType === type
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.typeChip,
                    isSelected ? styles.typeChipActive : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    color={isSelected ? Colors.primary : Colors.textSecondary}
                  >
                    {type === 'Wellness' && '🌸 '}
                    {type === 'Social' && '👥 '}
                    {type === 'Business' && '💼 '}
                    {type === 'Sports' && '⚽ '}
                    {type === 'Learning' && '💡 '}
                    {type === 'Volunteer' && '🤝 '}
                    {type}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <AppButton
            title="Create Event"
            onPress={handleCreate}
            style={styles.createBtn}
          />
          <View style={styles.safetyDisclaimer}>
            <Lock color={Colors.textMuted} size={13} />
            <AppText variant="caption" color={Colors.textMuted}>
              Events are reviewed to ensure a safe experience.
            </AppText>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: {
    padding: 4,
  },
  headerRightPlaceholder: {
    width: 48,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  fieldSection: {
    gap: 6,
  },
  coverPhotoWrap: {
    height: 150,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  columnField: {
    flex: 1,
    gap: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
  },
  inputInside: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  counterText: {
    marginTop: 2,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactChips: {
    gap: 6,
    paddingVertical: 2,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#C7D2FE',
  },
  bottomSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: 12,
    alignItems: 'center',
  },
  createBtn: {
    width: '100%',
  },
  safetyDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
})
