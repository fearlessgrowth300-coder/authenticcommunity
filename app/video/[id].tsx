import React, { useState, useEffect } from 'react'
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
              (supabase as any).from('post_saves').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
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
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to like videos.')
      return
    }
    if (!id) return

    if (isLiked) {
      setIsLiked(false)
      setLikesCount((prev) => Math.max(0, prev - 1))
      await (supabase as any).from('post_likes').delete().eq('post_id', id).eq('user_id', user.id)
    } else {
      setIsLiked(true)
      setLikesCount((prev) => prev + 1)
      await (supabase as any).from('post_likes').upsert({ post_id: id, user_id: user.id })
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to save videos.')
      return
    }
    if (!id) return

    if (isSaved) {
      setIsSaved(false)
      await Promise.all([
        (supabase as any).from('post_saves').delete().eq('post_id', id).eq('user_id', user.id),
        (supabase as any).from('saved_posts').delete().eq('post_id', id).eq('user_id', user.id),
      ])
    } else {
      setIsSaved(true)
      await Promise.all([
        (supabase as any).from('post_saves').upsert({ post_id: id, user_id: user.id }),
        (supabase as any).from('saved_posts').upsert({ post_id: id, user_id: user.id }),
      ])
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Watch this community video by ${videoData?.profiles?.first_name || 'a member'} on Authentic Community!`,
        url: `https://authenticcommunity.fun/video/${id}`,
      })
    } catch {
      // Ignore
    }
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
  const videoPoster = videoData?.media_urls?.[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&fit=crop&q=80'

  return (
    <View style={styles.container}>
      {/* Media Background Preview */}
      <Image source={{ uri: videoPoster }} style={styles.videoPlayer} resizeMode="cover" />

      <TouchableOpacity style={styles.playOverlay} activeOpacity={1} onPress={togglePlay}>
        {!isPlaying && (
          <View style={styles.playCenterBtn}>
            <Play color="#FFFFFF" size={40} fill="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Top Header */}
      <SafeAreaView style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn}>
          <ArrowLeft color="#FFFFFF" size={22} />
        </TouchableOpacity>
        <AppText variant="bodySm" weight="bold" color="#FFFFFF">
          Community Reel
        </AppText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Right Action Rail */}
      <View style={styles.rightActionRail}>
        <TouchableOpacity onPress={handleToggleLike} style={styles.actionBtn}>
          <Heart
            color={isLiked ? '#DC2626' : '#FFFFFF'}
            fill={isLiked ? '#DC2626' : 'none'}
            size={28}
          />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {likesCount}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push(`/post/${id}`)} style={styles.actionBtn}>
          <MessageCircle color="#FFFFFF" size={28} />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {videoData?.comments_count || 0}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleToggleSave} style={styles.actionBtn}>
          <Bookmark
            color={isSaved ? Colors.amber : '#FFFFFF'}
            fill={isSaved ? Colors.amber : 'none'}
            size={28}
          />
          <AppText variant="caption" weight="bold" color="#FFFFFF">
            {isSaved ? 'Saved' : 'Save'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    alignItems: 'center',
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
