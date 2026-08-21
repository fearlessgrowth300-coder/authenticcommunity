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
import { Card } from '@/components/primitives/Card'
import { loadNotificationPreferences, saveNotificationPreference } from '@/services/preferences'
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Sparkles,
  Calendar,
  Compass,
  UserPlus,
  CircleDashed,
  Mail,
} from 'lucide-react-native'

export default function NotificationSettingsScreen() {
  const router = useRouter()

  const [directMessages, setDirectMessages] = useState(true)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [eventReminders, setEventReminders] = useState(true)
  const [communityAnnouncements, setCommunityAnnouncements] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [followers, setFollowers] = useState(true)
  const [stories, setStories] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)

  useEffect(() => {
    loadNotificationPreferences().then((settings) => {
      if (!settings) return
      setDirectMessages(settings.notify_messages ?? true)
      setMatchAlerts(settings.notify_matches ?? true)
      setEventReminders(settings.notify_events ?? true)
      setCommunityAnnouncements(settings.notify_communities ?? true)
      setEmailDigest(settings.notify_digest ?? false)
      setFollowers(settings.notify_followers ?? true)
      setStories(settings.notify_stories ?? true)
      setPushEnabled(settings.push_notifications ?? true)
      setEmailEnabled(settings.email_notifications ?? true)
    })
  }, [])

  const persist = (field: string, value: boolean, setter: (value: boolean) => void) => {
    setter(value)
    saveNotificationPreference(field, value).catch(() => {
      setter(!value)
      Alert.alert('Could Not Save', 'Please try again.')
    })
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Notifications
        </AppText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.sectionCard}>
          <AppText variant="bodySm" weight="bold" style={{ marginBottom: 12 }}>
            Push Notifications
          </AppText>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <MessageSquare color={Colors.primary} size={18} />
                <AppText variant="bodySm" weight="medium">
                  Direct Messages & Requests
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Notify when you receive a new direct chat or message request
              </AppText>
            </View>
            <Switch
              value={directMessages}
              onValueChange={(value) => persist('notify_messages', value, setDirectMessages)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <UserPlus color={Colors.sage} size={18} />
                <AppText variant="bodySm" weight="medium">New Followers</AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>Know when someone follows you</AppText>
            </View>
            <Switch value={followers} onValueChange={(value) => persist('notify_followers', value, setFollowers)} trackColor={{ false: '#CBD5E1', true: Colors.primary }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <CircleDashed color={Colors.coral} size={18} />
                <AppText variant="bodySm" weight="medium">Stories</AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>Replies and activity on your stories</AppText>
            </View>
            <Switch value={stories} onValueChange={(value) => persist('notify_stories', value, setStories)} trackColor={{ false: '#CBD5E1', true: Colors.primary }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <Sparkles color={Colors.coral} size={18} />
                <AppText variant="bodySm" weight="medium">
                  High-Fit Match Alerts
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Weekly alerts when new members with 85%+ compatibility join
              </AppText>
            </View>
            <Switch
              value={matchAlerts}
              onValueChange={(value) => persist('notify_matches', value, setMatchAlerts)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <Calendar color={Colors.amber} size={18} />
                <AppText variant="bodySm" weight="medium">
                  Event Reminders
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Reminders for meetups you have RSVP'd to attend
              </AppText>
            </View>
            <Switch
              value={eventReminders}
              onValueChange={(value) => persist('notify_events', value, setEventReminders)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}>
                <Compass color={Colors.sage} size={18} />
                <AppText variant="bodySm" weight="medium">
                  Community Announcements
                </AppText>
              </View>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                Important pinned announcements in your joined hubs
              </AppText>
            </View>
            <Switch
              value={communityAnnouncements}
              onValueChange={(value) => persist('notify_communities', value, setCommunityAnnouncements)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <AppText variant="bodySm" weight="bold" style={{ marginBottom: 12 }}>Delivery</AppText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}><Bell color={Colors.primary} size={18} /><AppText variant="bodySm" weight="medium">Push Notifications</AppText></View>
              <AppText variant="caption" color={Colors.textSecondary}>Instant alerts on this device</AppText>
            </View>
            <Switch value={pushEnabled} onValueChange={(value) => persist('push_notifications', value, setPushEnabled)} trackColor={{ false: '#CBD5E1', true: Colors.primary }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <View style={styles.iconTitleRow}><Mail color={Colors.sage} size={18} /><AppText variant="bodySm" weight="medium">Email Notifications</AppText></View>
              <AppText variant="caption" color={Colors.textSecondary}>Receive enabled updates by email</AppText>
            </View>
            <Switch value={emailEnabled} onValueChange={(value) => persist('email_notifications', value, setEmailEnabled)} trackColor={{ false: '#CBD5E1', true: Colors.primary }} />
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <AppText variant="bodySm" weight="bold" style={{ marginBottom: 12 }}>
            Email Notifications
          </AppText>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <AppText variant="bodySm" weight="medium">
                Weekly Community Digest
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 2 }}>
                A curated summary of top local events and active discussions
              </AppText>
            </View>
            <Switch
              value={emailDigest}
              onValueChange={(value) => persist('notify_digest', value, setEmailDigest)}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
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
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 16,
  },
  sectionCard: {
    padding: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
})
