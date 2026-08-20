import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  X,
  Heart,
  Send,
  MoreHorizontal,
} from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

export default function StoryViewerScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [progress, setProgress] = useState(0.4)
  const [replyText, setReplyText] = useState('')
  const [liked, setLiked] = useState(false)

  // Demo story data
  const story = {
    userName: 'Sarah',
    userAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    timeAgo: '4h ago',
    imageUrl:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&fit=crop&q=80',
    caption: 'Sunrise meditation session at the park 🌿✨ Grounding for the week ahead.',
  }

  const handleNext = () => {
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* Fullscreen Story Image */}
      <Image source={{ uri: story.imageUrl }} style={styles.backgroundImage} resizeMode="cover" />

      {/* Dark Gradient Overlay */}
      <View style={styles.darkOverlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar Segments */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image source={{ uri: story.userAvatar }} style={styles.avatar} />
            <View>
              <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                {story.userName}
              </AppText>
              <AppText variant="caption" color="rgba(255, 255, 255, 0.75)">
                {story.timeAgo}
              </AppText>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <MoreHorizontal color="#FFFFFF" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <X color="#FFFFFF" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tap areas for next/previous navigation */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleNext}
          style={styles.touchArea}
        />

        {/* Story Caption Overlay */}
        {story.caption ? (
          <View style={styles.captionContainer}>
            <AppText variant="bodySm" weight="medium" color="#FFFFFF" style={styles.captionText}>
              {story.caption}
            </AppText>
          </View>
        ) : null}

        {/* Bottom Reply Bar */}
        <View style={styles.bottomBar}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            placeholder={`Reply to ${story.userName}...`}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.replyInput}
          />
          <TouchableOpacity
            onPress={() => setLiked(!liked)}
            style={styles.actionIconBtn}
          >
            <Heart
              color={liked ? '#EF4444' : '#FFFFFF'}
              fill={liked ? '#EF4444' : 'transparent'}
              size={24}
            />
          </TouchableOpacity>
          {replyText.trim() ? (
            <TouchableOpacity onPress={() => setReplyText('')} style={styles.actionIconBtn}>
              <Send color="#FFFFFF" size={22} />
            </TouchableOpacity>
          ) : null}
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
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  progressBarBackground: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  touchArea: {
    flex: 1,
  },
  captionContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  captionText: {
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  actionIconBtn: {
    padding: 6,
  },
})
