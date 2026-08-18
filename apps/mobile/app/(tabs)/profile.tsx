import React from 'react'
import { StyleSheet, View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { Avatar } from '@/components/primitives/Avatar'
import { VerifiedBadge } from '@/components/primitives/VerifiedBadge'
import { Badge } from '@/components/primitives/Badge'
import { MapPin, LogOut } from 'lucide-react-native'

export default function ProfileScreen() {
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText variant="h2" weight="bold" style={styles.title}>
          My Profile
        </AppText>

        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              url={profile?.profile_image_url}
              name={profile?.first_name || 'You'}
              size={72}
            />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <AppText variant="h3" weight="bold">
                  {profile?.first_name} {profile?.last_name || ''}
                </AppText>
                {profile?.is_verified && <VerifiedBadge size={16} />}
              </View>
              {profile?.location_city && (
                <View style={styles.locationRow}>
                  <MapPin color={Colors.textSecondary} size={14} />
                  <AppText variant="bodySm" color={Colors.textSecondary}>
                    {profile.location_city}, {profile.location_country}
                  </AppText>
                </View>
              )}
              {profile?.age && (
                <AppText variant="caption" color={Colors.textMuted} style={styles.ageText}>
                  Age: {profile.age}
                </AppText>
              )}
            </View>
          </View>

          {profile?.bio ? (
            <View style={styles.bioContainer}>
              <AppText variant="bodySm" style={styles.bioText}>
                {profile.bio}
              </AppText>
            </View>
          ) : null}

          <View style={styles.badgeRow}>
            <Badge label={profile?.is_verified ? 'Verified Member' : 'Standard Member'} variant={profile?.is_verified ? 'primary' : 'neutral'} />
          </View>
        </Card>

        <Card style={styles.actionCard}>
          <AppButton
            title="Log Out"
            variant="danger"
            leftIcon={<LogOut color={Colors.surface} size={18} />}
            onPress={handleSignOut}
          />
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
  title: {
    marginBottom: Spacing.lg,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerInfo: {
    flex: 1,
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
    marginTop: 4,
  },
  ageText: {
    marginTop: 2,
  },
  bioContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bioText: {
    lineHeight: 20,
  },
  badgeRow: {
    marginTop: Spacing.md,
  },
  actionCard: {
    marginTop: Spacing.md,
  },
})
