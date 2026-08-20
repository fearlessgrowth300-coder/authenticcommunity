import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Card } from '@/components/primitives/Card'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  Search,
  SquarePen,
  Users,
  Compass,
  Check,
  X,
  Ban,
  MessageSquare,
} from 'lucide-react-native'

const MESSAGE_TABS = ['Chats', 'Requests', 'Communities'] as const
type MessageTab = (typeof MESSAGE_TABS)[number]

interface DirectConversation {
  id: string
  name: string
  avatarUrl: string | null
  lastMessage: string
  time: string
  unreadCount?: number
  isOnline?: boolean
  isVerified?: boolean
}

interface MessageRequestItem {
  id: string
  senderId: string
  name: string
  avatarUrl: string | null
  isVerified: boolean
  matchScore: number
  previewText: string
  timeAgo: string
}

interface CommunityConversation {
  id: string
  name: string
  avatarUrl: string | null
  lastMessage: string
  time: string
  unreadCount?: number
}

export default function MessagesHomeScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<MessageTab>('Chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [chats, setChats] = useState<DirectConversation[]>([])
  const [requests, setRequests] = useState<MessageRequestItem[]>([])
  const [communities, setCommunities] = useState<CommunityConversation[]>([])

  const loadMessagesData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Fetch direct messages where current user is sender or recipient
      const { data: messagesData } = await (supabase as any)
        .from('messages')
        .select('id, sender_id, recipient_id, content, created_at, is_read')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // 2. Fetch connections
      const { data: connsData } = await supabase
        .from('connections')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

      const connectedUserIds = new Set<string>()
      ;(connsData || []).forEach((c: any) => {
        connectedUserIds.add(c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1)
      })

      // Group messages by counterpart
      const conversationMap = new Map<string, { lastMsg: any; unread: number }>()
      ;(messagesData || []).forEach((m: any) => {
        const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            lastMsg: m,
            unread: m.recipient_id === user.id && !m.is_read ? 1 : 0,
          })
        } else if (m.recipient_id === user.id && !m.is_read) {
          conversationMap.get(otherId)!.unread += 1
        }
      })

      const allCounterpartIds = Array.from(
        new Set([...Array.from(conversationMap.keys()), ...Array.from(connectedUserIds)])
      )

      if (allCounterpartIds.length > 0) {
        const { data: profilesData } = await (supabase as any)
          .from('profiles')
          .select('user_id, first_name, last_name, profile_image_url, is_verified, location_city')
          .in('user_id', allCounterpartIds)

        const profileMap = new Map<string, any>()
        ;(profilesData || []).forEach((p: any) => profileMap.set(p.user_id, p))

        const activeChats: DirectConversation[] = []
        const pendingReqs: MessageRequestItem[] = []

        allCounterpartIds.forEach((cId) => {
          const prof = profileMap.get(cId)
          const info = conversationMap.get(cId)
          const name = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Community Member' : 'Member'
          const isConnected = connectedUserIds.has(cId)

          // If incoming message from non-connection who sent the first message -> treat as request
          if (!isConnected && info && info.lastMsg.sender_id === cId) {
            pendingReqs.push({
              id: info.lastMsg.id,
              senderId: cId,
              name,
              avatarUrl: prof?.profile_image_url || null,
              isVerified: Boolean(prof?.is_verified),
              matchScore: 88,
              previewText: info.lastMsg.content || 'Sent you a connection message.',
              timeAgo: 'Recently',
            })
          } else {
            activeChats.push({
              id: cId,
              name,
              avatarUrl: prof?.profile_image_url || null,
              lastMessage: info?.lastMsg ? info.lastMsg.content : 'Connected with you',
              time: info?.lastMsg ? 'Recently' : '',
              unreadCount: info?.unread || 0,
              isOnline: true,
              isVerified: Boolean(prof?.is_verified),
            })
          }
        })

        setChats(activeChats)
        setRequests(pendingReqs)
      } else {
        setChats([])
        setRequests([])
      }

      // 3. Fetch joined communities
      const { data: commMembers } = await supabase
        .from('community_members')
        .select('community_id, communities(id, community_name, profile_image_url)')
        .eq('user_id', user.id)

      if (commMembers && commMembers.length > 0) {
        setCommunities(
          commMembers.map((cm: any) => ({
            id: cm.communities?.id || cm.community_id,
            name: cm.communities?.community_name || 'Community Channel',
            avatarUrl: cm.communities?.profile_image_url || null,
            lastMessage: 'Active discussion in channel',
            time: 'Today',
          }))
        )
      } else {
        setCommunities([])
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessagesData()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMessagesData()
    setRefreshing(false)
  }

  const handleAcceptRequest = async (req: MessageRequestItem) => {
    if (!user) return
    try {
      await supabase.from('connections').insert({
        user_id_1: user.id,
        user_id_2: req.senderId,
      })
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      router.push(`/chat/${req.senderId}`)
    } catch {
      router.push(`/chat/${req.senderId}`)
    }
  }

  const handleDeclineRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  const handleBlockRequest = async (senderId: string) => {
    if (!user) return
    try {
      await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: senderId,
      })
      setRequests((prev) => prev.filter((r) => r.senderId !== senderId))
    } catch {
      setRequests((prev) => prev.filter((r) => r.senderId !== senderId))
    }
  }

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 1. Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Messages
        </AppText>

        <TouchableOpacity
          onPress={() => router.push('/discover')}
          style={styles.composeBtn}
          accessibilityLabel="Find people to chat"
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
            placeholder="Search conversations & messages..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 4. Tab Content Views */}
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Direct Chats Tab */}
            {activeTab === 'Chats' && (
              <View style={styles.chatList}>
                {filteredChats.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <MessageSquare color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No conversations yet
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Start connecting with members on Discover to chat!
                    </AppText>
                  </Card>
                ) : (
                  filteredChats.map((chat) => (
                    <TouchableOpacity
                      key={chat.id}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/chat/${chat.id}`)}
                      style={styles.chatItem}
                    >
                      <View style={styles.avatarWrapper}>
                        <Image
                          source={{
                            uri:
                              chat.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
                          }}
                          style={styles.avatar}
                        />
                        {chat.isOnline && <View style={styles.onlineIndicator} />}
                      </View>

                      <View style={styles.chatContent}>
                        <View style={styles.chatHeaderRow}>
                          <View style={styles.nameBadgeRow}>
                            <AppText variant="body" weight="bold" numberOfLines={1}>
                              {chat.name}
                            </AppText>
                            {chat.isVerified && <VerifiedBadge size={14} />}
                          </View>
                          <AppText variant="caption" color={Colors.textSecondary}>
                            {chat.time}
                          </AppText>
                        </View>

                        <View style={styles.chatBottomRow}>
                          <AppText
                            variant="bodySm"
                            color={chat.unreadCount ? Colors.text : Colors.textSecondary}
                            weight={chat.unreadCount ? 'bold' : 'normal'}
                            numberOfLines={1}
                            style={styles.lastMessageText}
                          >
                            {chat.lastMessage}
                          </AppText>

                          {chat.unreadCount ? (
                            <View style={styles.unreadBadge}>
                              <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.unreadText}>
                                {chat.unreadCount}
                              </AppText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* Requests Tab */}
            {activeTab === 'Requests' && (
              <View style={styles.requestsList}>
                {requests.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Users color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No pending requests
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Incoming message requests from new connections will appear here.
                    </AppText>
                  </Card>
                ) : (
                  requests.map((req) => (
                    <Card key={req.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Image
                          source={{
                            uri:
                              req.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
                          }}
                          style={styles.requestAvatar}
                        />
                        <View style={styles.requestInfo}>
                          <View style={styles.nameBadgeRow}>
                            <AppText variant="body" weight="bold">
                              {req.name}
                            </AppText>
                            {req.isVerified && <VerifiedBadge size={14} />}
                          </View>
                          <AppText variant="caption" color={Colors.primary} weight="bold">
                            {req.matchScore}% Match
                          </AppText>
                        </View>
                      </View>

                      <AppText variant="bodySm" color={Colors.text} style={styles.requestPreview}>
                        "{req.previewText}"
                      </AppText>

                      <View style={styles.requestActionsRow}>
                        <TouchableOpacity
                          onPress={() => handleAcceptRequest(req)}
                          style={[styles.reqBtn, styles.acceptBtn]}
                        >
                          <Check color="#FFFFFF" size={16} />
                          <AppText variant="bodySm" weight="bold" color="#FFFFFF">
                            Accept & Chat
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeclineRequest(req.id)}
                          style={[styles.reqBtn, styles.declineBtn]}
                        >
                          <X color={Colors.text} size={16} />
                          <AppText variant="bodySm" weight="medium" color={Colors.text}>
                            Decline
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleBlockRequest(req.senderId)}
                          style={styles.blockIconBtn}
                          accessibilityLabel="Block user"
                        >
                          <Ban color={Colors.textMuted} size={18} />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            )}

            {/* Communities Tab */}
            {activeTab === 'Communities' && (
              <View style={styles.communitiesList}>
                {filteredCommunities.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Compass color={Colors.textMuted} size={40} />
                    <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
                      No community chats
                    </AppText>
                    <AppText variant="caption" color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
                      Join communities on Discover to participate in group channels!
                    </AppText>
                  </Card>
                ) : (
                  filteredCommunities.map((comm) => (
                    <TouchableOpacity
                      key={comm.id}
                      activeOpacity={0.7}
                      onPress={() => router.push(`/community/${comm.id}`)}
                      style={styles.chatItem}
                    >
                      <Image
                        source={{
                          uri:
                            comm.avatarUrl ||
                            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&fit=crop&q=80',
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.chatContent}>
                        <View style={styles.chatHeaderRow}>
                          <AppText variant="body" weight="bold" numberOfLines={1}>
                            {comm.name}
                          </AppText>
                          <AppText variant="caption" color={Colors.textSecondary}>
                            {comm.time}
                          </AppText>
                        </View>
                        <AppText variant="bodySm" color={Colors.textSecondary} numberOfLines={1}>
                          {comm.lastMessage}
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  composeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: Radii.md,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
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
    backgroundColor: Colors.coral,
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: {
    fontSize: 10,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginTop: Spacing.md,
  },
  chatList: {
    gap: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  unreadText: {
    fontSize: 11,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    padding: 14,
    backgroundColor: Colors.surface,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  requestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  requestInfo: {
    flex: 1,
    gap: 2,
  },
  requestPreview: {
    lineHeight: 20,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  requestActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  blockIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communitiesList: {
    gap: 8,
  },
})
