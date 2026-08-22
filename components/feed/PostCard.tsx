import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { PostMenuModal } from '@/components/feed/PostMenuModal'
import { WhyAmISeeingThisModal } from '@/components/feed/WhyAmISeeingThisModal'
import { togglePostLike, togglePostSave, MobilePostItem, dismissPost, recordFeedInteraction } from '@/services/feed'
import { followUser } from '@/services/socialGraph'
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Play,
} from 'lucide-react-native'

interface PostCardProps {
  post: MobilePostItem
  onPostDismissed?: (postId: string) => void
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDismissed,
}) => {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [isSaved, setIsSaved] = useState(post.isSaved || false)
  const [isFollowing, setIsFollowing] = useState(post.isFollowing || false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [whyVisible, setWhyVisible] = useState(false)

  const handleLike = async () => {
    const prevLiked = isLiked
    const prevCount = likesCount

    // Optimistic UI update
    setIsLiked(!prevLiked)
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1)

    try {
      await togglePostLike(post.id, prevLiked, {
        surface: post.recommendationSurface,
        algorithmVersion: post.algorithmVersion,
      })
    } catch {
      // Rollback on failure
      setIsLiked(prevLiked)
      setLikesCount(prevCount)
    }
  }

  const handleSave = async () => {
    const prevSaved = isSaved
    setIsSaved(!prevSaved)

    try {
      await togglePostSave(post.id, prevSaved, {
        surface: post.recommendationSurface,
        algorithmVersion: post.algorithmVersion,
      })
    } catch {
      setIsSaved(prevSaved)
    }
  }

  const handleFollow = async () => {
    setIsFollowing(true)
    try {
      await followUser(post.authorId)
      recordFeedInteraction({
        interactionType: 'follow',
        targetUserId: post.authorId,
        surface: post.recommendationSurface,
        algorithmVersion: post.algorithmVersion,
      })
    } catch {
      setIsFollowing(false)
    }
  }

  const handleMenuAction = async (action: string) => {
    if (action === 'hide' || action === 'not_interested' || action === 'see_fewer' || action === 'see_more') {
      await dismissPost(post.id, action as any, {
        surface: post.recommendationSurface,
        algorithmVersion: post.algorithmVersion,
      })
      if (action !== 'see_more') onPostDismissed?.(post.id)
    }
  }

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push(`/profile/${post.authorId}`)}
          style={styles.authorSection}
        >
          <Image
            source={{
              uri:
                post.authorAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
            }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <AppText variant="bodySm" weight="bold">
                {post.authorName}
              </AppText>
              {post.isVerified && <VerifiedBadge size={14} />}
            </View>
            <View style={styles.metaRow}>
              {post.location && (
                <AppText variant="caption" color={Colors.textSecondary}>
                  {post.location}
                </AppText>
              )}
              {post.location && post.topic && (
                <AppText variant="caption" color={Colors.textMuted}>
                  {' '}·{' '}
                </AppText>
              )}
              {post.topic && (
                <AppText variant="caption" color={Colors.primary} weight="semibold">
                  {post.topic}
                </AppText>
              )}
              <AppText variant="caption" color={Colors.textMuted}>
                {' '}· {post.timeAgo}
              </AppText>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {!isFollowing && !post.isConnection && (
            <TouchableOpacity
              onPress={handleFollow}
              style={styles.followBtn}
            >
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                + Follow
              </AppText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={styles.menuBtn}
            accessibilityLabel="Post options"
          >
            <MoreHorizontal color={Colors.textMuted} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Body (Text) */}
      {post.text ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/post/${post.id}`)}
          style={styles.textContainer}
        >
          <AppText variant="bodySm" color={Colors.text} style={styles.postText}>
            {post.text}
          </AppText>
        </TouchableOpacity>
      ) : null}

      {/* Media Attachments (Image / Carousel / Video) */}
      {post.images && post.images.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/post/${post.id}`)}
          style={styles.mediaContainer}
        >
          <Image
            source={{ uri: post.images[0] }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}

      {post.videoUrl && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/post/${post.id}`)}
          style={styles.videoContainer}
        >
          <Image
            source={{
              uri:
                post.images?.[0] ||
                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&fit=crop&q=80',
            }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
          <View style={styles.playButtonOverlay}>
            <Play color="#FFFFFF" size={28} fill="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Post Actions Bar */}
      <View style={styles.actionsBar}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity
            onPress={handleLike}
            style={styles.actionItem}
            accessibilityLabel="Like post"
          >
            <Heart
              color={isLiked ? '#EF4444' : Colors.textSecondary}
              fill={isLiked ? '#EF4444' : 'transparent'}
              size={20}
            />
            <AppText
              variant="caption"
              weight="semibold"
              color={isLiked ? '#EF4444' : Colors.textSecondary}
            >
              {likesCount}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/post/${post.id}`)}
            style={styles.actionItem}
            accessibilityLabel="Comment on post"
          >
            <MessageCircle color={Colors.textSecondary} size={20} />
            <AppText variant="caption" weight="semibold" color={Colors.textSecondary}>
              {post.commentsCount}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              const result = await Share.share({ message: post.text || 'View this post on Authentic Community.' })
              if (result.action === Share.sharedAction) {
                recordFeedInteraction({
                  interactionType: 'share',
                  postId: post.id,
                  surface: post.recommendationSurface,
                  algorithmVersion: post.algorithmVersion,
                })
              }
            }}
            style={styles.actionItem}
            accessibilityLabel="Share post"
          >
            <Share2 color={Colors.textSecondary} size={19} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.actionItem}
          accessibilityLabel="Save post"
        >
          <Bookmark
            color={isSaved ? Colors.amber : Colors.textSecondary}
            fill={isSaved ? Colors.amber : 'transparent'}
            size={20}
          />
        </TouchableOpacity>
      </View>

      {/* Post Menu Modal */}
      <PostMenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onWhySeeing={() => setWhyVisible(true)}
        onAction={handleMenuAction}
        authorName={post.authorName}
      />

      {/* Transparent Algorithm Reason Modal */}
      <WhyAmISeeingThisModal
        visible={whyVisible}
        onClose={() => setWhyVisible(false)}
        topic={post.topic || 'Community'}
        location={post.location || 'Local area'}
        reasons={post.whyReasons}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.border,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
  },
  menuBtn: {
    padding: 4,
  },
  textContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  postText: {
    lineHeight: 21,
  },
  mediaContainer: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  videoContainer: {
    width: '100%',
    height: 320,
    backgroundColor: Colors.border,
    position: 'relative',
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '42%',
    left: '42%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
})
