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
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import * as ImagePicker from 'expo-image-picker'
import { uploadMediaFile } from '@/services/mediaUpload'
import {
  ArrowLeft,
  MoreHorizontal,
  Pin,
  X,
  Plus,
  Smile,
  Send,
  Compass,
  Hash,
  Reply,
  Heart,
} from 'lucide-react-native'

interface GroupMessage {
  id: string
  senderName: string
  senderAvatar: string | null
  text: string
  time: string
  isMe: boolean
  senderId: string
  mediaUrl?: string | null
  parentMessageId?: string | null
  reactions: number
}

interface ChannelItem { id: string; name: string; description?: string | null }

export default function CommunityChatScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id, channel = 'general' } = useLocalSearchParams<{ id: string; channel?: string }>()

  const [community, setCommunity] = useState<any>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [showPinned, setShowPinned] = useState(true)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [canPost, setCanPost] = useState(false)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [channels, setChannels] = useState<ChannelItem[]>([])
  const [channelModalVisible, setChannelModalVisible] = useState(false)
  const [pinnedText, setPinnedText] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null)
  const [uploading, setUploading] = useState(false)

  const loadCommunityChat = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [commRes, memberRes, channelRes, channelsRes, pinsRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).maybeSingle(),
        user
          ? (supabase as any).from('community_members').select('status, role').eq('community_id', id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        (supabase as any).from('community_channels').select('id').eq('community_id', id).eq('name', channel).maybeSingle(),
        (supabase as any).from('community_channels').select('id, name, description').eq('community_id', id).order('position'),
        (supabase as any).from('community_message_pins').select('message_id, community_messages(content)').eq('community_id', id).order('created_at', { ascending: false }).limit(1),
      ])

      if (commRes.data) setCommunity(commRes.data)
      setCanPost(memberRes.data?.status === 'active')
      setMemberRole(memberRes.data?.role || null)
      setChannels(channelsRes.data || [])
      setPinnedText((pinsRes.data?.[0] as any)?.community_messages?.content || commRes.data?.rules || null)
      const activeChannelId = channelRes.data?.id || null
      setChannelId(activeChannelId)

      let messagesQuery = (supabase as any)
        .from('community_messages')
        .select('id, sender_id, content, created_at, media_url, parent_message_id, deleted_at')
        .eq('community_id', id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (activeChannelId) messagesQuery = messagesQuery.eq('channel_id', activeChannelId)
      const msgsRes = await messagesQuery
      if (msgsRes.error) throw msgsRes.error
      if (msgsRes.data) {
        const senderIds = Array.from(new Set(msgsRes.data.map((message: any) => message.sender_id))) as string[]
        const [profilesResult, reactionsResult] = await Promise.all([
          senderIds.length ? supabase
              .from('profiles')
              .select('user_id, first_name, last_name, profile_image_url')
              .in('user_id', senderIds)
            : Promise.resolve({ data: [] as any[] }),
          (supabase as any).from('community_message_reactions').select('message_id').in('message_id', msgsRes.data.map((message: any) => message.id)),
        ])
        const profiles = profilesResult.data
        const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]))
        const reactionCounts = new Map<string, number>()
        ;(reactionsResult.data || []).forEach((reaction: any) => reactionCounts.set(reaction.message_id, (reactionCounts.get(reaction.message_id) || 0) + 1))
        setMessages(
          msgsRes.data.filter((m: any) => !m.deleted_at).map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: `${(profileMap.get(m.sender_id) as any)?.first_name || ''} ${(profileMap.get(m.sender_id) as any)?.last_name || ''}`.trim() || 'Member',
            senderAvatar: (profileMap.get(m.sender_id) as any)?.profile_image_url || null,
            text: m.content || '',
            time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: m.sender_id === user?.id,
            mediaUrl: m.media_url,
            parentMessageId: m.parent_message_id,
            reactions: reactionCounts.get(m.id) || 0,
          }))
        )
      }
    } catch (error: any) {
      Alert.alert('Could Not Load Chat', error?.message || 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunityChat()
  }, [id, user, channel])

  useEffect(() => {
    if (!id || !user) return
    const realtimeChannel = supabase
      .channel(`community-${id}-${channel}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'community_messages',
        filter: `community_id=eq.${id}`,
      }, async (payload) => {
        const row = payload.new as any
        if (channelId && row.channel_id !== channelId) return
        if (row.sender_id === user.id) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_image_url')
          .eq('user_id', row.sender_id)
          .maybeSingle()
        setMessages((current) => current.some((message) => message.id === row.id) ? current : [...current, {
          id: row.id,
          senderId: row.sender_id,
          senderName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Member',
          senderAvatar: profile?.profile_image_url || null,
          text: row.content || '',
          time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          mediaUrl: row.media_url,
          parentMessageId: row.parent_message_id,
          reactions: 0,
        }])
      })
      .subscribe()
    return () => { supabase.removeChannel(realtimeChannel) }
  }, [id, user, channelId, channel])

  const handleSend = async () => {
    if (!inputText.trim() || !user || !id || !canPost) return
    const textToSend = inputText.trim()
    setInputText('')

    const tempId = `temp-${Date.now()}`
    const optMsg: GroupMessage = {
      id: tempId,
      senderName: 'You',
      senderAvatar: null,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      senderId: user.id,
      parentMessageId: replyingTo?.id || null,
      reactions: 0,
    }
    setMessages((prev) => [...prev, optMsg])

    try {
      const { data: inserted, error } = await (supabase as any)
        .from('community_messages')
        .insert({
          community_id: id,
          sender_id: user.id,
          channel_id: channelId,
          content: textToSend,
          parent_message_id: replyingTo?.id || null,
        })
        .select('id')
        .single()

      if (error) throw error

      if (inserted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: inserted.id } : m))
        )
      }
      setReplyingTo(null)
    } catch (error: any) {
      setMessages((current) => current.filter((message) => message.id !== tempId))
      setInputText(textToSend)
      Alert.alert('Message Not Sent', error?.message || 'Please try again.')
    }
  }

  const handlePickImage = async () => {
    if (!user || !id || !canPost) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true })
    if (result.canceled || !result.assets[0]) return
    setUploading(true)
    try {
      const upload = await uploadMediaFile({ bucket: 'community-posts', localUri: result.assets[0].uri, base64: (result.assets[0] as any).base64, type: 'image' })
      if (upload.error || !upload.url) throw upload.error || new Error('Upload failed')
      const { error } = await (supabase as any).from('community_messages').insert({ community_id: id, channel_id: channelId, sender_id: user.id, content: inputText.trim() || 'Shared a photo', media_url: upload.url, message_type: 'image', parent_message_id: replyingTo?.id || null })
      if (error) throw error
      setInputText(''); setReplyingTo(null)
    } catch (error: any) { Alert.alert('Photo Not Sent', error?.message || 'Please try again.') }
    finally { setUploading(false) }
  }

  const reactToMessage = async (messageId: string) => {
    if (!user) return
    const { error } = await (supabase as any).from('community_message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji: '❤️' })
    if (error) return Alert.alert('Reaction Not Saved', error.message)
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, reactions: Math.max(1, message.reactions + 1) } : message))
  }

  const reportMessage = async (message: GroupMessage) => {
    if (!user) return
    const { error } = await (supabase as any).from('reports').insert({ reporter_id: user.id, reported_user_id: message.senderId, community_id: id, community_message_id: message.id, report_type: 'community_message', reason: 'Inappropriate content' })
    Alert.alert(error ? 'Report Not Sent' : 'Report Sent', error?.message || 'A moderator will review this message.')
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await (supabase as any).from('community_messages').update({ deleted_at: new Date().toISOString(), content: '[Deleted]' }).eq('id', messageId)
    if (error) return Alert.alert('Message Not Deleted', error.message)
    setMessages((current) => current.filter((message) => message.id !== messageId))
  }

  const showMessageActions = (message: GroupMessage) => Alert.alert(message.senderName, message.text, [
    { text: 'Reply', onPress: () => setReplyingTo(message) },
    { text: 'React ❤️', onPress: () => reactToMessage(message.id) },
    ...(message.isMe || ['owner', 'admin', 'moderator'].includes(memberRole || '') ? [{ text: 'Delete', style: 'destructive' as const, onPress: () => deleteMessage(message.id) }] : [{ text: 'Report', style: 'destructive' as const, onPress: () => reportMessage(message) }]),
    { text: 'Cancel', style: 'cancel' },
  ])

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/community/${id}`)}
            style={styles.communityHeaderInfo}
          >
            <View style={styles.treeIconCircle}>
              <Compass color="#16A34A" size={20} />
            </View>
            <View>
              <AppText variant="bodySm" weight="bold">
                {community?.community_name || 'Community Channel'}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {community?.member_count || 1} members · active discussion
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => ['owner', 'admin', 'moderator'].includes(memberRole || '') ? router.push(`/community/admin/${id}`) : router.push(`/community/${id}`)}
            style={styles.headerBtn}
          >
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        {/* Pinned Announcement */}
        {showPinned && pinnedText && (
          <View style={styles.pinnedBanner}>
            <Pin color={Colors.primary} size={16} style={styles.pinIcon} />
            <View style={styles.pinnedContent}>
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                Pinned
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {pinnedText}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => setShowPinned(false)} style={styles.closePinBtn}>
              <X color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Messages Stream */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppText variant="bodySm" color={Colors.textSecondary}>
                {canPost ? 'No messages yet in this channel. Be the first to say hello!' : 'Join this community to participate in chat.'}
              </AppText>
            </View>
          ) : (
            messages.map((msg) => (
              <TouchableOpacity key={msg.id} onLongPress={() => showMessageActions(msg)} style={styles.messageBlock}>
                <View style={styles.messageRow}>
                  <Image
                    source={{
                      uri:
                        msg.senderAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                    }}
                    style={styles.avatar}
                  />

                  <View style={styles.messageBubbleCol}>
                    <View style={styles.senderInfoRow}>
                      <AppText variant="caption" weight="bold">
                        {msg.senderName}
                      </AppText>
                      <AppText variant="caption" color={Colors.textMuted} style={styles.timeText}>
                        {msg.time}
                      </AppText>
                    </View>

                    <View style={[styles.bubble, msg.isMe ? styles.myBubble : styles.otherBubble]}>
                      {msg.parentMessageId ? <View style={styles.replyMarker}><Reply color={msg.isMe ? '#FFFFFF' : Colors.primary} size={12} /><AppText variant="caption" color={msg.isMe ? '#FFFFFF' : Colors.textSecondary}>Reply</AppText></View> : null}
                      <AppText variant="bodySm" color={msg.isMe ? '#FFFFFF' : Colors.text}>
                        {msg.text}
                      </AppText>
                      {msg.mediaUrl ? <Image source={{ uri: msg.mediaUrl }} style={styles.messageImage} /> : null}
                    </View>
                    {msg.reactions > 0 ? <TouchableOpacity onPress={() => reactToMessage(msg.id)} style={styles.reactionPill}><Heart color={Colors.coral} fill={Colors.coral} size={12} /><AppText variant="caption">{msg.reactions}</AppText></TouchableOpacity> : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Bottom Input Composer */}
        {replyingTo ? <View style={styles.replyingBar}><View style={{ flex: 1 }}><AppText variant="caption" weight="bold" color={Colors.primary}>Replying to {replyingTo.senderName}</AppText><AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>{replyingTo.text}</AppText></View><TouchableOpacity onPress={() => setReplyingTo(null)}><X color={Colors.textMuted} size={18} /></TouchableOpacity></View> : null}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handlePickImage} disabled={!canPost || uploading} style={styles.plusBtn}>
            <Plus color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setChannelModalVisible(true)} style={styles.channelButton}>
            <Hash color={Colors.primary} size={15} />
            <AppText variant="caption" weight="bold" color={Colors.primary}>{channel}</AppText>
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={canPost ? `Message #${channel}...` : 'Join the community to send messages'}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            editable={canPost}
          />

          <TouchableOpacity onPress={() => setInputText((text) => `${text}${text ? ' ' : ''}😊`)} style={styles.iconBtn} accessibilityLabel="Add emoji">
            <Smile color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          {canPost && inputText.trim() ? (
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Send color="#FFFFFF" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
      <Modal visible={channelModalVisible} transparent animationType="slide" onRequestClose={() => setChannelModalVisible(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setChannelModalVisible(false)} style={styles.modalOverlay}>
          <View style={styles.channelSheet}>
            <AppText variant="h3" weight="bold">Channels</AppText>
            {channels.length ? channels.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => { setChannelModalVisible(false); router.replace({ pathname: `/community-chat/${id}` as any, params: { channel: item.name } }) }} style={styles.channelRow}>
                <Hash color={item.name === channel ? Colors.primary : Colors.textMuted} size={18} />
                <View style={{ flex: 1 }}><AppText variant="bodySm" weight={item.name === channel ? 'bold' : 'normal'}>{item.name}</AppText>{item.description ? <AppText variant="caption" color={Colors.textSecondary}>{item.description}</AppText> : null}</View>
              </TouchableOpacity>
            )) : <AppText variant="bodySm" color={Colors.textSecondary}>This community uses one main chat.</AppText>}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    padding: 6,
  },
  communityHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginHorizontal: 8,
  },
  treeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  pinIcon: {
    marginRight: 8,
  },
  pinnedContent: {
    flex: 1,
  },
  closePinBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  messageBlock: {
    marginBottom: 14,
  },
  replyMarker: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, opacity: 0.85 },
  messageImage: { width: 210, height: 160, borderRadius: Radii.md, marginTop: 8, backgroundColor: Colors.border },
  reactionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radii.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  replyingBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderTopWidth: 1, borderTopColor: Colors.border },
  messageRow: {
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
  },
  messageBubbleCol: {
    flex: 1,
  },
  senderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 10,
  },
  bubble: {
    padding: 10,
    borderRadius: Radii.md,
    maxWidth: '90%',
  },
  myBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  plusBtn: {
    padding: 6,
  },
  channelButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, minHeight: 34, borderRadius: Radii.full, backgroundColor: Colors.primaryLight },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
  },
  iconBtn: {
    padding: 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  channelSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: 10 },
  channelRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md },
})
