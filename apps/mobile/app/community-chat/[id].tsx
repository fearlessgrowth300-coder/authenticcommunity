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
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  MoreHorizontal,
  Pin,
  X,
  Plus,
  Smile,
  Mic,
  Send,
  Compass,
  Reply,
  Calendar,
  Users,
} from 'lucide-react-native'

interface GroupMessage {
  id: string
  senderName: string
  senderAvatar: string
  isAdmin?: boolean
  replyTo?: {
    senderName: string
    text: string
  }
  text: string
  time: string
  reactions?: { emoji: string; count: number }[]
  embeddedEvent?: {
    title: string
    date: string
    imageUrl: string
    attendeesCount: number
  }
}

const INITIAL_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: 'g1',
    senderName: 'Alex Johnson',
    senderAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&fit=crop&q=80',
    isAdmin: true,
    text: "Good morning, beautiful souls! ☀️ How is everyone's week going?",
    time: '9:15 AM',
    reactions: [
      { emoji: '❤️', count: 12 },
      { emoji: '🙌', count: 6 },
    ],
  },
  {
    id: 'g2',
    senderName: 'Sarah Williams',
    senderAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
    text: 'Feeling grateful and grounded today. The morning meditation really helped.',
    time: '9:17 AM',
    reactions: [{ emoji: '🤍', count: 8 }],
  },
  {
    id: 'g3',
    senderName: 'Marcus Lee',
    senderAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&fit=crop&q=80',
    replyTo: {
      senderName: 'Alex Johnson',
      text: 'Thanks for sharing, Sarah! 💚',
    },
    text: "Don't forget about our community nature walk this Saturday!",
    time: '9:20 AM',
    embeddedEvent: {
      title: 'Nature Walk at Zilker Park',
      date: 'Sat, May 25 · 8:00 AM',
      imageUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&fit=crop&q=80',
      attendeesCount: 12,
    },
  },
  {
    id: 'g4',
    senderName: 'Emily Davis',
    senderAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&fit=crop&q=80',
    text: "I'll be there! Excited to connect with everyone. 😊",
    time: '9:22 AM',
    reactions: [{ emoji: '🙌', count: 4 }],
  },
]

export default function CommunityChatScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [messages, setMessages] = useState<GroupMessage[]>(INITIAL_GROUP_MESSAGES)
  const [showPinned, setShowPinned] = useState(true)
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim()) return
    const newMsg: GroupMessage = {
      id: Date.now().toString(),
      senderName: 'You',
      senderAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
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

          <View style={styles.communityHeaderInfo}>
            <View style={styles.treeIconCircle}>
              <Compass color="#16A34A" size={20} />
            </View>
            <View>
              <AppText variant="bodySm" weight="bold">
                Mindful Living Community
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                248 members · 18 online
              </AppText>
            </View>
          </View>

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
                Pinned Announcement
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Friday Meditation Session at 7:00 AM CT. Join us! 🙏
              </AppText>
            </View>
            <TouchableOpacity onPress={() => setShowPinned(false)} style={styles.closePinBtn}>
              <X color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Messages Stream */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {messages.map((msg) => (
            <View key={msg.id} style={styles.messageBlock}>
              {/* Reply Quote Banner if present */}
              {msg.replyTo && (
                <View style={styles.replyBanner}>
                  <Reply color={Colors.textMuted} size={12} />
                  <AppText variant="caption" color={Colors.textSecondary}>
                    <AppText variant="caption" weight="semibold">
                      {msg.replyTo.senderName}:{' '}
                    </AppText>
                    {msg.replyTo.text}
                  </AppText>
                </View>
              )}

              <View style={styles.messageRow}>
                <Image source={{ uri: msg.senderAvatar }} style={styles.avatar} />

                <View style={styles.messageContent}>
                  {/* Sender Header */}
                  <View style={styles.senderHeader}>
                    <AppText variant="bodySm" weight="bold">
                      {msg.senderName}
                    </AppText>
                    {msg.isAdmin && (
                      <View style={styles.adminBadge}>
                        <AppText variant="caption" weight="bold" color={Colors.primary} style={styles.adminText}>
                          Admin
                        </AppText>
                      </View>
                    )}
                    <AppText variant="caption" color={Colors.textMuted} style={styles.timeText}>
                      {msg.time}
                    </AppText>
                  </View>

                  {/* Message Bubble */}
                  <View style={styles.messageBubble}>
                    <AppText variant="bodySm" color={Colors.text} style={styles.messageText}>
                      {msg.text}
                    </AppText>
                  </View>

                  {/* Embedded Event Card if present */}
                  {msg.embeddedEvent && (
                    <Card style={styles.embeddedEventCard}>
                      <Image
                        source={{ uri: msg.embeddedEvent.imageUrl }}
                        style={styles.eventThumb}
                      />
                      <View style={styles.eventInfo}>
                        <AppText variant="bodySm" weight="bold" numberOfLines={1}>
                          🌿 {msg.embeddedEvent.title}
                        </AppText>
                        <AppText variant="caption" color={Colors.textSecondary}>
                          {msg.embeddedEvent.date}
                        </AppText>
                        <View style={styles.attendeesRow}>
                          <Image
                            source={{
                              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
                            }}
                            style={styles.smallAttendee}
                          />
                          <Image
                            source={{
                              uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
                            }}
                            style={[styles.smallAttendee, { marginLeft: -6 }]}
                          />
                          <AppText variant="caption" color={Colors.textMuted} style={styles.moreAttendees}>
                            +{msg.embeddedEvent.attendeesCount}
                          </AppText>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => router.push('/(tabs)/events')}
                        style={styles.viewEventBtn}
                      >
                        <AppText variant="caption" weight="bold" color={Colors.primary}>
                          View Event
                        </AppText>
                      </TouchableOpacity>
                    </Card>
                  )}

                  {/* Reactions Row */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <View style={styles.reactionsRow}>
                      {msg.reactions.map((r, idx) => (
                        <View key={idx} style={styles.reactionPill}>
                          <AppText variant="caption">{r.emoji}</AppText>
                          <AppText variant="caption" color={Colors.textSecondary} style={styles.reactionCount}>
                            {r.count}
                          </AppText>
                        </View>
                      ))}
                      <TouchableOpacity style={styles.addReactionBtn}>
                        <Smile color={Colors.textMuted} size={14} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Chat Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.actionBtn}>
            <Plus color={Colors.primary} size={22} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message #general"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <Smile color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {inputText.trim() ? (
            <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
              <Send color={Colors.surface} size={18} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn}>
              <Mic color={Colors.textSecondary} size={22} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
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
    marginLeft: 4,
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
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  messageBlock: {
    gap: 4,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 46,
    marginBottom: 2,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    alignSelf: 'flex-start',
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
  messageContent: {
    flex: 1,
    gap: 4,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
  },
  adminText: {
    fontSize: 9,
  },
  timeText: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  messageBubble: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    maxWidth: '92%',
  },
  messageText: {
    lineHeight: 19,
  },
  embeddedEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginTop: 4,
    gap: 10,
    maxWidth: '96%',
  },
  eventThumb: {
    width: 50,
    height: 50,
    borderRadius: Radii.md,
    backgroundColor: Colors.border,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  smallAttendee: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.surface,
  },
  moreAttendees: {
    marginLeft: 6,
    fontSize: 10,
  },
  viewEventBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionCount: {
    fontSize: 10,
  },
  addReactionBtn: {
    padding: 4,
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
  actionBtn: {
    padding: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  emojiBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
