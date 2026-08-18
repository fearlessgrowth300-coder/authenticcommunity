import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Camera, User } from 'lucide-react-native'

export default function OnboardingBioScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '25')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.profile_image_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri)
      }
    } catch {
      // Permission or device cancellation handled gracefully
    }
  }

  const handleFinish = async () => {
    if (!firstName.trim()) {
      setError('Please provide your first name.')
      return
    }

    const numAge = parseInt(age, 10)
    if (isNaN(numAge) || numAge < 18 || numAge > 120) {
      setError('Please enter a valid age (18+).')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      let finalAvatarUrl = avatarUri

      // If avatar is a local file URI from picker, upload to avatars bucket
      if (avatarUri && !avatarUri.startsWith('http')) {
        try {
          const response = await fetch(avatarUri)
          const blob = await response.blob()
          const fileExt = avatarUri.split('.').pop() || 'jpg'
          const filePath = `${user.id}/avatar_${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, { upsert: true })

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath)
            finalAvatarUrl = publicUrlData.publicUrl
          }
        } catch {
          // Continue if local image upload fails in offline test
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim() || null,
            age: numAge,
            bio: bio.trim() || null,
            profile_image_url: finalAvatarUrl,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (updateError) throw updateError

      await refreshProfile()
      router.replace('/(tabs)')
    } catch (err: any) {
      setError(err?.message || 'Failed to complete profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <AppText variant="caption" color={Colors.sage} weight="semibold">
              Step 4 of 4: Profile & Bio
            </AppText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Almost there!
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              Introduce yourself to the community.
            </AppText>
          </View>

          {/* Avatar Picker */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
              <Avatar
                url={avatarUri}
                name={firstName || 'User'}
                size={88}
              />
              <View style={styles.cameraIconBadge}>
                <Camera color={Colors.surface} size={14} />
              </View>
            </TouchableOpacity>
            <AppText variant="caption" color={Colors.primary} weight="medium" style={styles.avatarHint}>
              Tap to add photo
            </AppText>
          </View>

          <Card style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.danger}>
                  {error}
                </AppText>
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.col}>
                <AppInput
                  label="First Name"
                  placeholder="Alex"
                  value={firstName}
                  onChangeText={setFirstName}
                  leftIcon={<User color={Colors.textMuted} size={18} />}
                />
              </View>
              <View style={styles.col}>
                <AppInput
                  label="Last Name"
                  placeholder="Taylor"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <AppInput
              label="Age"
              placeholder="25"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />

            <AppInput
              label="Bio / About You"
              placeholder="A few words about what brings you here, what you enjoy exploring, or what kind of friendships you're seeking..."
              multiline
              numberOfLines={4}
              value={bio}
              onChangeText={setBio}
              style={styles.bioInput}
            />

            <AppButton
              title="Complete Onboarding & Enter"
              onPress={handleFinish}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.sage,
    borderRadius: 2,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarButton: {
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 6,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarHint: {
    marginTop: 8,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  col: {
    flex: 1,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: 8,
  },
})
