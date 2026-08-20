import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { uploadMediaFile } from '@/services/mediaUpload'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/primitives/Card'
import { Camera, Sparkles, ChevronRight, User } from 'lucide-react-native'

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80'

const AI_BIO_SUGGESTIONS = [
  'Designer by day, coffee enthusiast always ☕. Love great conversations, local adventures, and building meaningful connections.',
  'Curious explorer passionate about technology, outdoor trails, and finding hidden local food spots. Always up for a good chat!',
  'Community builder and avid reader 📚. Believer in intentional living, personal growth, and creating authentic moments.',
]

export default function OnboardingBioScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [photoUri, setPhotoUri] = useState<string>(
    profile?.profile_image_url || DEFAULT_AVATAR
  )
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [bio, setBio] = useState(
    profile?.bio ||
      'Designer by day, coffee enthusiast always ☕. Love great conversations, local adventures, and building meaningful connections.'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        setError('Photo library permission is required to upload an avatar.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri)
        setPhotoBase64((result.assets[0] as any)?.base64 || null)
        setError(null)
      }
    } catch {
      setError('Could not pick photo. You can continue with default avatar.')
    }
  }

  const handleAiAssist = () => {
    const randomBio =
      AI_BIO_SUGGESTIONS[Math.floor(Math.random() * AI_BIO_SUGGESTIONS.length)]
    setBio(randomBio)
  }

  const handleFinish = async () => {
    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      let finalAvatarUrl = photoUri

      // If user selected a new local image, upload to Supabase avatars bucket
      if (photoUri && (photoUri.startsWith('file://') || photoUri.startsWith('content://') || photoUri.startsWith('blob:'))) {
        const uploadRes = await uploadMediaFile({
          bucket: 'avatars',
          localUri: photoUri,
          base64: photoBase64,
          type: 'image',
        })
        if (!uploadRes.error && uploadRes.url) {
          finalAvatarUrl = uploadRes.url
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            bio: bio.trim() || null,
            profile_image_url: finalAvatarUrl || null,
            onboarding_completed: true,
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator Header (✓ ── ✓ ── ✓ ── 4) */}
          <StepIndicator currentStep={4} />

          {/* Title & Subtitle */}
          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Add a photo & tell us about you
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              Help others get to know the real you.
            </AppText>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={Colors.danger}>
                {error}
              </AppText>
            </View>
          )}

          {/* Photo Picker */}
          <View style={styles.photoContainer}>
            <View style={styles.photoWrapper}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <User color={Colors.textMuted} size={48} />
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={styles.cameraBadge}
                accessibilityLabel="Upload profile photo"
              >
                <Camera color={Colors.surface} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio Input Card */}
          <Card style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <AppText variant="label" weight="medium">
                Bio (optional)
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                {bio.length}/200
              </AppText>
            </View>

            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={(t: string) => setBio(t.slice(0, 200))}
              placeholder="Designer by day, coffee enthusiast always ☕. Love great conversations, local adventures, and building meaningful connections."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              maxLength={200}
            />

            {/* AI Assist helper card */}
            <TouchableOpacity
              onPress={handleAiAssist}
              style={styles.aiAssistCard}
            >
              <View style={styles.aiAssistLeft}>
                <Sparkles color={Colors.primary} size={16} />
                <View>
                  <AppText variant="bodySm" weight="semibold" color={Colors.primary}>
                    AI Assist
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Need ideas? Let AI help you write your bio.
                  </AppText>
                </View>
              </View>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          </Card>

          {/* Finish & Explore Button */}
          <AppButton
            title="Finish & Explore"
            onPress={handleFinish}
            loading={loading}
            style={styles.finishButton}
          />
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
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  photoWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  bioCard: {
    marginBottom: Spacing.xl,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioInput: {
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    padding: Spacing.md,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  aiAssistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiAssistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  finishButton: {
    marginBottom: Spacing.xl,
  },
})
