import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  X,
  Camera,
  Flame,
  Send,
} from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

export default function CreateStoryScreen() {
  const router = useRouter()
  const [photoUri, setPhotoUri] = useState<string | null>(
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&fit=crop&q=80'
  )
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    })
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri)
    }
  }

  const handleShareStory = () => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      router.replace('/(tabs)')
    }, 600)
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

        {/* Center Text Overlay */}
        <View style={styles.textOverlayContainer}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Tap to add a caption..."
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            multiline
            style={styles.captionInput}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleShareStory}
            disabled={uploading}
            style={styles.shareStoryBtn}
          >
            <Flame color="#FFFFFF" size={20} />
            <AppText variant="bodySm" weight="bold" color="#FFFFFF">
              {uploading ? 'Sharing...' : 'Your Story'}
            </AppText>
          </TouchableOpacity>
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
    width,
    height,
    position: 'absolute',
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
  captionInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
