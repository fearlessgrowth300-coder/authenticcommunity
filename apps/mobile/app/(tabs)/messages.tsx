import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  Search,
  SlidersHorizontal,
  SquarePen,
  Users,
  Compass,
  Check,
  X,
  Ban,
  Sparkles,
} from 'lucide-react-native'

const MESSAGE_TABS = ['Chats', 'Requests', 'Communities'] as const
type MessageTab = (typeof MESSAGE_TABS)[number]

interface DirectConversation {
  id: string
  name: string
  avatarUrl: string
  lastMessage: string
  time: string
  unreadCount?: number
  isOnline?: boolean
  isVerified?: boolean
}

interface MessageRequest {
  id: string
  name: string
  avatarUrl: string
  isVerified: boolean
  matchScore: number
  sharedInterests: string[]
  previewText: string
  timeAgo: string
}

interface CommunityConversation {
  id: string
  name: string
  iconType: 'hikers' | 'mindful' | 'general'
  lastMessageSender: string
  lastMessage: string
  time: string
  unreadCount?: number
}

const SAMPLE_CHATS: DirectConversation[] = [
  {
    id: 'jane-doe',
    name: 'Jane Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    lastMessage: "Sounds great! I'd love to check that out this weekend.",
    time: '9:41 AM',
    unreadCount: 2,
    isOnline: true,
    isVerified: true,
  },
  {
    id: 'michael-chen',
    name: 'Michael Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    lastMessage: 'That makes a lot of sense. Thanks for sharing!',
    time: 'Yesterday',
    unreadCount: 1,
    isOnline: true,
    isVerified: true,
  },
  {
    id: 'david-rodriguez',
    name: 'David Rodriguez',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80',
    lastMessage: 'Awesome! See you at the Saturday meetup.',
    time: 'Mon',
    isOnline: true,
  },
]

const SAMPLE_REQUESTS: MessageRequest[] = [
  {
    id: 'req-1',
    name: 'Amara Okafor',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    isVerified: true,
    matchScore: 92,
    sharedInterests: ['Design', 'Community', 'Tech'],
    previewText: 'Hey! Loved your post about building local creator spaces. Would love to connect and chat!',
    timeAgo: '2h ago',
  },
  {
    id: 'req-2',
    name: 'Tunde Bakare',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&fit=crop&q=80',
    isVerified: false,
    matchScore: 84,
    sharedInterests: ['Fitness', 'Running'],
    previewText: 'Are you joining the Saturday 10km run at Lekki?',
    timeAgo: '1d ago',
  },
]

const SAMPLE_COMMUNITIES: CommunityConversation[] = [
  {
    id: 'lagos-creators',
    name: 'Lagos Creators & Builders',
    iconType: 'hikers',
    lastMessageSender: 'Sarah',
    lastMessage: "Don't forget our demo night this Friday! 🚀",
    time: 'Yesterday',
    unreadCount: 3,
  },
  {
    id: 'mindful-living',
    name: 'Mindful Living Space',
    iconType: 'mindful',
    lastMessageSender: 'Alex',
    lastMessage: 'Morning meditation session link posted in #general.',
    time: 'Mon',
    unreadCount: 4,
  },
]

