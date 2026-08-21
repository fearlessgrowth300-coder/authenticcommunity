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

      // Also ensure message_requests entry exists if first message
      await (supabase as any).from('message_requests').upsert({
        sender_id: user.id,
        recipient_id: targetUserId,
        initial_message: textToSend,
        status: 'pending',
      }, { onConflict: 'sender_id,recipient_id' })

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send message.')
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
      await (supabase as any).from('conversation_settings').upsert({
        user_id: user.id,
        other_user_id: targetUserId,
        is_muted: newMuted,
      }, { onConflict: 'user_id,other_user_id' })
      Alert.alert(newMuted ? 'Muted' : 'Unmuted', `Conversation notifications ${newMuted ? 'muted' : 'unmuted'}.`)
    } catch {
      // Graceful
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
          await (supabase as any).from('content_reports').insert({
            reporter_id: user.id,
            reported_user_id: targetUserId,
            reason: 'harassment_spam',
          })
          Alert.alert('Thank You', 'Our moderation team will review this report within 24 hours.')
        },
      },
      {
        text: 'Impersonation / Fake Profile',
        onPress: async () => {
          await (supabase as any).from('content_reports').insert({
            reporter_id: user.id,
            reported_user_id: targetUserId,
            reason: 'fake_profile',
          })
          Alert.alert('Thank You', 'Our moderation team will review this report within 24 hours.')
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

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

        {/* Messages List */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
          ) : messages.length === 0 ? (
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
            messages.map((msg) => (
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
          <TouchableOpacity style={styles.plusBtn}>
            <Plus color={Colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />

          <TouchableOpacity style={styles.iconBtn}>
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
