import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { recommendationEventBuffer } from '@/services/recommendationEventBuffer'
import { followUser } from '@/services/socialGraph'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
  MapPin,
} from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

export default function VideoReelScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [isPlaying, setIsPlaying] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [videoData, setVideoData] = useState<any>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [followStatus, setFollowStatus] = useState<'not_following' | 'following' | 'requested'>('not_following')
  const telemetryStartedRef = useRef(false)
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true
    instance.play()
  })

  useEffect(() => {
    if (!id) return
    const loadVideo = async () => {
      setLoading(true)
      try {
        const { data, error } = await (supabase as any)
          .from('posts')
          .select('id, user_id, community_id, content, content_type, interest_tags, location_label, created_at')
          .eq('id', id)
          .maybeSingle()

        if (error) throw error
        if (data) {
          const [profileRes, mediaRes, likesCountRes, commentsCountRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, first_name, last_name, profile_image_url, is_verified, location_city')
              .eq('user_id', data.user_id)
              .maybeSingle(),
            (supabase as any)
              .from('post_media')
              .select('media_url')
              .eq('post_id', id)
              .eq('media_type', 'video')
              .order('sort_order', { ascending: true })
              .limit(1)
              .maybeSingle(),
            (supabase as any).from('post_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', id),
            (supabase as any).from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', id),
          ])
          setVideoData({ ...data, profiles: profileRes.data, comments_count: commentsCountRes.count || 0 })
          setVideoUrl(mediaRes.data?.media_url || null)
          setLikesCount(likesCountRes.count || 0)

          if (user) {
            const [likeRes, saveRes, followRes] = await Promise.all([
              (supabase as any).from('post_likes').select('post_id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
              (supabase as any).from('post_saves').select('post_id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
              (supabase as any).from('user_follows').select('following_id').eq('follower_id', user.id).eq('following_id', data.user_id).maybeSingle(),
            ])
            setIsLiked(Boolean(likeRes.data))
            setIsSaved(Boolean(saveRes.data))
            setFollowStatus(data.user_id === user.id || Boolean(followRes.data) ? 'following' : 'not_following')
          }
        }
      } catch (error: any) {
        Alert.alert('Could Not Load Video', error?.message || 'Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [id, user])

  useEffect(() => {
    if (!id || !videoUrl || telemetryStartedRef.current) return
    telemetryStartedRef.current = true
    const openedAt = Date.now()
    let maximumPercent = 0
    let previousTime = 0
    let completed = false
    recommendationEventBuffer.enqueue({
      surface: 'videos', event_type: 'video_start', item_type: 'video', item_id: id,
      algorithm_version: 'video_v1',
    })
    const timer = setInterval(() => {
      const duration = Number(player.duration || 0)
      const current = Number(player.currentTime || 0)
      if (duration > 0) maximumPercent = Math.max(maximumPercent, Math.min(100, (current / duration) * 100))
      if (previousTime > 3 && current + 2 < previousTime) {
        recommendationEventBuffer.enqueue({
          surface: 'videos', event_type: 'video_replay', item_type: 'video', item_id: id,
          algorithm_version: 'video_v1',
        })
      }
      if (!completed && maximumPercent >= 90) {
        completed = true
        recommendationEventBuffer.enqueue({
          surface: 'videos', event_type: 'video_complete', item_type: 'video', item_id: id,
          algorithm_version: 'video_v1', safe_metadata: { watch_percent: Math.round(maximumPercent), is_complete: true },
        })
      }
      previousTime = current
    }, 1_000)
    return () => {
      clearInterval(timer)
      recommendationEventBuffer.enqueue({
        surface: 'videos', event_type: 'video_watch', item_type: 'video', item_id: id,
        algorithm_version: 'video_v1',
        safe_metadata: { watch_time_ms: Date.now() - openedAt, watch_percent: Math.round(maximumPercent), is_complete: completed },
      })
      telemetryStartedRef.current = false
    }
  }, [id, player, videoUrl])

  const togglePlay = () => {
    if (isPlaying) player.pause()
    else player.play()
    setIsPlaying((current) => !current)
  }

  const handleToggleLike = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to like videos.')
      return
    }
    if (!id) return

    if (isLiked) {
      const { error } = await (supabase as any).from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
      if (error) return Alert.alert('Error', error.message)
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
    } else {
      const { error } = await (supabase as any).from('post_likes').upsert({ post_id: id, user_id: user.id })
      if (error) return Alert.alert('Error', error.message)
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      recommendationEventBuffer.enqueue({ surface: 'videos', event_type: 'post_like', item_type: 'video', item_id: id, algorithm_version: 'video_v1' })
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to save videos.')
      return
    }
    if (!id) return

    if (isSaved) {
      const { error } = await (supabase as any).from('post_saves').delete().eq('post_id', id).eq('user_id', user.id)
      if (error) return Alert.alert('Error', error.message)
      setIsSaved(false)
    } else {
      const { error } = await (supabase as any).from('post_saves').upsert({ post_id: id, user_id: user.id })
      if (error) return Alert.alert('Error', error.message)
      setIsSaved(true)
      recommendationEventBuffer.enqueue({ surface: 'videos', event_type: 'post_save', item_type: 'video', item_id: id, algorithm_version: 'video_v1' })
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this community video by ${videoData?.profiles?.first_name || 'a member'} on Authentic Community!`,
        url: `https://authenticcommunity.fun/video/${id}`,
      })
      if (id) recommendationEventBuffer.enqueue({ surface: 'videos', event_type: 'post_share', item_type: 'video', item_id: id, algorithm_version: 'video_v1' })
    } catch {
      // Ignore
    }
  }

  const handleFollow = async () => {
    if (!user || !id || !videoData?.user_id || videoData.user_id === user.id || followStatus !== 'not_following') return
    try {
      setFollowStatus(await followUser(videoData.user_id))
    } catch {
      return Alert.alert('Could Not Follow', 'Please try again.')
    }
    recommendationEventBuffer.enqueue({ surface: 'videos', event_type: 'follow', item_type: 'video', item_id: id, algorithm_version: 'video_v1' })
  }

  const handleCommunityVisit = () => {
    if (!id || !videoData?.community_id) return
    recommendationEventBuffer.enqueue({ surface: 'videos', event_type: 'community_view', item_type: 'video', item_id: id, algorithm_version: 'video_v1' })
    router.push(`/community/${videoData.community_id}`)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    )
  }

  const author = videoData?.profiles
  const authorName = author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Community Member' : 'Member'
  const authorAvatar = author?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80'
  return (
    <View style={styles.container}>
      {videoUrl ? (
        <VideoView player={player} style={styles.videoPlayer} contentFit="cover" nativeControls={false} />
      ) : (
        <View style={[styles.videoPlayer, styles.missingVideo]}>
          <AppText variant="body" weight="bold" color="#FFFFFF">Video unavailable</AppText>
        </View>
      )}

      <TouchableOpacity style={styles.playOverlay} activeOpacity={1} onPress={togglePlay} accessibilityRole="button" accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}>
        {!isPlaying && (
          <View style={styles.playCenterBtn}>
            <Play color="#FFFFFF" size={40} fill="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Top Header */}
      <SafeAreaView style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <AppText variant="bodySm" weight="bold" color="#FFFFFF">
          Community Reel
        </AppText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Right Action Rail */}
      <View style={styles.rightActionRail}>
        <TouchableOpacity onPress={handleToggleLike} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={isLiked ? 'Unlike video' : 'Like video'} accessibilityState={{ selected: isLiked }}>
          <Heart
            color={isLiked ? '#DC2626' : '#FFFFFF'}
            fill={isLiked ? '#DC2626' : 'none'}
            size={28}
          />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {likesCount}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/post/${id}`)} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Open video comments">
          <MessageCircle color="#FFFFFF" size={28} />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {videoData?.comments_count || 0}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggleSave} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove saved video' : 'Save video'} accessibilityState={{ selected: isSaved }}>
          <Bookmark
            color={isSaved ? Colors.amber : '#FFFFFF'}
            fill={isSaved ? Colors.amber : 'none'}
            size={28}
          />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {isSaved ? 'Saved' : 'Save'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionBtn} accessibilityRole="button" accessibilityLabel="Share video">
          <Share2 color="#FFFFFF" size={26} />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            Share
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Bottom Metadata */}
      <View style={styles.bottomMetadata}>
        <TouchableOpacity
          onPress={() => author?.user_id && router.push(`/profile/${author.user_id}`)}
          style={styles.authorRow}
        >
          <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} />
          <View>
            <View style={styles.nameBadgeRow}>
              <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                {authorName}
              </AppText>
              {author?.is_verified && <VerifiedBadge size={14} />}
            </View>
            {author?.location_city && (
              <View style={styles.locationRow}>
                <MapPin color="rgba(255,255,255,0.8)" size={12} />
                <AppText variant="caption" color="rgba(255,255,255,0.8)">
                  {author.location_city}
                </AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {author?.user_id !== user?.id ? (
          <TouchableOpacity
            onPress={handleFollow}
            disabled={followStatus !== 'not_following'}
            style={[styles.followButton, followStatus !== 'not_following' ? styles.followButtonActive : null]}
            accessibilityRole="button"
            accessibilityLabel={followStatus === 'requested' ? `Follow request sent to ${authorName}` : followStatus === 'following' ? `Following ${authorName}` : `Follow ${authorName}`}
          >
            <AppText variant="caption" weight="bold" color="#FFFFFF">{followStatus === 'requested' ? 'Requested' : followStatus === 'following' ? 'Following' : 'Follow'}</AppText>
          </TouchableOpacity>
        ) : null}

        {videoData?.community_id ? (
          <TouchableOpacity onPress={handleCommunityVisit} style={styles.communityButton} accessibilityRole="button" accessibilityLabel="View the community for this video">
            <AppText variant="caption" weight="bold" color="#FFFFFF">View Community</AppText>
          </TouchableOpacity>
        ) : null}

        {videoData?.content ? (
          <AppText variant="bodySm" color="#FFFFFF" numberOfLines={3} style={styles.captionText}>
            {videoData.content}
          </AppText>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayer: {
    width,
    height,
    position: 'absolute',
  },
  missingVideo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCenterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActionRail: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 18,
  },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bottomMetadata: {
    position: 'absolute',
    left: 16,
    right: 80,
    bottom: 40,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  followButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },
  followButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  communityButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  captionText: {
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
})
