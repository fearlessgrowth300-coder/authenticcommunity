import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
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

const EVENT_TYPES = ['Wellness', 'Social', 'Learning', 'Volunteer']

export default function CreateEventScreen() {
  const router = useRouter()
  const [coverPhoto, setCoverPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80'
  )
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [attendeeLimit, setAttendeeLimit] = useState('50')
  const [community, setCommunity] = useState('')
  const [selectedType, setSelectedType] = useState<string>('Wellness')

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

  const handleCreate = () => {
    router.replace('/(tabs)/events')
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
                placeholder="Select date"
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
                placeholder="Select time"
                placeholderTextColor={Colors.textMuted}
                style={styles.inputInside}
              />
              <Clock color={Colors.textMuted} size={16} />
            </View>
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
            <AppText variant="label" weight="semibold">
              Community
            </AppText>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={community}
                onChangeText={setCommunity}
                placeholder="Select a community"
                placeholderTextColor={Colors.textMuted}
                style={styles.inputInside}
              />
              <ChevronDown color={Colors.textMuted} size={16} />
            </View>
            <AppText variant="caption" color={Colors.textMuted}>
              Optional
            </AppText>
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
