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
  Mic,
  Send,
  Sparkles,
  ChevronRight,
  Heart,
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
  const scrollRef = useRef<any>(null)

  useEffect(() => {
    if (!targetUserId) return

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

    // 2. Initial fetch messages from Supabase
    loadConversationMessages(targetUserId)
      .then((data) => {
        setMessages(data)
      })
      .finally(() => setLoading(false))

    // 3. Subscribe to Supabase Realtime for live updates
    const unsubscribe = subscribeToConversationRealtime(targetUserId, (newMsg) => {
      setMessages((prev) => {
        // Prevent duplicate insertion if already added optimistically
        if (prev.some((m) => m.id === newMsg.id)) {
          return prev
        }
        return [...prev, newMsg]
      })
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100)
    })

    return () => {
      unsubscribe()
    }
  }, [targetUserId])

  const handleSend = async () => {
    if (!inputText.trim() || sending) return
    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)

    // Optimistic local item
    const tempId = `temp-${Date.now()}`
    const optimisticMsg: RealtimeMessageItem = {
      id: tempId,
      conversationId: targetUserId,
      senderId: user?.id || 'me',
      senderName: 'You',
      senderAvatar: null,
      text: textToSend,
      createdAt: new Date().toISOString(),
      timeAgo: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      isRead: false,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 50)

    try {
      const realMsg = await sendDirectMessage(targetUserId, textToSend)
      // Replace optimistic message with real message from server
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? realMsg : m))
      )
    } catch {
      // Retain optimistic message or mark failed
    } finally {
      setSending(false)
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 100)
    }
  }

  const handleIcebreakerPress = (prompt: string) => {
    setInputText(prompt)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.text} size={22} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/profile/${targetUserId}`)}
            style={styles.headerUser}
          >
            <Image
              source={{
                uri:
                  recipient.avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
              }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerUserInfo}>
              <View style={styles.headerNameRow}>
                <AppText variant="body" weight="bold" numberOfLines={1}>
                  {recipient.name}
                </AppText>
                {recipient.isVerified && <VerifiedBadge size={14} />}
              </View>
              <AppText variant="caption" color={Colors.textSecondary}>
                {recipient.city}
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerRight}>
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd?.({ animated: false })}
        >
          {/* AI Icebreaker Card */}
          <TouchableOpacity
            onPress={() =>
              handleIcebreakerPress(
                `Hey ${recipient.name}! Great connecting with you. What local events or projects are you excited about lately? ✨`
              )
            }
            style={styles.icebreakerCard}
          >
            <View style={styles.icebreakerHeader}>
              <Sparkles color={Colors.primary} size={16} />
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                AI Conversation Starter
              </AppText>
            </View>
            <AppText variant="bodySm" color={Colors.text} style={styles.icebreakerPrompt}>
              "Hey {recipient.name}! Great connecting with you. What local events or projects are you excited about lately? ✨"
            </AppText>
            <View style={styles.icebreakerFooter}>
              <AppText variant="caption" color={Colors.textSecondary}>
                Tap to use this icebreaker
              </AppText>
              <ChevronRight color={Colors.textSecondary} size={14} />
            </View>
          </TouchableOpacity>

          {/* Messages list */}
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <AppText variant="caption" color={Colors.textSecondary}>
                No messages yet. Send a greeting to start chatting!
              </AppText>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubbleWrapper,
                  msg.isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.isMe ? styles.myBubble : styles.otherBubble,
                  ]}
                >
                  <AppText
                    variant="bodySm"
                    color={msg.isMe ? '#FFFFFF' : Colors.text}
                    style={styles.messageText}
                  >
                    {msg.text}
                  </AppText>
                  <View style={styles.timeRow}>
                    <AppText
                      variant="caption"
                      color={msg.isMe ? 'rgba(255,255,255,0.75)' : Colors.textMuted}
                      style={styles.timeText}
                    >
                      {msg.timeAgo}
                    </AppText>
                    {msg.isMe && (
                      <CheckCheck color="rgba(255,255,255,0.85)" size={13} style={styles.checkIcon} />
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Bottom Input Composer */}
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
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Send color="#FFFFFF" size={16} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconBtn}>
              <Mic color={Colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerUser: {
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
  headerUserInfo: {
    flex: 1,
    gap: 2,
  },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  headerRight: {
    padding: 4,
  },
  matchScoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
  },
  matchBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  matchText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  icebreakerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: Spacing.md,
    gap: 6,
  },
  icebreakerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icebreakerPrompt: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  icebreakerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  emptyMessages: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  messageBubbleWrapper: {
    marginVertical: 4,
    width: '100%',
  },
  myBubbleWrapper: {
    alignItems: 'flex-end',
  },
  otherBubbleWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 3,
  },
  timeText: {
    fontSize: 10,
  },
  checkIcon: {
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
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
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
})
