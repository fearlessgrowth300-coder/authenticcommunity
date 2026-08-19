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

interface Message {
  id: string
  sender: 'other' | 'me'
  text: string
  time: string
  reaction?: {
    emoji: string
    count: number
  }
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'other',
    text: 'Hey! 👋 Thanks for connecting.',
    time: '9:32 AM',
  },
  {
    id: 'm2',
    sender: 'me',
    text: 'Hey Jane! 👋 Great to meet you too.',
    time: '9:33 AM',
  },
  {
    id: 'm3',
    sender: 'other',
    text: "I saw we're both into hiking and photography. Do you have a favorite trail around Austin?",
    time: '9:35 AM',
  },
  {
    id: 'm4',
    sender: 'me',
    text: 'Absolutely! The Barton Creek Greenbelt is my go-to. How about you?',
    time: '9:36 AM',
  },
  {
    id: 'm5',
    sender: 'other',
    text: 'Same here! The views are unbeatable. Want to plan a hike sometime this weekend?',
    time: '9:38 AM',
    reaction: {
      emoji: '❤️',
      count: 1,
    },
  },
  {
    id: 'm6',
    sender: 'me',
    text: "That sounds perfect! Let's do it. 🌿",
    time: '9:41 AM',
  },
]

export default function DirectMessageChatScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim()) return
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, newMsg])
    setInputText('')
  }

  const handleApplyIcebreaker = (prompt: string) => {
    setInputText(prompt)
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

          <View style={styles.headerUserInfo}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View>
              <AppText variant="bodySm" weight="bold">
                Jane Doe
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Online
              </AppText>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.matchScoreBadge}>
              <AppText variant="caption" weight="bold" color={Colors.primary}>
                92%
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.matchLabel}>
                Match
              </AppText>
            </View>

            <TouchableOpacity style={styles.headerBtn}>
              <MoreHorizontal color={Colors.text} size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Stream */}
        <ScrollView contentContainerStyle={styles.messagesScroll}>
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <AppText variant="caption" color={Colors.textMuted} style={styles.dateText}>
              Today
            </AppText>
          </View>

          {messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowMe : styles.messageRowOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  <AppText
                    variant="bodySm"
                    color={isMe ? Colors.surface : Colors.text}
                    style={styles.messageText}
                  >
                    {msg.text}
                  </AppText>

                  <View style={styles.timeRow}>
                    <AppText
                      variant="caption"
                      color={isMe ? 'rgba(255, 255, 255, 0.75)' : Colors.textMuted}
                      style={styles.timeText}
                    >
                      {msg.time}
                    </AppText>
                    {isMe && (
                      <CheckCheck color="rgba(255, 255, 255, 0.85)" size={14} />
                    )}
                  </View>

                  {/* Reaction Emoji if present */}
                  {msg.reaction && (
                    <View style={styles.reactionBadge}>
                      <AppText variant="caption" style={styles.reactionEmoji}>
                        {msg.reaction.emoji}
                      </AppText>
                      <AppText variant="caption" color={Colors.textSecondary} style={styles.reactionCount}>
                        {msg.reaction.count}
                      </AppText>
                    </View>
                  )}
                </View>
              </View>
            )
          })}

          {/* AI Icebreaker Suggestion Card */}
          <TouchableOpacity
            style={styles.icebreakerCard}
            onPress={() =>
              handleApplyIcebreaker('What are your favorite photo spots around Austin?')
            }
          >
            <View style={styles.icebreakerLeft}>
              <View style={styles.sparkleBox}>
                <Sparkles color={Colors.primary} size={18} />
              </View>
              <View style={styles.icebreakerContent}>
                <AppText variant="caption" weight="bold" color={Colors.primary}>
                  AI Icebreaker Suggestion
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Ask about her favorite photo spots in Austin
                </AppText>
              </View>
            </View>
            <ChevronRight color={Colors.primary} size={18} />
          </TouchableOpacity>
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
              placeholder="Type a message..."
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
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginLeft: 4,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  matchLabel: {
    fontSize: 8,
    marginTop: -2,
  },
  messagesScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: 12,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  dateText: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    position: 'relative',
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  reactionCount: {
    fontSize: 10,
  },
  icebreakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  icebreakerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sparkleBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icebreakerContent: {
    flex: 1,
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
