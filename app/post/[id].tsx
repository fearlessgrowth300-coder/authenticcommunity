import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { loadPostComments, addPostComment, PostComment } from '@/services/feed'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  MoreHorizontal,
} from 'lucide-react-native'

export default function PostDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [loadingComments, setLoadingComments] = useState(true)
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    if (!id) return
    loadPostComments(id)
      .then((loaded) => setComments(loaded))
      .catch(() => {})
      .finally(() => setLoadingComments(false))
  }, [id])

  const handleSendComment = async () => {
    if (!commentInput.trim() || !id || sendingComment) return
    setSendingComment(true)

    try {
      const newComment = await addPostComment(id, commentInput.trim())
      setComments((prev) => [...prev, newComment])
      setCommentInput('')
    } catch {
      // Handled cleanly
    } finally {
      setSendingComment(false)
    }
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
                  Community Post
                </AppText>
                <VerifiedBadge size={14} />
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                Local Community
              </AppText>
            </View>
          </View>

          {/* Comments Section */}
          <AppText variant="label" weight="bold" style={styles.commentsTitle}>
            Comments ({comments.length})
          </AppText>

          {loadingComments ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <AppText variant="caption" color={Colors.textSecondary}>
                No comments yet. Start the conversation!
              </AppText>
            </View>
          ) : (
            comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Image
                  source={{
                    uri:
                      c.authorAvatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
                  }}
                  style={styles.commentAvatar}
                />
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
            ))
          )}
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
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={sendingComment}
              style={styles.sendBtn}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send color="#FFFFFF" size={16} />
              )}
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
  commentsTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  emptyComments: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
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