export default function MessagesHomeScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<MessageTab>('Chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [requests, setRequests] = useState<MessageRequest[]>(SAMPLE_REQUESTS)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const handleAcceptRequest = (req: MessageRequest) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    router.push('/chat/jane-doe')
  }

  const handleDeclineRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Messages
        </AppText>

        <TouchableOpacity
          onPress={() => router.push('/chat/jane-doe')}
          style={styles.composeBtn}
          accessibilityLabel="Compose new message"
        >
          <SquarePen color={Colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      {/* 2. Top Segmented Tabs (Chats, Requests, Communities) */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsContainer}>
          {MESSAGE_TABS.map((tab) => {
            const isSelected = activeTab === tab
            const badgeCount =
              tab === 'Requests' && requests.length > 0 ? requests.length : null

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabBtn,
                  isSelected ? styles.tabBtnActive : null,
                ]}
              >
                <View style={styles.tabContentRow}>
                  <AppText
                    variant="bodySm"
                    weight={isSelected ? 'bold' : 'medium'}
                    color={isSelected ? Colors.surface : Colors.textSecondary}
                  >
                    {tab}
                  </AppText>
                  {badgeCount && (
                    <View style={styles.tabBadge}>
                      <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.tabBadgeText}>
                        {badgeCount}
                      </AppText>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 4. Tab Streams */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {activeTab === 'Chats' && (
          /* Direct Chats Stream */
          SAMPLE_CHATS.map((convo) => (
            <TouchableOpacity
              key={convo.id}
              style={styles.convoRow}
              onPress={() => router.push(`/chat/${convo.id}`)}
            >
              <View style={styles.avatarWrap}>
                <Image source={{ uri: convo.avatarUrl }} style={styles.avatar} />
                {convo.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.convoContent}>
                <View style={styles.convoTopRow}>
                  <View style={styles.nameRow}>
                    <AppText variant="bodySm" weight="bold">
                      {convo.name}
                    </AppText>
                    {convo.isVerified && <VerifiedBadge size={13} />}
                  </View>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {convo.time}
                  </AppText>
                </View>

                <View style={styles.convoBottomRow}>
                  <AppText
                    variant="caption"
                    color={convo.unreadCount ? Colors.text : Colors.textSecondary}
                    numberOfLines={1}
                    style={styles.messageSnippet}
                  >
                    {convo.lastMessage}
                  </AppText>
                  {convo.unreadCount ? (
                    <View style={styles.unreadBadge}>
                      <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.unreadBadgeText}>
                        {convo.unreadCount}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {activeTab === 'Requests' && (
          /* Message Requests Stream (Section 36) */
          <View style={styles.requestsContainer}>
            <View style={styles.requestsNotice}>
              <Sparkles color={Colors.primary} size={16} />
              <AppText variant="caption" color={Colors.textSecondary} style={styles.noticeText}>
                Accepting a message request allows the sender to message you and call directly.
              </AppText>
            </View>

            {requests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Image source={{ uri: req.avatarUrl }} style={styles.reqAvatar} />
                  <View style={styles.reqInfo}>
                    <View style={styles.nameRow}>
                      <AppText variant="bodySm" weight="bold">
                        {req.name}
                      </AppText>
                      {req.isVerified && <VerifiedBadge size={14} />}
                      <View style={styles.fitBadge}>
                        <AppText variant="caption" weight="bold" color={Colors.primary} style={styles.fitText}>
                          {req.matchScore}% Fit
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="caption" color={Colors.textMuted}>
                      {req.sharedInterests.join(' · ')} · {req.timeAgo}
                    </AppText>
                  </View>
                </View>

                {/* Message preview bubble */}
                <View style={styles.reqBubble}>
                  <AppText variant="bodySm" color={Colors.text} style={styles.reqBubbleText}>
                    "{req.previewText}"
                  </AppText>
                </View>

                {/* Action Buttons */}
                <View style={styles.reqActions}>
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(req)}
                    style={styles.acceptBtn}
                  >
                    <Check color="#FFFFFF" size={16} strokeWidth={2.5} />
                    <AppText variant="caption" weight="bold" color="#FFFFFF">
                      Accept
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeclineRequest(req.id)}
                    style={styles.declineBtn}
                  >
                    <X color={Colors.textSecondary} size={16} />
                    <AppText variant="caption" weight="semibold" color={Colors.textSecondary}>
                      Decline
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeclineRequest(req.id)}
                    style={styles.blockBtn}
                  >
                    <Ban color={Colors.coral} size={15} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <AppText variant="bodySm" color={Colors.textSecondary} align="center">
                  No pending message requests.
                </AppText>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Communities' && (
          /* Communities Chat Stream */
          SAMPLE_COMMUNITIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.convoRow}
              onPress={() => router.push(`/community-chat/${c.id}`)}
            >
              <View style={[styles.avatarWrap, styles.communityBadge]}>
                <Compass color="#16A34A" size={22} />
              </View>

              <View style={styles.convoContent}>
                <View style={styles.convoTopRow}>
                  <AppText variant="bodySm" weight="bold">
                    {c.name}
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    {c.time}
                  </AppText>
                </View>

                <View style={styles.convoBottomRow}>
                  <AppText
                    variant="caption"
                    color={c.unreadCount ? Colors.text : Colors.textSecondary}
                    numberOfLines={1}
                    style={styles.messageSnippet}
                  >
                    <AppText variant="caption" weight="semibold">
                      {c.lastMessageSender}:{' '}
                    </AppText>
                    {c.lastMessage}
                  </AppText>
                  {c.unreadCount ? (
                    <View style={styles.unreadBadge}>
                      <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.unreadBadgeText}>
                        {c.unreadCount}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
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
  composeBtn: {
    padding: 6,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
  },
  tabsWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontSize: 9,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  scrollContent: {
    paddingVertical: Spacing.xs,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
  },
  communityBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  convoContent: {
    flex: 1,
    gap: 4,
  },
  convoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  convoBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSnippet: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
  },
  requestsContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  requestsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  noticeText: {
    flex: 1,
    lineHeight: 16,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reqAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
  },
  reqInfo: {
    flex: 1,
  },
  fitBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
    marginLeft: 4,
  },
  fitText: {
    fontSize: 9,
  },
  reqBubble: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reqBubbleText: {
    lineHeight: 19,
    fontStyle: 'italic',
  },
  reqActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blockBtn: {
    padding: 8,
    borderRadius: Radii.full,
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
})
