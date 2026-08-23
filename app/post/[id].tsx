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
  Alert,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { loadPostComments, addPostComment, PostComment, togglePostLike, togglePostSave, dismissPost } from '@/services/feed'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useVideoPlayer, VideoView } from 'expo-video'
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
  const { user } = useAuth()

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [loadingComments, setLoadingComments] = useState(true)
  const [sendingComment, setSendingComment] = useState(false)
  const [loadingPost, setLoadingPost] = useState(true)
  const [post, setPost] = useState<{
    authorId: string
    authorName: string
    authorAvatar: string | null
    isVerified: boolean
    location: string
    content: string
    images: string[]
    videoUrl?: string
  } | null>(null)
  const videoPlayer = useVideoPlayer(post?.videoUrl || null, (player) => {
    player.loop = true
  })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoadingPost(true)
      setLoadingComments(true)
      try {
        const { data: postRow, error } = await (supabase as any)
          .from('posts')
          .select('id, user_id, content, location_label, interest_tags, status')
          .eq('id', id)
          .eq('status', 'active')
          .maybeSingle()
        if (error) throw error
        if (!postRow) {
          setPost(null)
          return
        }
        const [profileRes, mediaRes, likesRes, savesRes, commentsData] = await Promise.all([
          supabase.from('profiles').select('first_name, last_name, profile_image_url, is_verified, location_city').eq('user_id', postRow.user_id).maybeSingle(),
          (supabase as any).from('post_media').select('media_url, media_type').eq('post_id', id).order('display_order'),
          (supabase as any).from('post_likes').select('user_id').eq('post_id', id),
          user ? (supabase as any).from('post_saves').select('user_id').eq('post_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
          loadPostComments(id),
        ])
        const profileRow: any = profileRes.data
        const media = mediaRes.data || []
        setPost({
          authorId: postRow.user_id,
          authorName: `${profileRow?.first_name || ''} ${profileRow?.last_name || ''}`.trim() || 'Community Member',
          authorAvatar: profileRow?.profile_image_url || null,
          isVerified: Boolean(profileRow?.is_verified),
          location: postRow.location_label || profileRow?.location_city || 'Local community',
          content: postRow.content || '',
          images: media.filter((item: any) => item.media_type !== 'video').map((item: any) => item.media_url),
          videoUrl: media.find((item: any) => item.media_type === 'video')?.media_url,
        })
        setLikesCount((likesRes.data || []).length)
        setIsLiked(Boolean(user && (likesRes.data || []).some((like: any) => like.user_id === user.id)))
        setIsSaved(Boolean(savesRes.data))
        setComments(commentsData)
      } catch {
        setPost(null)
      } finally {
        setLoadingPost(false)
        setLoadingComments(false)
      }
    }
    load()
  }, [id, user])

  const handleLike = async () => {
    if (!id) return
    const previous = isLiked
    setIsLiked(!previous)
    setLikesCount((count) => Math.max(0, count + (previous ? -1 : 1)))
    try { await togglePostLike(id, previous) } catch { setIsLiked(previous); setLikesCount((count) => Math.max(0, count + (previous ? 1 : -1))) }
  }

  const handleSave = async () => {
    if (!id) return
    const previous = isSaved
    setIsSaved(!previous)
    try { await togglePostSave(id, previous) } catch { setIsSaved(previous) }
  }

  const showPostMenu = () => {
    if (!id) return
    Alert.alert('Post options', undefined, [
      { text: 'Why am I seeing this?', onPress: () => Alert.alert('Why you are seeing this', 'This post matches your interests, relationships, communities, or local discovery preferences.') },
      { text: 'Not interested', onPress: async () => { await dismissPost(id, 'not_interested'); router.back() } },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

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
          <TouchableOpacity onPress={showPostMenu} style={styles.headerBtn}>
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loadingPost ? <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} /> : !post ? (
            <View style={styles.emptyComments}><AppText variant="bodySm" color={Colors.textSecondary}>This post is no longer available.</AppText></View>
          ) : (<>
          {/* Author Row */}
          <View style={styles.authorRow}>
            <Image
              source={{
                uri: post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
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
              <AppText variant="caption" color={Colors.textSecondary}>
                {post.location}
              </AppText>
            </View>
          </View>

          {post.content ? <AppText variant="body" style={styles.postText}>{post.content}</AppText> : null}
          {post.images.map((uri) => <Image key={uri} source={{ uri }} style={styles.postMedia} resizeMode="cover" />)}
          {post.videoUrl ? <VideoView player={videoPlayer} style={styles.postMedia} nativeControls contentFit="contain" /> : null}

          <View style={styles.postActions}>
            <TouchableOpacity onPress={handleLike} style={styles.postAction}><Heart color={isLiked ? Colors.coral : Colors.textSecondary} fill={isLiked ? Colors.coral : 'transparent'} size={20} /><AppText variant="caption">{likesCount}</AppText></TouchableOpacity>
            <TouchableOpacity onPress={() => Share.share({ message: post.content || 'View this post on Authentic Community.' })} style={styles.postAction}><Share2 color={Colors.textSecondary} size={20} /></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.postAction}><Bookmark color={isSaved ? Colors.amber : Colors.textSecondary} fill={isSaved ? Colors.amber : 'transparent'} size={20} /></TouchableOpacity>
          </View>
          </>)}

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
  postText: { lineHeight: 22, marginBottom: Spacing.md },
  postMedia: { width: '100%', height: 280, borderRadius: Radii.lg, backgroundColor: '#0F172A', marginBottom: Spacing.md },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.md },
  postAction: { minWidth: 44, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
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
