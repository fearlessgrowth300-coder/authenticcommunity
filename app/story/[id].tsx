import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
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
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [progress, setProgress] = useState(0.5)
  const [replyText, setReplyText] = useState('')
  const [liked, setLiked] = useState(false)
  const [storyData, setStoryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const loadStory = async () => {
      setLoading(true)
      try {
        const { data } = await (supabase as any)
          .from('stories')
          .select('*, profiles(first_name, last_name, profile_image_url)')
          .eq('id', id)
          .maybeSingle()

        if (data) {
          setStoryData(data)
          // Record story view
          if (user) {
            await (supabase as any)
              .from('story_views')
              .insert({ story_id: id, viewer_id: user.id })
              .catch(() => {})
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadStory()
  }, [id, user])

  const handleToggleLike = async () => {
    if (!user || !id) return
    if (liked) {
      setLiked(false)
      await (supabase as any)
        .from('story_likes')
        .delete()
        .eq('story_id', id)
        .eq('user_id', user.id)
        .catch(() => {})
    } else {
      setLiked(true)
      await (supabase as any)
        .from('story_likes')
        .insert({ story_id: id, user_id: user.id })
        .catch(() => {})
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !user || !storyData?.user_id) return
    const text = replyText.trim()
    setReplyText('')

    try {
      // Send as direct message referencing story
      await (supabase as any).from('messages').insert({
        sender_id: user.id,
        recipient_id: storyData.user_id,
        content: `Replied to your story: "${text}"`,
      })
    } catch {
      // Graceful
    }
  }

  const story = {
    userName:
      `${storyData?.profiles?.first_name || ''} ${storyData?.profiles?.last_name || ''}`.trim() ||
      'Community Member',
    userAvatar:
      storyData?.profiles?.profile_image_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    timeAgo: 'Recently',
    imageUrl:
      storyData?.media_url ||
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&fit=crop&q=80',
    caption: storyData?.caption || '',
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

        {/* Bottom Reply Bar & Heart */}
        <View style={styles.bottomBar}>
          <View style={styles.replyInputWrapper}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to ${story.userName}...`}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={styles.replyInput}
            />
            {replyText.trim() ? (
              <TouchableOpacity onPress={handleSendReply} style={styles.sendIconBtn}>
                <Send color="#FFFFFF" size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleToggleLike}
            style={[styles.heartBtn, liked ? styles.heartBtnActive : null]}
          >
            <Heart
              color={liked ? '#EF4444' : '#FFFFFF'}
              fill={liked ? '#EF4444' : 'transparent'}
              size={22}
            />
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
    top: 0,
    left: 0,
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
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: Radii.full,
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    padding: 6,
  },
  touchArea: {
    flex: 1,
  },
  captionContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  captionText: {
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  replyInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    height: 44,
  },
  replyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  sendIconBtn: {
    padding: 4,
    marginLeft: 6,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
})
