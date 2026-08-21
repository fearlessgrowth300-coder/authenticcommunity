import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  Users,
  Compass,
  Calendar,
  FileText,
  ChevronRight,
} from 'lucide-react-native'

const SEARCH_TABS = ['All', 'People', 'Hubs', 'Events', 'Posts'] as const
type SearchTab = (typeof SEARCH_TABS)[number]

export default function GlobalSearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('All')
  const [loading, setLoading] = useState(false)

  const [people, setPeople] = useState<any[]>([])
  const [communities, setCommunities] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setPeople([])
      setCommunities([])
      setEvents([])
      setPosts([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()

      try {
        const [peopleRes, commRes, eventRes, postRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, first_name, last_name, profile_image_url, is_verified, location_city')
            .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,location_city.ilike.%${q}%`)
            .limit(10),
          supabase
            .from('communities')
            .select('id, community_name, category, photo_url, member_count, location_city')
            .or(`community_name.ilike.%${q}%,category.ilike.%${q}%,location_city.ilike.%${q}%`)
            .limit(10),
          (supabase as any)
            .from('events')
            .select('id, title, event_title, location_city, start_time, event_date, cover_image_url')
            .or(`title.ilike.%${q}%,event_title.ilike.%${q}%,location_city.ilike.%${q}%`)
            .limit(10),
          (supabase as any)
            .from('posts')
            .select('id, content, created_at, profiles(first_name, last_name, profile_image_url, is_verified)')
            .ilike('content', `%${q}%`)
            .limit(10),
        ])

        if (peopleRes.data) setPeople(peopleRes.data)
        if (commRes.data) setCommunities(commRes.data)
        if (eventRes.data) setEvents(eventRes.data)
        if (postRes.data) setPosts(postRes.data)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  const hasResults = people.length > 0 || communities.length > 0 || events.length > 0 || posts.length > 0

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <SearchIcon color={Colors.textMuted} size={18} />
          <TextInput
            placeholder="Search people, hubs, events, posts..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            style={styles.input}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <X color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {SEARCH_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
          >
            <AppText
              variant="caption"
              weight={activeTab === tab ? 'bold' : 'medium'}
              color={activeTab === tab ? Colors.primary : Colors.textSecondary}
            >
              {tab}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
        ) : !query.trim() ? (
          <View style={styles.emptyPrompt}>
            <SearchIcon color={Colors.textMuted} size={48} />
            <AppText variant="body" weight="medium" style={{ marginTop: 12 }}>
              Search Authentic Community
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} style={{ textAlign: 'center', marginTop: 4 }}>
              Find friends, nearby community hubs, upcoming meetups, and member discussions.
            </AppText>
          </View>
        ) : !hasResults ? (
          <View style={styles.emptyPrompt}>
            <AppText variant="body" weight="medium">
              No results found for "{query}"
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 4 }}>
              Try searching by city, hobby, value, or member name.
            </AppText>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            {/* People Section */}
            {(activeTab === 'All' || activeTab === 'People') && people.length > 0 && (
              <View style={styles.sectionBlock}>
                <AppText variant="caption" weight="bold" color={Colors.textSecondary} style={styles.sectionHeader}>
                  PEOPLE ({people.length})
                </AppText>
                {people.map((p) => {
                  const pName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member'
                  return (
                    <TouchableOpacity
                      key={p.user_id}
                      onPress={() => router.push(`/profile/${p.user_id}`)}
                      style={styles.resultRow}
                    >
                      <Image
                        source={{
                          uri: p.profile_image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&fit=crop&q=80',
                        }}
                        style={styles.avatar}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <AppText variant="bodySm" weight="bold">{pName}</AppText>
                          {p.is_verified && <VerifiedBadge size={12} />}
                        </View>
                        <AppText variant="caption" color={Colors.textMuted}>{p.location_city || 'Local'}</AppText>
                      </View>
                      <ChevronRight color={Colors.textMuted} size={18} />
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}

            {/* Hubs Section */}
            {(activeTab === 'All' || activeTab === 'Hubs') && communities.length > 0 && (
              <View style={styles.sectionBlock}>
                <AppText variant="caption" weight="bold" color={Colors.textSecondary} style={styles.sectionHeader}>
                  COMMUNITY HUBS ({communities.length})
                </AppText>
                {communities.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => router.push(`/community/${c.id}`)}
                    style={styles.resultRow}
                  >
                    <View style={styles.iconCircle}>
                      <Compass color={Colors.primary} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySm" weight="bold">{c.community_name}</AppText>
                      <AppText variant="caption" color={Colors.textMuted}>{c.category} · {c.member_count || 1} members</AppText>
                    </View>
                    <ChevronRight color={Colors.textMuted} size={18} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Events Section */}
            {(activeTab === 'All' || activeTab === 'Events') && events.length > 0 && (
              <View style={styles.sectionBlock}>
                <AppText variant="caption" weight="bold" color={Colors.textSecondary} style={styles.sectionHeader}>
                  EVENTS ({events.length})
                </AppText>
                {events.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => router.push(`/event/${ev.id}`)}
                    style={styles.resultRow}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Calendar color={Colors.amber} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySm" weight="bold">{ev.title || ev.event_title}</AppText>
                      <AppText variant="caption" color={Colors.textMuted}>{ev.location_city || 'Local Area'}</AppText>
                    </View>
                    <ChevronRight color={Colors.textMuted} size={18} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Posts Section */}
            {(activeTab === 'All' || activeTab === 'Posts') && posts.length > 0 && (
              <View style={styles.sectionBlock}>
                <AppText variant="caption" weight="bold" color={Colors.textSecondary} style={styles.sectionHeader}>
                  DISCUSSIONS & POSTS ({posts.length})
                </AppText>
                {posts.map((post) => (
                  <Card key={post.id} style={styles.postResultCard}>
                    <AppText variant="caption" weight="bold" color={Colors.primary}>
                      {post.profiles?.first_name} {post.profiles?.last_name}
                    </AppText>
                    <AppText variant="bodySm" style={{ marginTop: 4 }}>
                      {post.content}
                    </AppText>
                  </Card>
                ))}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
  },
  clearBtn: {
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    paddingVertical: 10,
    marginRight: 16,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: Spacing.xl,
  },
  resultsContainer: {
    gap: 20,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeader: {
    marginBottom: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postResultCard: {
    padding: Spacing.md,
  },
})
