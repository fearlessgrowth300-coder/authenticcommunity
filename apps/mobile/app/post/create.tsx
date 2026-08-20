import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { createNewPost } from '@/services/feed'
import { uploadMediaFile } from '@/services/mediaUpload'
import {
  X,
  Globe,
  Users,
  Lock,
  Camera,
  Video,
  MapPin,
  Smile,
  Calendar,
  ChevronDown,
  Check,
} from 'lucide-react-native'

const AUDIENCES = [
  { id: 'public', label: 'Public (Everyone)', icon: <Globe color={Colors.primary} size={18} /> },
  { id: 'followers', label: 'Followers Only', icon: <Users color={Colors.primary} size={18} /> },
  { id: 'connections', label: 'Connections Only', icon: <Users color={Colors.sage} size={18} /> },
  { id: 'community', label: 'Specific Community', icon: <Users color={Colors.amber} size={18} /> },
  { id: 'only_me', label: 'Only Me', icon: <Lock color={Colors.textMuted} size={18} /> },
]

export default function CreatePostScreen() {
  const router = useRouter()
  const { type } = useLocalSearchParams<{ type?: string }>()
  const { profile } = useAuth()

  const [text, setText] = useState('')
  const [mediaUri, setMediaUri] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo')
  const [selectedAudience, setSelectedAudience] = useState(AUDIENCES[0])
  const [audienceModalVisible, setAudienceModalVisible] = useState(false)
  const [locationTag, setLocationTag] = useState<string | null>(
    profile?.location_city ? `${profile.location_city}, ${profile.location_country || ''}` : 'Local'
  )
  const [posting, setPosting] = useState(false)

  const handlePickMedia = async (mediaTypeToPick: 'photo' | 'video') => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypeToPick === 'photo' ? ['images'] : ['videos'],
      allowsEditing: true,
      quality: 0.85,
    })
    if (!res.canceled && res.assets[0]) {
      setMediaUri(res.assets[0].uri)
      setMediaType(mediaTypeToPick)
    }
  }

  const handlePost = async () => {
    if (!text.trim() && !mediaUri) return
    setPosting(true)

    try {
      let uploadedUrl: string | undefined = undefined

      // Upload media to storage bucket if attached
      if (mediaUri) {
        const uploadRes = await uploadMediaFile({
          bucket: 'post_media',
          localUri: mediaUri,
          type: mediaType === 'video' ? 'video' : 'image',
        })
        if (uploadRes.error) {
          Alert.alert('Upload Error', uploadRes.error.message)
          setPosting(false)
          return
        }
        uploadedUrl = uploadRes.url
      }

      const result = await createNewPost({
        content: text.trim(),
        audience: selectedAudience.id as any,
        locationLabel: locationTag || undefined,
        mediaUrl: uploadedUrl,
        mediaType: mediaType === 'video' ? 'video' : 'image',
        interestTags: (profile as any)?.interests?.slice(0, 3) || ['Community'],
      })

      if (result.error) {
        Alert.alert('Post Failed', result.error.message)
        setPosting(false)
        return
      }

      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to publish post.')
    } finally {
      setPosting(false)
    }
  }

  const canPost = text.trim().length > 0 || mediaUri !== null

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <AppText variant="bodySm" color={Colors.textSecondary}>
              Cancel
            </AppText>
          </TouchableOpacity>

          <AppText variant="h3" weight="bold">
            Create Post
          </AppText>

          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost || posting}
            style={[styles.postBtn, canPost ? styles.postBtnActive : styles.postBtnDisabled]}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <AppText
                variant="bodySm"
                weight="bold"
                color={canPost ? '#FFFFFF' : Colors.textMuted}
              >
                Post
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Author Profile Row & Audience Dropdown */}
          <View style={styles.authorRow}>
            <Image
              source={{
                uri:
                  profile?.profile_image_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.authorMeta}>
              <View style={styles.nameRow}>
                <AppText variant="bodySm" weight="bold">
                  {profile?.first_name || 'You'} {profile?.last_name || ''}
                </AppText>
                {profile?.is_verified && <VerifiedBadge size={14} />}
              </View>

              {/* Audience Selector Trigger */}
              <TouchableOpacity
                onPress={() => setAudienceModalVisible(true)}
                style={styles.audiencePill}
              >
                {selectedAudience.icon}
                <AppText variant="caption" weight="semibold" color={Colors.text}>
                  {selectedAudience.label.split(' ')[0]}
                </AppText>
                <ChevronDown color={Colors.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Post Textarea */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.textMuted}
            multiline
            autoFocus
            style={styles.textArea}
          />

          {/* Media Preview if picked */}
          {mediaUri && (
            <View style={styles.mediaPreviewContainer}>
              <Image source={{ uri: mediaUri }} style={styles.mediaPreview} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => setMediaUri(null)}
                style={styles.removeMediaBtn}
              >
                <X color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
          )}

          {/* Location Tag if active */}
          {locationTag && (
            <View style={styles.locationTagRow}>
              <MapPin color={Colors.primary} size={14} />
              <AppText variant="caption" color={Colors.textSecondary}>
                {locationTag}
              </AppText>
              <TouchableOpacity onPress={() => setLocationTag(null)}>
                <X color={Colors.textMuted} size={14} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Attachment Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            onPress={() => handlePickMedia('photo')}
            style={styles.toolbarBtn}
            accessibilityLabel="Add photo"
          >
            <Camera color={Colors.primary} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handlePickMedia('video')}
            style={styles.toolbarBtn}
            accessibilityLabel="Add video"
          >
            <Video color={Colors.sage} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLocationTag(locationTag ? null : 'Lagos, Nigeria')}
            style={styles.toolbarBtn}
            accessibilityLabel="Add location"
          >
            <MapPin color={Colors.coral} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/event/create')}
            style={styles.toolbarBtn}
            accessibilityLabel="Add event"
          >
            <Calendar color={Colors.amber} size={22} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarBtn} accessibilityLabel="Add emoji">
            <Smile color={Colors.textSecondary} size={22} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Audience Selector Modal */}
      <Modal
        visible={audienceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAudienceModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setAudienceModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={styles.audienceModalSheet}>
            <AppText variant="h3" weight="bold" style={styles.audienceModalTitle}>
              Who can see your post?
            </AppText>

            {AUDIENCES.map((aud) => (
              <TouchableOpacity
                key={aud.id}
                onPress={() => {
                  setSelectedAudience(aud)
                  setAudienceModalVisible(false)
                }}
                style={styles.audienceOption}
              >
                <View style={styles.audienceOptionLeft}>
                  {aud.icon}
                  <AppText variant="bodySm" weight="medium">
                    {aud.label}
                  </AppText>
                </View>
                {selectedAudience.id === aud.id && (
                  <Check color={Colors.primary} size={18} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
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
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radii.full,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnActive: {
    backgroundColor: Colors.primary,
  },
  postBtnDisabled: {
    backgroundColor: Colors.border,
  },
  scrollContent: {
    padding: Spacing.lg,
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.border,
  },
  authorMeta: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audiencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  textArea: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaPreviewContainer: {
    width: '100%',
    height: 240,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: Spacing.md,
    backgroundColor: Colors.border,
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbarBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  audienceModalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: 12,
  },
  audienceModalTitle: {
    marginBottom: Spacing.xs,
  },
  audienceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  audienceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
})
