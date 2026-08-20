import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
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
  Compass,
  Calendar,
} from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

export default function VideoReelScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [isPlaying, setIsPlaying] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(148)
  const [isSaved, setIsSaved] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)

  // Demo video data
  const video = {
    id: 'v1',
    authorId: 'maya-patel',
    authorName: 'Maya Patel',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    isVerified: true,
    caption: 'How our tech community in Lagos grew from 5 friends to over 400 passionate builders! 🚀✨',
    topics: ['Community', 'Tech', 'Startups'],
    location: 'Lagos, Nigeria',
    thumbnail:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&fit=crop&q=80',
    commentsCount: 34,
    hasCommunity: true,
    communityName: 'Lagos Creators & Builders',
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <View style={styles.container}>
      {/* Background Video Poster */}
      <Image source={{ uri: video.thumbnail }} style={styles.videoPoster} resizeMode="cover" />

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
                onPress={() => router.push(`/profile/${video.authorId}`)}
                style={styles.authorClick}
              >
                <Image source={{ uri: video.authorAvatar }} style={styles.avatar} />
                <View style={styles.nameRow}>
                  <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                    {video.authorName}
                  </AppText>
                  {video.isVerified && <VerifiedBadge size={14} />}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsFollowing(!isFollowing)}
                style={[styles.followBtn, isFollowing ? styles.followingBtn : null]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  color={isFollowing ? '#FFFFFF' : Colors.primary}
                >
                  {isFollowing ? 'Following' : '+ Follow'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Caption */}
            <AppText variant="bodySm" color="#FFFFFF" style={styles.captionText}>
              {video.caption}
            </AppText>

            {/* Topics */}
            <View style={styles.topicsRow}>
              {video.topics.map((t, idx) => (
                <View key={idx} style={styles.topicChip}>
                  <AppText variant="caption" weight="semibold" color="#FFFFFF" style={styles.topicText}>
                    #{t}
                  </AppText>
                </View>
              ))}
            </View>

            {/* View Community Action */}
            {video.hasCommunity && (
              <TouchableOpacity
                onPress={() => router.push('/community/lagos-creators')}
                style={styles.communityShortcut}
              >
                <Compass color="#FFFFFF" size={14} />
                <AppText variant="caption" weight="bold" color="#FFFFFF">
                  View Community: {video.communityName}
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* Right: Actions Rail */}
          <View style={styles.rightRail}>
            <TouchableOpacity
              onPress={() => {
                setIsLiked(!isLiked)
                setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
              }}
              style={styles.railItem}
            >
              <Heart
                color={isLiked ? '#EF4444' : '#FFFFFF'}
                fill={isLiked ? '#EF4444' : 'transparent'}
                size={28}
              />
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                {likesCount}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/post/p1')}
              style={styles.railItem}
            >
              <MessageCircle color="#FFFFFF" size={28} />
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                {video.commentsCount}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.railItem}>
              <Share2 color="#FFFFFF" size={26} />
              <AppText variant="caption" weight="bold" color="#FFFFFF">
                Share
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSaved(!isSaved)}
              style={styles.railItem}
            >
              <Bookmark
                color={isSaved ? Colors.amber : '#FFFFFF'}
                fill={isSaved ? Colors.amber : 'transparent'}
                size={28}
              />
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
  },
  darkGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  touchSurface: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlaySafe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
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
    gap: 10,
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
  followBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  followingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  captionText: {
    lineHeight: 20,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  topicText: {
    fontSize: 11,
  },
  communityShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 70, 229, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  rightRail: {
    alignItems: 'center',
    gap: 18,
    paddingBottom: 4,
  },
  railItem: {
    alignItems: 'center',
    gap: 4,
  },
})
