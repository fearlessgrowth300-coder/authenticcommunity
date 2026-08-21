import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { supabase } from '@/services/supabase'
import { loadUserPreferences, saveUserPreferences } from '@/services/preferences'
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronRight,
} from 'lucide-react-native'

export default function PrivacySettingsScreen() {
  const router = useRouter()

  const [isPrivateProfile, setIsPrivateProfile] = useState(false)
  const [followApproval, setFollowApproval] = useState(false)
  const [messagesFrom, setMessagesFrom] = useState<'everyone' | 'followers' | 'connections' | 'nobody'>('connections')
  const [locationPrivacy, setLocationPrivacy] = useState<'city' | 'distance' | 'hidden'>('city')
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      loadUserPreferences(),
    ]).then(async ([auth, preferences]) => {
      if (auth.data.user) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('profile_visibility')
          .eq('user_id', auth.data.user.id)
          .maybeSingle()
        const isPrivate = profile?.profile_visibility === 'private'
        setIsPrivateProfile(isPrivate)
        setFollowApproval(isPrivate)
      }
      setMessagesFrom(preferences.messagesFrom)
      setLocationPrivacy(preferences.locationVisibility)
      setShowOnlineStatus(preferences.showOnlineStatus)
      setReadReceipts(preferences.readReceipts)
    })
  }, [])

  const updateProfilePrivacy = async (isPrivate: boolean) => {
    setIsPrivateProfile(isPrivate)
    setFollowApproval(isPrivate)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ profile_visibility: isPrivate ? 'private' : 'public' })
      .eq('user_id', auth.user.id)
    if (error) Alert.alert('Could Not Save', error.message)
  }

  const persistPreference = async (change: Parameters<typeof saveUserPreferences>[0]) => {
    try {
      await saveUserPreferences(change)
    } catch (error: any) {
      Alert.alert('Could Not Save', error?.message || 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Privacy & Safety
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. Account Visibility */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Account Visibility
          </AppText>
          <View style={styles.cardContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <AppText variant="bodySm" weight="medium">
                  Private Profile
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Only approved followers and connections can see your posts and profile details.
                </AppText>
              </View>
              <Switch
                value={isPrivateProfile}
                onValueChange={updateProfilePrivacy}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <AppText variant="bodySm" weight="medium">
                  Follow Approval Required
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Manually review and approve incoming follow requests.
                </AppText>
              </View>
              <Switch
                value={followApproval}
                onValueChange={updateProfilePrivacy}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* 2. Messaging Permissions */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Who Can Message Me
          </AppText>
          <View style={styles.cardContainer}>
            {[
              { id: 'everyone', label: 'Everyone (Message Requests enabled)' },
              { id: 'followers', label: 'People I Follow or Who Follow Me' },
              { id: 'connections', label: 'Only Connections' },
              { id: 'nobody', label: 'Nobody' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  const value = opt.id as 'everyone' | 'followers' | 'connections' | 'nobody'
                  setMessagesFrom(value)
                  persistPreference({ messagesFrom: value })
                }}
                style={styles.optionRow}
              >
                <AppText variant="bodySm" weight={messagesFrom === opt.id ? 'bold' : 'normal'}>
                  {opt.label}
                </AppText>
                {messagesFrom === opt.id && <CheckCircle2 color={Colors.primary} size={18} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Location Visibility */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Location Precision
          </AppText>
          <View style={styles.cardContainer}>
            {[
              { id: 'city', label: 'Show City Only (Recommended)' },
              { id: 'distance', label: 'Show Distance in km' },
              { id: 'hidden', label: 'Hide Location Completely' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  const value = opt.id as 'city' | 'distance' | 'hidden'
                  setLocationPrivacy(value)
                  persistPreference({ locationVisibility: value })
                }}
                style={styles.optionRow}
              >
                <AppText variant="bodySm" weight={locationPrivacy === opt.id ? 'bold' : 'normal'}>
                  {opt.label}
                </AppText>
                {locationPrivacy === opt.id && <CheckCircle2 color={Colors.primary} size={18} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Activity & Presence */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Activity & Presence
          </AppText>
          <View style={styles.cardContainer}>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <AppText variant="bodySm" weight="medium">
                  Show Online Status
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Let connections see when you are active.
                </AppText>
              </View>
              <Switch
                value={showOnlineStatus}
                onValueChange={(value) => {
                  setShowOnlineStatus(value)
                  persistPreference({ showOnlineStatus: value })
                }}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <AppText variant="bodySm" weight="medium">
                  Read Receipts
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Show double checkmarks when messages are read.
                </AppText>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={(value) => {
                  setReadReceipts(value)
                  persistPreference({ readReceipts: value })
                }}
                trackColor={{ false: Colors.border, true: Colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* 5. Safety Shortcuts */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Safety Controls
          </AppText>
          <View style={styles.cardContainer}>
            <TouchableOpacity onPress={() => router.push('/settings/blocked-users')} style={styles.optionRow}>
              <AppText variant="bodySm" weight="medium">
                Blocked Users
              </AppText>
              <ChevronRight color={Colors.textMuted} size={16} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/settings/muted-users')} style={styles.optionRow}>
              <AppText variant="bodySm" weight="medium">
                Muted Users
              </AppText>
              <ChevronRight color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    gap: 8,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  switchInfo: {
    flex: 1,
    gap: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
})
