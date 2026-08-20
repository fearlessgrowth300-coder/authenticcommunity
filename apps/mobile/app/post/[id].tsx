import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  Send,
  MoreHorizontal,
} from 'lucide-react-native'

interface Comment {
  id: string
  authorName: string
  authorAvatar: string
  isVerified: boolean
  text: string
  timeAgo: string
  likesCount: number
  isLiked?: boolean
}

const SAMPLE_COMMENTS: Comment[] = [
  {
    id: 'c1',
    authorName: 'David Chen',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    isVerified: true,
    text: 'Totally agree! Local connections make all the difference when scaling an initiative.',
    timeAgo: '1h ago',
    likesCount: 5,
  },
  {
    id: 'c2',
    authorName: 'Elena Rostova',
    authorAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    isVerified: true,
    text: 'Count me in for this weekend! Love what you are building.',
    timeAgo: '45m ago',
    likesCount: 3,
  },
]

export default function PostDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(38)
  const [isSaved, setIsSaved] = useState(false)
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS)
  const [commentInput, setCommentInput] = useState('')

  const handleSendComment = () => {
    if (!commentInput.trim()) return
    const newComment: Comment = {
      id: Date.now().toString(),
      authorName: 'You',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
      isVerified: true,
      text: commentInput.trim(),
      timeAgo: 'Just now',
      likesCount: 0,
    }
    setComments((prev) => [...prev, newComment])
    setCommentInput('')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>
          <AppText variant="h3" weight="bold">
            Post
          </AppText>
          <TouchableOpacity style={styles.headerBtn}>
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Author Row */}
          <View style={styles.authorRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.authorInfo}>
              <View style={styles.nameRow}>
                <AppText variant="bodySm" weight="bold">
                  Maya Patel
                </AppText>
                <VerifiedBadge size={14} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                Lagos, Nigeria · 2h ago
              </AppText>
            </View>
          </View>

          {/* Post Text */}
          <AppText variant="body" color={Colors.text} style={styles.postBody}>
            Building authentic communities is not about follower vanity—it’s about creating safe spaces where people genuinely connect, exchange ideas, and build lasting friendships. So excited for our upcoming weekend meetup! 🌿✨
          </AppText>

          {/* Post Image */}
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&fit=crop&q=80',
            }}
            style={styles.postImage}
            resizeMode="cover"
          />

          {/* Post Metrics & Actions */}
          <View style={styles.actionsBar}>
            <View style={styles.actionsLeft}>
              <TouchableOpacity
                onPress={() => {
                  setIsLiked(!isLiked)
                  setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
                }}
                style={styles.actionItem}
              >
                <Heart
                  color={isLiked ? '#EF4444' : Colors.textSecondary}
                  fill={isLiked ? '#EF4444' : 'transparent'}
                  size={20}
                />
                <AppText variant="caption" weight="semibold">
                  {likesCount}
                </AppText>
              </TouchableOpacity>

              <View style={styles.actionItem}>
                <MessageCircle color={Colors.textSecondary} size={20} />
                <AppText variant="caption" weight="semibold">
                  {comments.length}
                </AppText>
              </View>

              <TouchableOpacity style={styles.actionItem}>
                <Share2 color={Colors.textSecondary} size={19} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setIsSaved(!isSaved)}>
              <Bookmark
                color={isSaved ? Colors.amber : Colors.textSecondary}
                fill={isSaved ? Colors.amber : 'transparent'}
                size={20}
              />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Comments Section */}
          <AppText variant="label" weight="bold" style={styles.commentsTitle}>
            Comments ({comments.length})
          </AppText>

          {comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Image source={{ uri: c.authorAvatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <AppText variant="bodySm" weight="bold">
                    {c.authorName}
                  </AppText>
                  {c.isVerified && <VerifiedBadge size={12} />}
                  <AppText variant="caption" color={Colors.textMuted} style={styles.commentTime}>
                    {c.timeAgo}
                  </AppText>
                </View>
                <AppText variant="bodySm" color={Colors.text} style={styles.commentText}>
                  {c.text}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Comment Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            value={commentInput}
            onChangeText={setCommentInput}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textMuted}
            style={styles.commentInput}
          />
          {commentInput.trim() ? (
            <TouchableOpacity onPress={handleSendComment} style={styles.sendBtn}>
              <Send color="#FFFFFF" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  postBody: {
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postImage: {
    width: '100%',
    height: 280,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  commentsTitle: {
    marginBottom: Spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.border,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  commentTime: {
    marginLeft: 'auto',
    fontSize: 10,
  },
  commentText: {
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
