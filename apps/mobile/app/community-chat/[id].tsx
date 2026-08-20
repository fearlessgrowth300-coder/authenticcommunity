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
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  ArrowLeft,
  MoreHorizontal,
  Pin,
  X,
  Plus,
  Smile,
  Send,
  Compass,
} from 'lucide-react-native'

interface GroupMessage {
  id: string
  senderName: string
  senderAvatar: string | null
  text: string
  time: string
  isMe: boolean
}

export default function CommunityChatScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [community, setCommunity] = useState<any>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [showPinned, setShowPinned] = useState(true)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCommunityChat = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [commRes, msgsRes] = await Promise.all([
        supabase.from('communities').select('*').eq('id', id).maybeSingle(),
        (supabase as any)
          .from('community_messages')
          .select('id, user_id, content, created_at, profiles(first_name, last_name, profile_image_url)')
          .eq('community_id', id)
          .order('created_at', { ascending: true })
          .limit(50),
      ])

      if (commRes.data) setCommunity(commRes.data)

      if (msgsRes.data) {
        setMessages(
          msgsRes.data.map((m: any) => ({
            id: m.id,
            senderName: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || 'Member',
            senderAvatar: m.profiles?.profile_image_url || null,
            text: m.content || '',
            time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: m.user_id === user?.id,
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunityChat()
  }, [id, user])

  const handleSend = async () => {
    if (!inputText.trim() || !user || !id) return
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
    }
    setMessages((prev) => [...prev, optMsg])

    try {
      const { data: inserted } = await (supabase as any)
        .from('community_messages')
        .insert({
          community_id: id,
          user_id: user.id,
          content: textToSend,
        })
        .select('id')
        .single()

      if (inserted) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: inserted.id } : m))
        )
      }
    } catch {
      // Graceful
    }
  }

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

          <TouchableOpacity style={styles.headerBtn}>
            <MoreHorizontal color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>

        {/* Pinned Announcement */}
        {showPinned && (
          <View style={styles.pinnedBanner}>
            <Pin color={Colors.primary} size={16} style={styles.pinIcon} />
            <View style={styles.pinnedContent}>
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                Community Guidelines
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Be kind, respectful, and supportive to everyone in this channel! 🙏
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
                No messages yet in this channel. Be the first to say hello!
              </AppText>
            </View>
          ) : (
            messages.map((msg) => (
              <View key={msg.id} style={styles.messageBlock}>
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
                      <AppText variant="bodySm" color={msg.isMe ? '#FFFFFF' : Colors.text}>
                        {msg.text}
                      </AppText>
                    </View>
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
            placeholder="Message the community..."
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
})
