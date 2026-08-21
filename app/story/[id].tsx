import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { sendDirectMessage } from '@/services/realtimeChat'
import { useVideoPlayer, VideoView } from 'expo-video'
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
  const [storyProfile, setStoryProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const videoPlayer = useVideoPlayer(
    storyData?.content_type === 'video' ? storyData.content_url : null,
    (player) => {
      player.loop = true
      player.play()
    }
  )

  useEffect(() => {
    if (!id) return
    const loadStory = async () => {
      setLoading(true)
      try {
        const { data, error } = await (supabase as any)
          .from('stories')
          .select('id, user_id, content_type, content_url, text_content, background_color, created_at, expires_at, is_deleted')
          .eq('id', id)
          .eq('is_deleted', false)
          .maybeSingle()
        if (error) throw error

        if (data) {
          setStoryData(data)
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, profile_image_url')
            .eq('user_id', data.user_id)
            .maybeSingle()
          setStoryProfile(profile)
          // Record story view
          if (user && data.user_id !== user.id) {
            await (supabase as any)
              .from('story_views')
              .upsert({ story_id: id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' })
          }
        }
      } catch {
        setStoryData(null)
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
      await sendDirectMessage(storyData.user_id, `Replied to your story: "${text}"`)
    } catch (error: any) {
      Alert.alert(
        error?.message?.includes('request sent') ? 'Message Request Sent' : 'Reply Not Sent',
        error?.message || 'Please try again.'
      )
    }
  }

  const story = {
    userName:
      `${storyProfile?.first_name || ''} ${storyProfile?.last_name || ''}`.trim() ||
      'Community Member',
    userAvatar:
      storyProfile?.profile_image_url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    timeAgo: 'Recently',
    imageUrl:
      storyData?.content_url ||
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&fit=crop&q=80',
    caption: storyData?.text_content || '',
  }

  const handleStoryMenu = () => {
    if (!storyData || !id) return
    if (storyData.user_id === user?.id) {
      Alert.alert('Your story', undefined, [
        {
          text: 'View viewers',
          onPress: async () => {
            const { count } = await (supabase as any)
              .from('story_views')
              .select('id', { count: 'exact', head: true })
              .eq('story_id', id)
            Alert.alert('Story viewers', `${count || 0} people viewed this story.`)
          },
        },
        {
          text: 'Delete story',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return
            const { error } = await (supabase as any).from('stories').update({ is_deleted: true }).eq('id', id).eq('user_id', user.id)
            if (error) Alert.alert('Could Not Delete Story', 'Please try again.')
            else router.back()
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }
    Alert.alert('Story options', undefined, [
      {
        text: 'Report story',
        style: 'destructive',
        onPress: async () => {
          if (!user) return
          const { error } = await (supabase as any).from('reports').insert({
            reporter_id: user.id,
            reported_user_id: storyData.user_id,
            report_type: 'story',
            reason: 'other',
            description: `Story ${id} reported from the story viewer`,
            status: 'pending',
          })
          Alert.alert(error ? 'Report Not Sent' : 'Report Sent', error ? 'Please try again.' : 'Our safety team will review it.')
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleNext = () => {
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* Fullscreen Story Image */}
      {storyData?.content_type === 'video' ? (
        <VideoView player={videoPlayer} style={styles.backgroundImage} nativeControls={false} contentFit="cover" />
      ) : (
        <Image source={{ uri: story.imageUrl }} style={styles.backgroundImage} resizeMode="cover" />
      )}

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
            <TouchableOpacity onPress={handleStoryMenu} style={styles.headerBtn} accessibilityLabel="Story options">
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

        {loading ? <ActivityIndicator color="#FFFFFF" size="large" style={styles.loading} /> : !storyData ? (
          <View style={styles.unavailable}><AppText variant="body" color="#FFFFFF">This story is no longer available.</AppText></View>
        ) : null}

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
  loading: { position: 'absolute', alignSelf: 'center', top: '48%' },
  unavailable: { position: 'absolute', top: '45%', alignSelf: 'center', padding: Spacing.lg },
})
