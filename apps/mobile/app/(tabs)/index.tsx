import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { Badge } from '@/components/primitives/Badge'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { Bell, Sparkles, MapPin, Users, Calendar, LogOut } from 'lucide-react-native'

export default function HomeScreen() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    connections: 0,
    communities: 0,
  })

  const loadStats = async () => {
    if (!user) return
    try {
      const [connRes, commRes] = await Promise.all([
        supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`),
        supabase
          .from('community_members')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

      setStats({
        connections: connRes.count || 0,
        communities: commRes.count || 0,
      })
    } catch {
      // Graceful fallback
    }
  }

  useEffect(() => {
    loadStats()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadStats()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar
              url={profile?.profile_image_url}
              name={profile?.first_name || 'You'}
              size={44}
            />
            <View style={styles.headerText}>
              <View style={styles.nameRow}>
                <AppText variant="h3" weight="bold">
                  {profile?.first_name ? `Hi, ${profile.first_name}` : 'Welcome'}
                </AppText>
                {profile?.is_verified && <VerifiedBadge size={16} />}
              </View>
              {profile?.location_city && (
                <View style={styles.locationRow}>
                  <MapPin color={Colors.textSecondary} size={12} />
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {profile.location_city}, {profile.location_country}
                  </AppText>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutButton}
            accessibilityLabel="Sign Out"
          >
            <LogOut color={Colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Foundation Notice Card */}
        <Card style={styles.welcomeCard}>
          <View style={styles.welcomeIconRow}>
            <Sparkles color={Colors.primary} size={24} />
            <Badge label="Mobile Foundation Active" variant="primary" />
          </View>
          <AppText variant="h3" weight="bold" style={styles.welcomeTitle}>
            Authentic Connection Mobile
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} style={styles.welcomeDesc}>
            Connected directly to Supabase with persistent auth, native design tokens, and shared core ranking algorithms.
          </AppText>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Users color={Colors.primary} size={20} />
            <AppText variant="h2" weight="bold" style={styles.statNumber}>
              {stats.connections}
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              Connections
            </AppText>
          </Card>

          <Card style={styles.statCard}>
            <Calendar color={Colors.coral} size={20} />
            <AppText variant="h2" weight="bold" style={styles.statNumber}>
              {stats.communities}
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              Communities
            </AppText>
          </Card>
        </View>

        {/* Quick Actions Card */}
        <Card style={styles.actionsCard}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Explore Next
          </AppText>
          <View style={styles.actionButtons}>
            <AppButton
              title="Discover Matches"
              variant="outline"
              size="sm"
              onPress={() => router.push('/(tabs)/discover')}
            />
            <AppButton
              title="View Profile"
              variant="secondary"
              size="sm"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    marginLeft: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  signOutButton: {
    padding: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  welcomeCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  welcomeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  welcomeTitle: {
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  welcomeDesc: {
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: Spacing.lg,
  },
  statNumber: {
    marginVertical: 4,
  },
  actionsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
})
