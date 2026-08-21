import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { createStory } from '@/services/stories'
import { uploadMediaFile } from '@/services/mediaUpload'
import {
  X,
  Camera,
  Flame,
} from 'lucide-react-native'

export default function CreateStoryScreen() {
  const router = useRouter()
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
      base64: true,
    })
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri)
      setPhotoBase64((res.assets[0] as any)?.base64 || null)
    }
  }

  const handleShareStory = async () => {
    if (!photoUri || uploading) return
    setUploading(true)

    try {
      const uploadRes = await uploadMediaFile({
        bucket: 'stories',
        localUri: photoUri,
        base64: photoBase64,
        type: 'image',
      })

      if (uploadRes.error) {
        Alert.alert('Upload Error', uploadRes.error.message)
        setUploading(false)
        return
      }

      const createRes = await createStory({
        mediaUrl: uploadRes.url,
        caption: caption.trim() || undefined,
      })

      if (createRes.error) {
        Alert.alert('Story Error', createRes.error.message)
        setUploading(false)
        return
      }

      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to share story.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.backgroundImage} resizeMode="cover" />
      ) : null}

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <X color="#FFFFFF" size={20} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickPhoto} style={styles.circleBtn}>
            <Camera color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Center Prompt or Caption Overlay */}
        <View style={styles.textOverlayContainer}>
          {!photoUri ? (
            <TouchableOpacity onPress={handlePickPhoto} style={styles.pickPromptBox}>
              <Camera color="#FFFFFF" size={40} />
              <AppText variant="body" weight="bold" color="#FFFFFF">
                Select Photo from Gallery
              </AppText>
            </TouchableOpacity>
          ) : (
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Tap to add a caption..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              multiline
              style={styles.captionInput}
            />
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          {photoUri && (
            <TouchableOpacity
              onPress={handleShareStory}
              disabled={uploading}
              style={styles.shareStoryBtn}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Flame color="#FFFFFF" size={20} />
                  <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                    Your Story
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlayContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  pickPromptBox: {
    alignItems: 'center',
    gap: 12,
    padding: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: Radii.lg,
  },
  captionInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.md,
    width: '100%',
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  shareStoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
})
