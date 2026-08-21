import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
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
  const [messagesFrom, setMessagesFrom] = useState<'everyone' | 'connections'>('everyone')
  const [locationPrivacy, setLocationPrivacy] = useState<'city' | 'distance' | 'hidden'>('city')
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [readReceipts, setReadReceipts] = useState(true)

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
                onValueChange={setIsPrivateProfile}
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
                onValueChange={setFollowApproval}
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
              { id: 'connections', label: 'Only Connections' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setMessagesFrom(opt.id as any)}
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
                onPress={() => setLocationPrivacy(opt.id as any)}
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
                onValueChange={setShowOnlineStatus}
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
                onValueChange={setReadReceipts}
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
            <TouchableOpacity style={styles.optionRow}>
              <AppText variant="bodySm" weight="medium">
                Blocked Users
              </AppText>
              <ChevronRight color={Colors.textMuted} size={16} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
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
