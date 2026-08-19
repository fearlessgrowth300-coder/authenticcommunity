import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { getProfileSocialStats, SocialProfileStats } from '@/services/socialGraph'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import {
  MapPin,
  LogOut,
  Edit3,
  Share2,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Heart,
  ChevronRight,
} from 'lucide-react-native'

export default function ProfileScreen() {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<SocialProfileStats>({
    followersCount: 142,
    followingCount: 89,
    connectionsCount: 34,
  })
  const [interests, setInterests] = useState<string[]>([
    'Photography',
    'Hiking',
    'Technology',
    'Design',
  ])
  const [values, setValues] = useState<string[]>([
    'Kindness',
    'Growth',
    'Community',
    'Learning',
  ])

  const loadProfileData = async () => {
    if (!user) return
    try {
      const socialStats = await getProfileSocialStats(user.id)
      setStats(socialStats)

      const [intRes, valRes] = await Promise.all([
        supabase.from('user_interests').select('interest_name').eq('user_id', user.id),
        supabase.from('user_values').select('value_name').eq('user_id', user.id),
      ])

      if (intRes.data && intRes.data.length > 0) {
        setInterests(intRes.data.map((i) => i.interest_name))
      }
      if (valRes.data && valRes.data.length > 0) {
        setValues(valRes.data.map((v) => v.value_name))
      }
    } catch {
      // Graceful fallback
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [user])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProfileData()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  const fullName = `${profile?.first_name || 'Jane'} ${profile?.last_name || 'Doe'}`

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <AppText variant="h2" weight="bold">
          My Profile
        </AppText>
        <TouchableOpacity
          style={styles.settingsBtn}
          accessibilityLabel="Settings"
        >
          <Settings color={Colors.text} size={22} />
        </TouchableOpacity>
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
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <Image
              source={{
                uri:
                  profile?.profile_image_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            {profile?.is_verified && (
              <View style={styles.verifiedBadgeOverlay}>
                <VerifiedBadge size={20} />
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <AppText variant="h2" weight="bold">
              {fullName}
            </AppText>
          </View>

          {profile?.location_city && (
            <View style={styles.locationRow}>
              <MapPin color={Colors.textSecondary} size={14} />
              <AppText variant="bodySm" color={Colors.textSecondary}>
                {profile.location_city}, {profile.location_country || 'USA'}
              </AppText>
            </View>
          )}

          {profile?.bio ? (
            <AppText variant="bodySm" color={Colors.text} style={styles.bioText} align="center">
              {profile.bio}
            </AppText>
          ) : (
            <AppText variant="caption" color={Colors.textMuted} style={styles.bioText} align="center">
              Add a bio to let other members know about your passions!
            </AppText>
          )}

          {/* Social Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              onPress={() => router.push('/profile/followers')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.text}>
                {stats.followersCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Followers
              </AppText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              onPress={() => router.push('/profile/following')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.text}>
                {stats.followingCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Following
              </AppText>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            <TouchableOpacity
              onPress={() => router.push('/profile/connections')}
              style={styles.statItem}
            >
              <AppText variant="h3" weight="bold" color={Colors.primary}>
                {stats.connectionsCount}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Connections
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Edit & Share Profile Actions */}
          <View style={styles.actionButtonsRow}>
            <AppButton
              title="Edit Profile"
              variant="outline"
              size="sm"
              leftIcon={<Edit3 color={Colors.text} size={16} />}
              onPress={() => router.push('/profile/edit')}
              style={styles.editBtn}
            />
            <TouchableOpacity
              style={styles.shareBtn}
              accessibilityLabel="Share profile"
            >
              <Share2 color={Colors.text} size={18} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Interests Section */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Interests
          </AppText>
          <View style={styles.chipsWrap}>
            {interests.map((int, idx) => (
              <View key={idx} style={styles.interestChip}>
                <AppText variant="caption" color={Colors.text}>
                  {int}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.section}>
          <AppText variant="label" weight="semibold" style={styles.sectionTitle}>
            Values
          </AppText>
          <View style={styles.chipsWrap}>
            {values.map((val, idx) => (
              <View key={idx} style={styles.valueChip}>
                <AppText variant="caption" color={Colors.primaryDark}>
                  {val}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Signals & Verification Info Card */}
        <View style={styles.section}>
          <Card style={styles.trustCard}>
            <View style={styles.trustHeader}>
              <ShieldCheck
                color={profile?.is_verified ? Colors.sage : Colors.textMuted}
                size={20}
              />
              <View style={styles.trustHeaderText}>
                <AppText variant="bodySm" weight="bold">
                  {profile?.is_verified ? 'Verified Member' : 'Standard Member'}
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  {profile?.is_verified
                    ? 'Identity confirmed by authentic verification'
                    : 'Verification is managed securely on server'}
                </AppText>
              </View>
            </View>
          </Card>
        </View>

        {/* Log Out Action */}
        <View style={styles.logoutSection}>
          <AppButton
            title="Log Out"
            variant="danger"
            leftIcon={<LogOut color={Colors.surface} size={18} />}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  profileCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.border,
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  bioText: {
    lineHeight: 20,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  editBtn: {
    flex: 1,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  trustCard: {
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trustHeaderText: {
    flex: 1,
  },
  logoutSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
})
