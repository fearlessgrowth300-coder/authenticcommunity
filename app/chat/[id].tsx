import React, { useState, useEffect, useRef } from 'react'
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
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  loadConversationMessages,
  sendDirectMessage,
  subscribeToConversationRealtime,
  RealtimeMessageItem,
} from '@/services/realtimeChat'
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Smile,
  Send,
  User,
  VolumeX,
  Ban,
  Flag,
  CheckCheck,
} from 'lucide-react-native'

import { supabase } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import * as ImagePicker from 'expo-image-picker'
import { uploadMediaFile } from '@/services/mediaUpload'
import { getDirectMessagingPermission } from '@/services/realtimeChat'

export default function DirectMessageChatScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const targetUserId = id || ''

  const [recipient, setRecipient] = useState<{
    name: string
    avatar: string | null
    isVerified: boolean
    city: string
  }>({
    name: 'Community Member',
    avatar: null,
    isVerified: false,
    city: 'Local',
  })

  const [messages, setMessages] = useState<RealtimeMessageItem[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaOnly, setMediaOnly] = useState(false)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    if (!targetUserId || !user) return

    // 1. Fetch recipient profile
    ;(supabase as any)
      .from('profiles')
      .select('first_name, last_name, profile_image_url, is_verified, location_city')
      .eq('user_id', targetUserId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Community Member'
          setRecipient({
            name,
            avatar: data.profile_image_url || null,
            isVerified: Boolean(data.is_verified),
            city: data.location_city || 'Local',
          })
        }
      })

    // 2. Fetch conversation settings (mute state)
    ;(supabase as any)
      .from('conversation_settings')
      .select('is_muted')
      .eq('user_id', user.id)
      .eq('other_user_id', targetUserId)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) setIsMuted(Boolean(data.is_muted))
      })

    // 3. Initial fetch messages from Supabase
    loadConversationMessages(targetUserId)
      .then((data) => {
        setMessages(data)
        return (supabase as any)
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', targetUserId)
          .eq('recipient_id', user.id)
          .eq('is_read', false)
      })
      .finally(() => setLoading(false))

    // 4. Subscribe to Supabase Realtime for live updates
    const unsubscribe = subscribeToConversationRealtime(targetUserId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev
        }
        return [...prev, newMsg]
      })
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 100)
    })

    return () => {
      unsubscribe()
    }
  }, [targetUserId, user])

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user || !targetUserId || sending) return
    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)

    try {
      const newMsg = await sendDirectMessage(targetUserId, textToSend)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (e: any) {
      setInputText(textToSend)
      Alert.alert(e.message?.includes('request') ? 'Message Request' : 'Error', e.message || 'Could not send message.')
    } finally {
      setSending(false)
    }
  }

  const handleToggleMute = async () => {
    if (!user) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    setMenuVisible(false)
    try {
      const { error } = await (supabase as any).from('conversation_settings').upsert({
        user_id: user.id,
        other_user_id: targetUserId,
        is_muted: newMuted,
      }, { onConflict: 'user_id,other_user_id' })
      if (error) throw error
      Alert.alert(newMuted ? 'Muted' : 'Unmuted', `Conversation notifications ${newMuted ? 'muted' : 'unmuted'}.`)
    } catch (error: any) {
      setIsMuted(!newMuted)
      Alert.alert('Could Not Save', error?.message || 'Please try again.')
    }
  }

  const handleBlockUser = async () => {
    if (!user) return
    setMenuVisible(false)
    Alert.alert('Block User', `Are you sure you want to block ${recipient.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await (supabase as any).from('blocked_users').insert({
              blocker_id: user.id,
              blocked_id: targetUserId,
            })
            Alert.alert('Blocked', `${recipient.name} has been blocked.`)
            router.back()
          } catch {
            Alert.alert('Error', 'Could not block user.')
          }
        },
      },
    ])
  }

  const handleReportUser = async () => {
    if (!user) return
    setMenuVisible(false)
    Alert.alert('Report Member', 'Please select a reason for reporting:', [
      {
        text: 'Harassment / Spam',
        onPress: async () => {
          const { error } = await (supabase as any).from('reports').insert({
            reporter_id: user.id,
            reported_user_id: targetUserId,
            report_type: 'user',
            reason: 'Harassment or spam',
          })
          Alert.alert(error ? 'Report Not Sent' : 'Thank You', error?.message || 'Our moderation team will review this report.')
        },
      },
      {
        text: 'Impersonation / Fake Profile',
        onPress: async () => {
          const { error } = await (supabase as any).from('reports').insert({
            reporter_id: user.id,
            reported_user_id: targetUserId,
            report_type: 'user',
            reason: 'Impersonation or fake profile',
          })
          Alert.alert(error ? 'Report Not Sent' : 'Thank You', error?.message || 'Our moderation team will review this report.')
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handlePickPhoto = async () => {
    if (!targetUserId || uploading) return
    try {
      const permission = await getDirectMessagingPermission(targetUserId)
      if (!permission.canSend) throw new Error('Media is available after your connection or message request is accepted.')
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true })
      if (result.canceled || !result.assets[0]) return
      setUploading(true)
      const upload = await uploadMediaFile({ bucket: 'community-posts', localUri: result.assets[0].uri, base64: (result.assets[0] as any).base64, type: 'image' })
      if (upload.error || !upload.url) throw upload.error || new Error('Upload failed')
      const sent = await sendDirectMessage(targetUserId, inputText.trim() || 'Shared a photo', { mediaUrl: upload.url })
      setMessages((current) => current.some((message) => message.id === sent.id) ? current : [...current, sent])
      setInputText('')
    } catch (error: any) { Alert.alert('Photo Not Sent', error?.message || 'Please try again.') }
    finally { setUploading(false) }
  }

  const visibleMessages = messages.filter((message) => {
    if (mediaOnly && !message.mediaUrl) return false
    if (searchQuery.trim() && !message.text.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false
    return true
  })

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/profile/${targetUserId}`)}
            style={styles.profileHeaderTouch}
          >
            <Image
              source={{
                uri:
                  recipient.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
              }}
              style={styles.headerAvatar}
            />
            <View>
              <View style={styles.nameRow}>
                <AppText variant="bodySm" weight="bold">
                  {recipient.name}
                </AppText>
                {recipient.isVerified && <VerifiedBadge size={14} />}
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {recipient.city}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerBtn}>
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        {searchVisible ? <View style={styles.conversationSearch}><TextInput value={searchQuery} onChangeText={setSearchQuery} autoFocus placeholder="Search this conversation" placeholderTextColor={Colors.textMuted} style={styles.searchInput} /><TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery('') }}><AppText variant="caption" color={Colors.primary}>Done</AppText></TouchableOpacity></View> : null}
        {mediaOnly ? <View style={styles.mediaFilterBar}><AppText variant="caption" weight="bold" color={Colors.primary}>Shared media</AppText><TouchableOpacity onPress={() => setMediaOnly(false)}><AppText variant="caption" color={Colors.primary}>Show all</AppText></TouchableOpacity></View> : null}

        {/* Messages List */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : visibleMessages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Image
                source={{
                  uri:
                    recipient.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                }}
                style={styles.bigAvatar}
              />
              <AppText variant="bodySm" weight="bold" style={{ marginTop: 12 }}>
                {recipient.name}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
                This is the beginning of your conversation with {recipient.name}. Reach out with an introduction!
              </AppText>
            </View>
          ) : (
            visibleMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubbleRow,
                  msg.isMe ? styles.myMessageRow : styles.otherMessageRow,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.isMe ? styles.myBubble : styles.otherBubble,
                  ]}
                >
                  <AppText
                    variant="bodySm"
                    color={msg.isMe ? '#FFFFFF' : Colors.text}
                  >
                    {msg.text}
                  </AppText>
                  {msg.mediaUrl ? <Image source={{ uri: msg.mediaUrl }} style={styles.messageImage} /> : null}
                  <View style={styles.bubbleFooter}>
                    <AppText
                      variant="caption"
                      color={msg.isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted}
                      style={styles.timeText}
                    >
                      {msg.timeAgo || 'Just now'}
                    </AppText>
                    {msg.isMe && <CheckCheck color="#FFFFFF" size={12} />}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} style={styles.plusBtn}>
            <Plus color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />

          <TouchableOpacity onPress={() => setInputText((current) => `${current}😊`)} style={styles.iconBtn}>
            <Smile color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn} disabled={sending}>
              <Send color="#FFFFFF" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Context Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuCard}>
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false)
                  router.push(`/profile/${targetUserId}`)
                }}
                style={styles.menuItem}
              >
                <User color={Colors.text} size={18} />
                <AppText variant="bodySm">View Full Profile</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleToggleMute} style={styles.menuItem}>
                <VolumeX color={isMuted ? Colors.primary : Colors.text} size={18} />
                <AppText variant="bodySm">{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setMenuVisible(false); setMediaOnly(false); setSearchVisible(true) }} style={styles.menuItem}>
                <Smile color={Colors.text} size={18} />
                <AppText variant="bodySm">Search Conversation</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setMenuVisible(false); setMediaOnly(true); setSearchVisible(false) }} style={styles.menuItem}>
                <Plus color={Colors.text} size={18} />
                <AppText variant="bodySm">Shared Media</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleBlockUser} style={styles.menuItem}>
                <Ban color="#DC2626" size={18} />
                <AppText variant="bodySm" color="#DC2626">Block User</AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleReportUser} style={styles.menuItem}>
                <Flag color={Colors.coral} size={18} />
                <AppText variant="bodySm" color={Colors.coral}>Report Account</AppText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
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
  backBtn: {
    padding: 6,
  },
  profileHeaderTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginHorizontal: 8,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  conversationSearch: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, minHeight: 40, paddingHorizontal: 12, borderRadius: Radii.full, backgroundColor: Colors.background, color: Colors.text },
  mediaFilterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: Colors.primaryLight },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.xl,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.border,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.lg,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageImage: { width: 220, height: 170, borderRadius: Radii.md, marginTop: 8, backgroundColor: Colors.border },
  timeText: {
    fontSize: 10,
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
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 8,
    paddingHorizontal: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    width: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
})
