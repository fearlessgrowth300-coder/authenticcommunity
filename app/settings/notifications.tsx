import React, { useState } from 'react'
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
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Sparkles,
  Calendar,
  Compass,
} from 'lucide-react-native'

export default function NotificationSettingsScreen() {
  const router = useRouter()

  const [directMessages, setDirectMessages] = useState(true)
  const [matchAlerts, setMatchAlerts] = useState(true)
  const [eventReminders, setEventReminders] = useState(true)
  const [communityAnnouncements, setCommunityAnnouncements] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)

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
              onValueChange={setDirectMessages}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
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
              onValueChange={setMatchAlerts}
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
              onValueChange={setEventReminders}
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
              onValueChange={setCommunityAnnouncements}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
            />
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
              onValueChange={setEmailDigest}
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
