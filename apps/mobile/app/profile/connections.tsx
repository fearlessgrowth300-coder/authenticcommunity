import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  ArrowLeft,
  Search,
  MessageCircle,
  Check,
  X,
  Users,
} from 'lucide-react-native'

interface ConnectionItem {
  id: string
  name: string
  avatarUrl: string
  city: string
  isVerified: boolean
  connectedDate: string
}

interface ConnectionRequestItem {
  id: string
  name: string
  avatarUrl: string
  city: string
  isVerified: boolean
  type: 'incoming' | 'outgoing'
  time: string
}

const SAMPLE_CONNECTIONS: ConnectionItem[] = [
  {
    id: 'c1',
    name: 'Maya Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: true,
    connectedDate: 'Connected May 2026',
  },
  {
    id: 'c2',
    name: 'David Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: false,
    connectedDate: 'Connected Apr 2026',
  },
]

const SAMPLE_REQUESTS: ConnectionRequestItem[] = [
  {
    id: 'r1',
    name: 'Marcus Brody',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80',
    city: 'Austin, TX',
    isVerified: false,
    type: 'incoming',
    time: '2h ago',
  },
  {
    id: 'r2',
    name: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    city: 'Round Rock, TX',
    isVerified: true,
    type: 'outgoing',
    time: '1d ago',
  },
]

export default function ConnectionsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'connected' | 'requests'>('connected')
  const [searchQuery, setSearchQuery] = useState('')
  const [connections, setConnections] = useState<ConnectionItem[]>(SAMPLE_CONNECTIONS)
  const [requests, setRequests] = useState<ConnectionRequestItem[]>(SAMPLE_REQUESTS)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const handleAccept = (req: ConnectionRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id))
    setConnections((prev) => [
      ...prev,
      {
        id: req.id,
        name: req.name,
        avatarUrl: req.avatarUrl,
        city: req.city,
        isVerified: req.isVerified,
        connectedDate: 'Connected just now',
      },
    ])
  }

  const handleDecline = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  const handleRemoveConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id))
  }

  const filteredConnections = connections.filter(
    (c) =>
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const incomingRequests = requests.filter((r) => r.type === 'incoming')
  const outgoingRequests = requests.filter((r) => r.type === 'outgoing')

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Connections
        </AppText>
        <View style={styles.placeholder} />
      </View>

      {/* Segmented Control */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => setActiveTab('connected')}
            style={[
              styles.tabBtn,
              activeTab === 'connected' ? styles.tabBtnActive : null,
            ]}
          >
            <AppText
              variant="bodySm"
              weight={activeTab === 'connected' ? 'bold' : 'medium'}
              color={activeTab === 'connected' ? Colors.surface : Colors.textSecondary}
            >
              Connected ({connections.length})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            style={[
              styles.tabBtn,
              activeTab === 'requests' ? styles.tabBtnActive : null,
            ]}
          >
            <AppText
              variant="bodySm"
              weight={activeTab === 'requests' ? 'bold' : 'medium'}
              color={activeTab === 'requests' ? Colors.surface : Colors.textSecondary}
            >
              Requests ({requests.length})
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search when on connected tab */}
      {activeTab === 'connected' && (
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search connections"
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
          </View>
        </View>
      )}

      {/* Content */}
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
        {activeTab === 'connected' ? (
          /* Active Connections List */
          filteredConnections.map((item) => (
            <View key={item.id} style={styles.connectionRow}>
              <TouchableOpacity
                onPress={() => router.push(`/profile/${item.id}`)}
                style={styles.profileClick}
              >
                <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                <View style={styles.nameSection}>
                  <View style={styles.nameRow}>
                    <AppText variant="bodySm" weight="bold">
                      {item.name}
                    </AppText>
                    {item.isVerified && <VerifiedBadge size={14} />}
                  </View>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {item.city} · {item.connectedDate}
                  </AppText>
                </View>
              </TouchableOpacity>

              <View style={styles.actionGroup}>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/messages')}
                  style={styles.msgBtn}
                  accessibilityLabel="Message connection"
                >
                  <MessageCircle color={Colors.primary} size={18} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRemoveConnection(item.id)}
                  style={styles.removeBtn}
                  accessibilityLabel="Remove connection"
                >
                  <X color={Colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          /* Connection Requests List */
          <View style={styles.requestsSection}>
            {incomingRequests.length > 0 && (
              <View style={styles.requestSubSection}>
                <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.sectionHeader}>
                  Incoming Requests
                </AppText>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={styles.connectionRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/profile/${req.id}`)}
                      style={styles.profileClick}
                    >
                      <Image source={{ uri: req.avatarUrl }} style={styles.avatar} />
                      <View style={styles.nameSection}>
                        <View style={styles.nameRow}>
                          <AppText variant="bodySm" weight="bold">
                            {req.name}
                          </AppText>
                          {req.isVerified && <VerifiedBadge size={14} />}
                        </View>
                        <AppText variant="caption" color={Colors.textSecondary}>
                          {req.city} · {req.time}
                        </AppText>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.actionGroup}>
                      <TouchableOpacity
                        onPress={() => handleAccept(req)}
                        style={styles.acceptBtn}
                      >
                        <Check color={Colors.surface} size={16} strokeWidth={3} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDecline(req.id)}
                        style={styles.declineBtn}
                      >
                        <X color={Colors.textMuted} size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {outgoingRequests.length > 0 && (
              <View style={styles.requestSubSection}>
                <AppText variant="caption" weight="bold" color={Colors.textMuted} style={styles.sectionHeader}>
                  Sent Requests
                </AppText>
                {outgoingRequests.map((req) => (
                  <View key={req.id} style={styles.connectionRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/profile/${req.id}`)}
                      style={styles.profileClick}
                    >
                      <Image source={{ uri: req.avatarUrl }} style={styles.avatar} />
                      <View style={styles.nameSection}>
                        <View style={styles.nameRow}>
                          <AppText variant="bodySm" weight="bold">
                            {req.name}
                          </AppText>
                          {req.isVerified && <VerifiedBadge size={14} />}
                        </View>
                        <AppText variant="caption" color={Colors.textSecondary}>
                          {req.city} · {req.time}
                        </AppText>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDecline(req.id)}
                      style={styles.cancelOutgoingBtn}
                    >
                      <AppText variant="caption" color={Colors.textSecondary}>
                        Cancel
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {requests.length === 0 && (
              <View style={styles.emptyState}>
                <AppText variant="bodySm" color={Colors.textSecondary} align="center">
                  No pending connection requests.
                </AppText>
              </View>
            )}
          </View>
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
  backBtn: {
    padding: 4,
  },
  placeholder: {
    width: 30,
  },
  tabBarWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  tabBar: {
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
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileClick: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  nameSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  msgBtn: {
    padding: 8,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
  },
  removeBtn: {
    padding: 6,
  },
  requestsSection: {
    gap: Spacing.md,
  },
  requestSubSection: {
    gap: 2,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
  acceptBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutgoingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
})
