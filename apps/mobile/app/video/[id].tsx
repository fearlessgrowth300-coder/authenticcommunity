import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Pause,
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const loadVideo = async () => {
      setLoading(true)
      try {
        const { data } = await (supabase as any)
          .from('posts')
          .select('*, profiles(user_id, first_name, last_name, profile_image_url, is_verified, location_city)')
          .eq('id', id)
          .maybeSingle()

        if (data) {
          setVideoData(data)
          setLikesCount(data.likes_count || 0)

          if (user) {
            const [likeRes, saveRes] = await Promise.all([
              (supabase as any).from('post_likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
              (supabase as any).from('saved_posts').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
            ])
            setIsLiked(Boolean(likeRes.data))
            setIsSaved(Boolean(saveRes.data))
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [id, user])

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleToggleLike = async () => {
    if (!user || !id) return
    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      await (supabase as any).from('post_likes').delete().eq('post_id', id).eq('user_id', user.id).catch(() => {})
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      await (supabase as any).from('post_likes').insert({ post_id: id, user_id: user.id }).catch(() => {})
    }
  }

  const handleToggleSave = async () => {
    if (!user || !id) return
    if (isSaved) {
      setIsSaved(false)
      await (supabase as any).from('saved_posts').delete().eq('post_id', id).eq('user_id', user.id).catch(() => {})
    } else {
      setIsSaved(true)
      await (supabase as any).from('saved_posts').insert({ post_id: id, user_id: user.id }).catch(() => {})
    }
  }

  const authorName = `${videoData?.profiles?.first_name || ''} ${videoData?.profiles?.last_name || ''}`.trim() || 'Community Member'
  const authorAvatar = videoData?.profiles?.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80'
  const authorId = videoData?.profiles?.user_id || videoData?.user_id || 'unknown'
  const isVerified = Boolean(videoData?.profiles?.is_verified)
  const caption = videoData?.content || 'Authentic community moment'
  const thumbnail = authorAvatar

  return (
    <View style={styles.container}>
      {/* Background Video Poster */}
      <Image source={{ uri: thumbnail }} style={styles.videoPoster} resizeMode="cover" />

      {/* Dark Overlay */}
      <View style={styles.darkGradient} />

      {/* Touch surface for Play / Pause */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={togglePlay}
        style={styles.touchSurface}
      >
        {!isPlaying && (
          <View style={styles.playIconBadge}>
            <Play color="#FFFFFF" size={36} fill="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <SafeAreaView style={styles.overlaySafe}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
            <ArrowLeft color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>

        {/* Content Container (Bottom overlay + Right rail) */}
        <View style={styles.bottomArea}>
          {/* Left: Author & Caption */}
          <View style={styles.infoCol}>
            {/* Author Row */}
            <View style={styles.authorRow}>
              <TouchableOpacity
                onPress={() => router.push(`/profile/${authorId}`)}
                style={styles.authorClick}
              >
                <Image source={{ uri: authorAvatar }} style={styles.avatar} />
                <View style={styles.nameRow}>
                  <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                    {authorName}
                  </AppText>
                  {isVerified && <VerifiedBadge size={14} />}
                </View>
              </TouchableOpacity>
            </View>

            {/* Caption */}
            <AppText variant="bodySm" color="#FFFFFF" numberOfLines={3} style={styles.caption}>
              {caption}
            </AppText>
          </View>

          {/* Right: Interaction Rail */}
          <View style={styles.actionRail}>
            <TouchableOpacity onPress={handleToggleLike} style={styles.actionItem}>
              <View style={[styles.actionCircle, isLiked ? styles.likedCircle : null]}>
                <Heart
                  color={isLiked ? '#EF4444' : '#FFFFFF'}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                  size={24}
                />
              </View>
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                {likesCount}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/post/${id}`)}
              style={styles.actionItem}
            >
              <View style={styles.actionCircle}>
                <MessageCircle color="#FFFFFF" size={24} />
              </View>
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                {videoData?.comments_count || 0}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleSave} style={styles.actionItem}>
              <View style={[styles.actionCircle, isSaved ? styles.savedCircle : null]}>
                <Bookmark
                  color={isSaved ? Colors.primary : '#FFFFFF'}
                  fill={isSaved ? Colors.primary : 'transparent'}
                  size={24}
                />
              </View>
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                Save
              </AppText>
            </TouchableOpacity>
          </View>
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
  videoPoster: {
    width,
    height,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  darkGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  touchSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlaySafe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: 12,
  },
  infoCol: {
    flex: 1,
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorClick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caption: {
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionRail: {
    alignItems: 'center',
    gap: 16,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  savedCircle: {
    backgroundColor: 'rgba(79, 70, 229, 0.3)',
  },
})
