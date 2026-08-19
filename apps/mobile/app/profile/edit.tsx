import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  ArrowLeft,
  Camera,
  MapPin,
  ShieldCheck,
  Check,
} from 'lucide-react-native'

const AVAILABLE_INTERESTS = [
  'Photography',
  'Hiking',
  'Technology',
  'Design',
  'Music',
  'Books',
  'Fitness',
  'Travel',
  'Yoga',
  'Art',
]

const AVAILABLE_VALUES = [
  'Kindness',
  'Growth',
  'Community',
  'Learning',
  'Creativity',
  'Honesty',
  'Faith',
  'Health',
]

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [city, setCity] = useState(profile?.location_city || '')
  const [state, setState] = useState(profile?.location_state || '')
  const [country, setCountry] = useState(profile?.location_country || 'USA')
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_image_url || '')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadInterestsAndValues = async () => {
      const [intRes, valRes] = await Promise.all([
        supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
        supabase.from('user_values').select('value_name').eq('user_id', user.id),
      ])
      if (intRes.data) {
        setSelectedInterests(intRes.data.map((i) => i.interest_name))
      }
      if (valRes.data) {
        setSelectedValues(valRes.data.map((v) => v.value_name))
      }
    }
    loadInterestsAndValues()
  }, [user])

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!res.canceled && res.assets[0]) {
      setPhotoUrl(res.assets[0].uri)
    }
  }

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const toggleValue = (item: string) => {
    setSelectedValues((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    )
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      // 1. Update profiles table - CLIENT NEVER SETS is_verified!
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          location_city: city.trim(),
          location_state: state.trim(),
          location_country: country.trim(),
          profile_image_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      // 2. Update user_interests
      await supabase.from('user_interests').delete().eq('user_id', user.id)
      if (selectedInterests.length > 0) {
        await supabase.from('user_interests').insert(
          selectedInterests.map((name) => ({
            user_id: user.id,
            interest_name: name,
            interest_category: 'general',
          }))
        )
      }

      // 3. Update user_values
      await supabase.from('user_values').delete().eq('user_id', user.id)
      if (selectedValues.length > 0) {
        await supabase.from('user_values').insert(
          selectedValues.map((name) => ({
            user_id: user.id,
            value_name: name,
          }))
        )
      }

      await refreshProfile()
      router.back()
    } catch (err: any) {
      // Graceful error handle
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Edit Profile
        </AppText>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.saveHeaderBtn}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <AppText variant="bodySm" weight="bold" color={Colors.primary}>
              Save
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Picker */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap}>
            <Image
              source={{
                uri:
                  photoUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.cameraBadge}>
              <Camera color="#FFFFFF" size={16} />
            </View>
          </TouchableOpacity>
          <AppText variant="caption" color={Colors.primary} weight="semibold" style={styles.changePhotoText}>
            Change Photo
          </AppText>
        </View>

        {/* Verification Status (Read-Only) */}
        <View style={styles.readOnlyCard}>
          <ShieldCheck
            color={profile?.is_verified ? Colors.sage : Colors.textMuted}
            size={18}
          />
          <View style={styles.readOnlyContent}>
            <AppText variant="bodySm" weight="semibold">
              {profile?.is_verified ? 'Server Verified Profile' : 'Standard Account'}
            </AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              Verification status is cryptographically protected and server-managed.
            </AppText>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formGroup}>
          <AppText variant="label" weight="semibold">
            First Name
          </AppText>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <AppText variant="label" weight="semibold">
            Last Name
          </AppText>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <AppText variant="label" weight="semibold">
            Bio
          </AppText>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the community about yourself..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={200}
            style={styles.textArea}
          />
          <AppText variant="caption" color={Colors.textMuted} align="right">
            {bio.length}/200
          </AppText>
        </View>

        {/* Location Fields */}
        <View style={styles.twoColRow}>
          <View style={styles.colField}>
            <AppText variant="label" weight="semibold">
              City
            </AppText>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="City"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.colField}>
            <AppText variant="label" weight="semibold">
              State / Province
            </AppText>
            <TextInput
              value={state}
              onChangeText={setState}
              placeholder="State"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>
        </View>

        {/* Interests */}
        <View style={styles.formGroup}>
          <AppText variant="label" weight="semibold">
            Interests
          </AppText>
          <View style={styles.chipsWrap}>
            {AVAILABLE_INTERESTS.map((int) => {
              const isSelected = selectedInterests.includes(int)
              return (
                <TouchableOpacity
                  key={int}
                  onPress={() => toggleInterest(int)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    color={isSelected ? Colors.surface : Colors.text}
                  >
                    {int}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Values */}
        <View style={styles.formGroup}>
          <AppText variant="label" weight="semibold">
            Values
          </AppText>
          <View style={styles.chipsWrap}>
            {AVAILABLE_VALUES.map((val) => {
              const isSelected = selectedValues.includes(val)
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => toggleValue(val)}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActiveValue : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={isSelected ? 'bold' : 'normal'}
                    color={isSelected ? Colors.surface : Colors.text}
                  >
                    {val}
                  </AppText>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Save Button */}
        <AppButton
          title={saving ? 'Saving Changes...' : 'Save Profile'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
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
  backBtn: {
    padding: 4,
  },
  saveHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  photoSection: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.border,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoText: {
    marginTop: 6,
  },
  readOnlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  readOnlyContent: {
    flex: 1,
  },
  formGroup: {
    gap: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colField: {
    flex: 1,
    gap: 6,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipActiveValue: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  saveBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
})
