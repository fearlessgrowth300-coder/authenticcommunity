import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  X,
  Check,
  User,
  Compass,
  Users,
  MessageCircle,
  Calendar,
  ChevronRight,
} from 'lucide-react-native'

export default function QuickStartGuideScreen() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<number>(3)

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h2" weight="bold">
          Quick Start Guide
        </AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color={Colors.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText variant="body" color={Colors.textSecondary} style={styles.subtitle}>
          Complete these steps to get the most out of Authentic Community Connection.
        </AppText>

        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <AppText variant="bodySm" weight="semibold" color={Colors.primary} style={styles.progressText}>
            2 of 5 completed
          </AppText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
        </View>

        {/* Steps List */}
        <View style={styles.stepsList}>
          {/* Step 1: Complete Profile (Completed) */}
          <TouchableOpacity
            style={styles.stepCard}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.stepNumberBadge, styles.stepCompletedBadge]}>
              <Check color={Colors.surface} size={14} strokeWidth={3} />
            </View>
            <View style={styles.stepIconBox}>
              <User color={Colors.primary} size={20} />
            </View>
            <View style={styles.stepContent}>
              <AppText variant="bodySm" weight="bold">
                Complete Your Profile
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Add a photo, bio, and interests to help others find you.
              </AppText>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>

          {/* Step 2: Discover Matches (Completed) */}
          <TouchableOpacity
            style={styles.stepCard}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <View style={[styles.stepNumberBadge, styles.stepCompletedBadge]}>
              <Check color={Colors.surface} size={14} strokeWidth={3} />
            </View>
            <View style={[styles.stepIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Compass color="#16A34A" size={20} />
            </View>
            <View style={styles.stepContent}>
              <AppText variant="bodySm" weight="bold">
                Discover Matches
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Explore people we think you'll connect with.
              </AppText>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>

          {/* Step 3: Join a Community (Current/Expanded) */}
          <View style={[styles.stepCard, styles.stepCardExpanded]}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepNumberBadge, styles.stepCurrentBadge]}>
                <AppText variant="caption" weight="bold" color={Colors.surface}>
                  3
                </AppText>
              </View>
              <View style={[styles.stepIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Users color="#9333EA" size={20} />
              </View>
              <View style={styles.stepContent}>
                <AppText variant="bodySm" weight="bold">
                  Join a Community
                </AppText>
                <AppText variant="caption" color={Colors.textSecondary}>
                  Find your people by joining a community you love.
                </AppText>
              </View>
            </View>

            <AppButton
              title="Explore Communities"
              onPress={() => router.push('/(tabs)/explore')}
              style={styles.actionButton}
            />
          </View>

          {/* Step 4: Send First Message */}
          <TouchableOpacity
            style={styles.stepCard}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <View style={styles.stepNumberBadge}>
              <AppText variant="caption" weight="bold" color={Colors.textMuted}>
                4
              </AppText>
            </View>
            <View style={styles.stepIconBox}>
              <MessageCircle color={Colors.textSecondary} size={20} />
            </View>
            <View style={styles.stepContent}>
              <AppText variant="bodySm" weight="bold">
                Send Your First Message
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Start a conversation and build real connections.
              </AppText>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>

          {/* Step 5: RSVP to an Event */}
          <TouchableOpacity
            style={styles.stepCard}
            onPress={() => router.push('/(tabs)/events')}
          >
            <View style={styles.stepNumberBadge}>
              <AppText variant="caption" weight="bold" color={Colors.textMuted}>
                5
              </AppText>
            </View>
            <View style={[styles.stepIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Calendar color="#D97706" size={20} />
            </View>
            <View style={styles.stepContent}>
              <AppText variant="bodySm" weight="bold">
                RSVP to an Event
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Join an event and meet people in real life.
              </AppText>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>

        {/* Footer Encouragement */}
        <View style={styles.footer}>
          <AppText variant="bodySm" weight="semibold" color={Colors.textSecondary} align="center">
            You're doing great! Keep going! ❤️
          </AppText>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  subtitle: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: Spacing.xl,
  },
  progressText: {
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  stepsList: {
    gap: 12,
    marginBottom: Spacing.xl,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepCardExpanded: {
    flexDirection: 'column',
    alignItems: 'stretch',
    borderColor: Colors.primary,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCompletedBadge: {
    backgroundColor: Colors.sage,
  },
  stepCurrentBadge: {
    backgroundColor: Colors.primary,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  actionButton: {
    marginTop: 4,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
})
