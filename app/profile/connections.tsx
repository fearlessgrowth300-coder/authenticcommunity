import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
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
  ArrowLeft,
  Search,
  MessageCircle,
  Users,
} from 'lucide-react-native'

interface ConnectionItem {
  id: string
  name: string
  avatarUrl: string | null
  city: string
  isVerified: boolean
}

export default function ConnectionsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [connections, setConnections] = useState<ConnectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadConnections = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: conns } = await supabase
        .from('connections')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

      if (conns && conns.length > 0) {
        const partnerIds = conns.map((c: any) =>
          c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
        )
        const { data: profs } = await (supabase as any)
          .from('profiles')
          .select('user_id, first_name, last_name, profile_image_url, location_city, is_verified')
          .in('user_id', partnerIds)

        if (profs) {
          setConnections(
            profs.map((p: any) => ({
              id: p.user_id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Community Member',
              avatarUrl: p.profile_image_url || null,
              city: p.location_city || 'Local area',
              isVerified: Boolean(p.is_verified),
            }))
          )
        }
      } else {
        setConnections([])
      }
    } catch {
      setConnections([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConnections()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadConnections()
    setRefreshing(false)
  }

  const filtered = connections.filter(
    (item) =>
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Connections ({connections.length})
        </AppText>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search connections..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

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
        ) : filtered.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Users color={Colors.textMuted} size={40} />
            <AppText variant="body" weight="bold" style={{ marginTop: 12 }}>
              No mutual connections yet
            </AppText>
            <AppText
              variant="caption"
              color={Colors.textSecondary}
              align="center"
              style={{ marginTop: 4 }}
            >
              When you and another member accept a connection request, you can chat and view mutual stories here!
            </AppText>
          </Card>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity
                onPress={() => router.push(`/profile/${item.id}`)}
                style={styles.userClick}
              >
                <Image
                  source={{
                    uri:
                      item.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <AppText variant="bodySm" weight="bold">
                      {item.name}
                    </AppText>
                    {item.isVerified && <VerifiedBadge size={13} />}
                  </View>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {item.city}
                  </AppText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push(`/chat/${item.id}`)}
                style={styles.chatBtn}
                accessibilityLabel="Message connection"
              >
                <MessageCircle color={Colors.primary} size={18} />
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerRightPlaceholder: {
    width: 30,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 40,
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
    padding: Spacing.md,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userClick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
