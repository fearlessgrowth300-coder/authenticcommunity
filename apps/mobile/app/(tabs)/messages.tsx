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
import {
  Search,
  SlidersHorizontal,
  SquarePen,
  Users,
  Compass,
} from 'lucide-react-native'

interface DirectConversation {
  id: string
  name: string
  avatarUrl: string
  lastMessage: string
  time: string
  unreadCount?: number
  isOnline?: boolean
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

const DIRECT_CONVERSATIONS: DirectConversation[] = [
  {
    id: 'jane-doe',
    name: 'Jane Doe',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    lastMessage: "Sounds great! I'd love to check that out this weekend.",
    time: '9:41 AM',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'michael-chen',
    name: 'Michael Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    lastMessage: 'That makes a lot of sense. Thanks for sharing!',
    time: 'Yesterday',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    lastMessage: 'Let me know if you want to join the book club.',
    time: 'Tue',
    isOnline: false,
  },
  {
    id: 'david-rodriguez',
    name: 'David Rodriguez',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80',
    lastMessage: 'Awesome! See you there.',
    time: 'Mon',
    isOnline: true,
  },
]

const COMMUNITY_CONVERSATIONS: CommunityConversation[] = [
  {
    id: 'austin-hikers',
    name: 'Austin Hikers',
    iconType: 'hikers',
    lastMessageSender: 'Sarah',
    lastMessage: "Don't forget our sunrise hike this Saturday! 🥾",
    time: 'Yesterday',
    unreadCount: 3,
  },
  {
    id: 'mindful-living',
    name: 'Mindful Living Community',
    iconType: 'mindful',
    lastMessageSender: 'Alex',
    lastMessage: 'New meditation session posted for this Friday.',
    time: 'Mon',
    unreadCount: 4,
  },
]

export default function MessagesScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'direct' | 'communities'>('direct')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 600)
  }

  const renderCommunityIcon = (type: string) => {
    if (type === 'hikers') {
      return (
        <View style={[styles.communityIconBadge, { backgroundColor: '#4F46E5' }]}>
          <Users color="#FFFFFF" size={20} />
        </View>
      )
    }
    return (
      <View style={[styles.communityIconBadge, { backgroundColor: '#DCFCE7' }]}>
        <Compass color="#16A34A" size={20} />
      </View>
    )
  }

  const filteredDirect = DIRECT_CONVERSATIONS.filter(
    (c) =>
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCommunities = COMMUNITY_CONVERSATIONS.filter(
    (c) =>
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.brandIconCircle}>
            <Users color={Colors.primary} size={20} />
          </View>
          <AppText variant="h2" weight="bold">
            Messages
          </AppText>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/chat/jane-doe')}
          style={styles.composeButton}
          accessibilityLabel="Compose new message"
        >
          <SquarePen color={Colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.segmentedControlWrapper}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            onPress={() => setActiveTab('direct')}
            style={[
              styles.segmentTab,
              activeTab === 'direct' ? styles.segmentTabActive : null,
            ]}
          >
            <AppText
              variant="bodySm"
              weight={activeTab === 'direct' ? 'bold' : 'medium'}
              color={activeTab === 'direct' ? Colors.surface : Colors.textSecondary}
            >
              Direct
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('communities')}
            style={[
              styles.segmentTab,
              activeTab === 'communities' ? styles.segmentTabActive : null,
            ]}
          >
            <AppText
              variant="bodySm"
              weight={activeTab === 'communities' ? 'bold' : 'medium'}
              color={activeTab === 'communities' ? Colors.surface : Colors.textSecondary}
            >
              Communities
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search messages"
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          <TouchableOpacity style={styles.filterIconBtn}>
            <SlidersHorizontal color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
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
        {activeTab === 'direct' ? (
          /* Direct Messages List */
          filteredDirect.map((convo) => (
            <TouchableOpacity
              key={convo.id}
              style={styles.convoRow}
              onPress={() => router.push(`/chat/${convo.id}`)}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: convo.avatarUrl }} style={styles.avatar} />
                {convo.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.convoContent}>
                <View style={styles.convoTopRow}>
                  <AppText variant="bodySm" weight="bold">
                    {convo.name}
                  </AppText>
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
        ) : (
          /* Communities Chat List */
          filteredCommunities.map((convo) => (
            <TouchableOpacity
              key={convo.id}
              style={styles.convoRow}
              onPress={() => router.push(`/community-chat/${convo.id}`)}
            >
              <View style={styles.avatarContainer}>
                {renderCommunityIcon(convo.iconType)}
              </View>

              <View style={styles.convoContent}>
                <View style={styles.convoTopRow}>
                  <AppText variant="bodySm" weight="bold">
                    {convo.name}
                  </AppText>
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
                    <AppText variant="caption" weight="semibold">
                      {convo.lastMessageSender}:{' '}
                    </AppText>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeButton: {
    padding: 6,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
  },
  segmentedControlWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  segmentTabActive: {
    backgroundColor: Colors.primary,
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
    height: 42,
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
  filterIconBtn: {
    padding: 4,
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
  },
  communityIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
})
