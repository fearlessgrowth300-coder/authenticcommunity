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
  Alert,
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

      // 2. Fetch pending message requests
      const { data: reqsData } = await (supabase as any)
        .from('message_requests')
        .select('id, sender_id, recipient_id, initial_message, match_score, status, created_at')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      // 3. Fetch connections
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
      ;(messagesData || []).forEach((msg: any) => {
        const counterpartId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
        if (!conversationMap.has(counterpartId)) {
          conversationMap.set(counterpartId, {
            lastMsg: msg,
            unread: msg.recipient_id === user.id && !msg.is_read ? 1 : 0,
          })
        } else if (msg.recipient_id === user.id && !msg.is_read) {
          const current = conversationMap.get(counterpartId)!
          current.unread += 1
        }
      })

      const allCounterpartIds = Array.from(
        new Set([
          ...Array.from(conversationMap.keys()),
          ...(reqsData || []).map((r: any) => r.sender_id),
        ])
      )

      if (allCounterpartIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, profile_image_url, is_verified, location_city')
          .in('user_id', allCounterpartIds)

        const profileMap = new Map<string, any>()
        ;(profilesData || []).forEach((p: any) => profileMap.set(p.user_id, p))

        const activeChats: DirectConversation[] = []
        conversationMap.forEach((info, cId) => {
          const prof = profileMap.get(cId)
          const name = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Community Member' : 'Member'
          activeChats.push({
            id: cId,
            name,
            avatarUrl: prof?.profile_image_url || null,
            lastMessage: info?.lastMsg ? info.lastMsg.content : 'Connected with you',
            time: info?.lastMsg ? new Date(info.lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: info?.unread || 0,
            isOnline: true,
            isVerified: Boolean(prof?.is_verified),
          })
        })

        const pendingReqs: MessageRequestItem[] = (reqsData || []).map((r: any) => {
          const prof = profileMap.get(r.sender_id)
          const name = prof ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'New Member' : 'New Member'
          return {
            id: r.id,
            senderId: r.sender_id,
            name,
            avatarUrl: prof?.profile_image_url || null,
            isVerified: Boolean(prof?.is_verified),
            matchScore: r.match_score || 85,
            previewText: r.initial_message || 'Sent you an introduction message.',
            timeAgo: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        })

        setChats(activeChats)
        setRequests(pendingReqs)
      } else {
        setChats([])
        setRequests([])
      }

      // 4. Fetch joined communities
      const { data: commMembers } = await supabase
        .from('community_members')
        .select('community_id, communities(id, community_name, photo_url)')
        .eq('user_id', user.id)

      if (commMembers && commMembers.length > 0) {
        setCommunities(
          commMembers.map((cm: any) => ({
            id: cm.communities?.id || cm.community_id,
            name: cm.communities?.community_name || 'Community Channel',
            avatarUrl: cm.communities?.photo_url || null,
            lastMessage: 'Tap to join active channel discussions',
            time: '',
          }))
        )
      } else {
        setCommunities([])
      }
    } catch {
      // Graceful
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMessagesData()
  }, [user])

  const handleAcceptRequest = async (item: MessageRequestItem) => {
    try {
      await (supabase as any)
        .from('message_requests')
        .update({ status: 'accepted' })
        .eq('id', item.id)

      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      setChats((prev) => [
        {
          id: item.senderId,
          name: item.name,
          avatarUrl: item.avatarUrl,
          lastMessage: item.previewText,
          time: 'Just now',
          unreadCount: 0,
          isVerified: item.isVerified,
        },
        ...prev,
      ])
      Alert.alert('Request Accepted', `You can now chat with ${item.name}!`)
    } catch {
      Alert.alert('Error', 'Could not accept message request.')
    }
  }

  const handleDeclineRequest = async (item: MessageRequestItem) => {
    try {
      await (supabase as any)
        .from('message_requests')
        .update({ status: 'declined' })
        .eq('id', item.id)
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
    } catch {
      Alert.alert('Error', 'Could not decline message request.')
    }
  }

  const handleBlockRequest = async (item: MessageRequestItem) => {
    if (!user) return
    try {
      await Promise.all([
        (supabase as any).from('message_requests').update({ status: 'blocked' }).eq('id', item.id),
        (supabase as any).from('blocked_users').insert({ blocker_id: user.id, blocked_id: item.senderId }),
      ])
      setRequests((prev) => prev.filter((r) => r.id !== item.id))
      Alert.alert('Blocked', 'User has been blocked.')
    } catch {
      Alert.alert('Error', 'Could not block user.')
    }
  }

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredCommunities = communities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Messages
        </AppText>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {MESSAGE_TABS.map((tab) => {
          const isActive = activeTab === tab
          let badgeCount = 0
          if (tab === 'Requests') badgeCount = requests.length

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
            >
              <View style={styles.tabContent}>
                <AppText
                  variant="bodySm"
                  weight={isActive ? 'bold' : 'medium'}
                  color={isActive ? Colors.primary : Colors.textSecondary}
                >
                  {tab}
                </AppText>
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <AppText variant="caption" weight="bold" color="#FFFFFF">
                      {badgeCount}
                    </AppText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMessagesData(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
        ) : activeTab === 'Chats' ? (
          filteredChats.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageSquare color={Colors.textMuted} size={40} />
              <AppText variant="body" weight="medium" style={{ marginTop: 12 }}>
                No active conversations yet
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
                Connect with members or respond to requests to start chatting!
              </AppText>
            </View>
          ) : (
            filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                onPress={() => router.push(`/chat/${chat.id}`)}
                style={styles.chatRow}
              >
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{
                      uri: chat.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                    }}
                    style={styles.avatar}
                  />
                  {chat.isOnline && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <View style={styles.nameWithBadge}>
                      <AppText variant="bodySm" weight="bold">
                        {chat.name}
                      </AppText>
                      {chat.isVerified && <VerifiedBadge size={14} />}
                    </View>
                    <AppText variant="caption" color={Colors.textMuted}>
                      {chat.time}
                    </AppText>
                  </View>
                  <View style={styles.chatFooterRow}>
                    <AppText
                      variant="caption"
                      color={chat.unreadCount ? Colors.text : Colors.textSecondary}
                      weight={chat.unreadCount ? 'bold' : 'normal'}
                      numberOfLines={1}
                      style={{ flex: 1 }}
                    >
                      {chat.lastMessage}
                    </AppText>
                    {Boolean(chat.unreadCount) && (
                      <View style={styles.unreadBadge}>
                        <AppText variant="caption" weight="bold" color="#FFFFFF" style={{ fontSize: 10 }}>
                          {chat.unreadCount}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : activeTab === 'Requests' ? (
          requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color={Colors.textMuted} size={40} />
              <AppText variant="body" weight="medium" style={{ marginTop: 12 }}>
                No pending message requests
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
                When someone outside your connections reaches out, their request will appear here.
              </AppText>
            </View>
          ) : (
            requests.map((req) => (
              <Card key={req.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Image
                    source={{
                      uri: req.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                    }}
                    style={styles.requestAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameWithBadge}>
                      <AppText variant="bodySm" weight="bold">
                        {req.name}
                      </AppText>
                      {req.isVerified && <VerifiedBadge size={14} />}
                    </View>
                    <AppText variant="caption" color={Colors.primary} weight="medium">
                      {req.matchScore}% Match · {req.timeAgo}
                    </AppText>
                  </View>
                </View>
                <AppText variant="caption" color={Colors.text} style={styles.requestPreview}>
                  "{req.previewText}"
                </AppText>
                <View style={styles.requestActionRow}>
                  <TouchableOpacity onPress={() => handleAcceptRequest(req)} style={styles.acceptBtn}>
                    <Check color="#FFFFFF" size={16} />
                    <AppText variant="caption" weight="bold" color="#FFFFFF">
                      Accept
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeclineRequest(req)} style={styles.declineBtn}>
                    <X color={Colors.text} size={16} />
                    <AppText variant="caption" weight="medium">
                      Decline
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleBlockRequest(req)} style={styles.blockBtn}>
                    <Ban color="#DC2626" size={16} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )
        ) : (
          filteredCommunities.length === 0 ? (
            <View style={styles.emptyState}>
              <Compass color={Colors.textMuted} size={40} />
              <AppText variant="body" weight="medium" style={{ marginTop: 12 }}>
                No joined communities yet
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
                Explore and join hubs to participate in group channel discussions.
              </AppText>
            </View>
          ) : (
            filteredCommunities.map((comm) => (
              <TouchableOpacity
                key={comm.id}
                onPress={() => router.push(`/community-chat/${comm.id}`)}
                style={styles.chatRow}
              >
                <View style={styles.commIconBox}>
                  <Compass color={Colors.primary} size={22} />
                </View>
                <View style={styles.chatInfo}>
                  <AppText variant="bodySm" weight="bold">
                    {comm.name}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                    {comm.lastMessage}
                  </AppText>
                </View>
              </TouchableOpacity>
            ))
          )
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 20,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginLeft: 8,
  },
  requestCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  requestPreview: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: Radii.md,
    marginBottom: 10,
  },
  requestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  blockBtn: {
    padding: 8,
  },
  commIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
