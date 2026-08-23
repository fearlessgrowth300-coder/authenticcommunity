import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import { supabase } from '@/services/supabase'
import { loadUserPreferences, resetMyRecommendations, saveUserPreferences } from '@/services/preferences'
import {
  ArrowLeft,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react-native'

export default function ContentDiscoverySettingsScreen() {
  const router = useRouter()

  const [discoveryArea, setDiscoveryArea] = useState<'nearby' | 'country' | 'worldwide'>('nearby')
  const [feedBalance, setFeedBalance] = useState<'local_first' | 'balanced' | 'global_heavy'>('local_first')
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true)
  const [explorationEnabled, setExplorationEnabled] = useState(true)

  const [myInterests, setMyInterests] = useState<Array<{ id: string; name: string; strength: string }>>([])

  const [learnedInterests, setLearnedInterests] = useState<Array<{ id: string; name: string; strength: 'High' | 'Medium' | 'Low' }>>([])

  useEffect(() => {
    Promise.all([supabase.auth.getUser(), loadUserPreferences()]).then(async ([auth, preferences]) => {
      setDiscoveryArea(preferences.discoveryArea)
      setFeedBalance(preferences.feedBalance)
      setPersonalizationEnabled(preferences.personalizationEnabled)
      setExplorationEnabled(preferences.explorationEnabled)
      setLearnedInterests(preferences.learnedInterests)
      if (auth.data.user) {
        const { data } = await supabase
          .from('user_interests')
          .select('id, interest_name, proficiency_level')
          .eq('user_id', auth.data.user.id)
        setMyInterests((data || []).map((row: any) => ({
          id: row.id,
          name: row.interest_name,
          strength: row.proficiency_level === 'expert' ? 'High' : row.proficiency_level === 'experienced' ? 'Medium' : 'Low',
        })))
      }
    })
  }, [])

  const handleRemoveLearned = (id: string) => {
    setLearnedInterests((prev) => {
      const next = prev.filter((interest) => interest.id !== id)
      saveUserPreferences({ learnedInterests: next }).catch(() => {})
      return next
    })
  }

  const handleResetAlgorithm = () => {
    Alert.alert(
      'Reset Recommendations?',
      'This will clear your learned engagement signals and reset your feed back to fresh local discovery based on your selected interests and values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const { data: auth } = await supabase.auth.getUser()
            if (!auth.user) return
            const [reset, dismissals] = await Promise.all([
              resetMyRecommendations().then(() => ({ error: null as Error | null })).catch((error) => ({ error: error as Error })),
              (supabase as any).from('content_dismissals').delete().eq('user_id', auth.user.id),
            ])
            if (reset.error || dismissals.error) {
              Alert.alert('Reset Failed', reset.error?.message || dismissals.error?.message || 'Please try again.')
              return
            }
            setLearnedInterests([])
            Alert.alert('Reset Complete', 'Your recommendation history has been cleared.')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Content & Discovery
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Transparent Discovery Note */}
        <Card style={styles.noticeCard}>
          <Sparkles color={Colors.primary} size={18} />
          <AppText variant="caption" color={Colors.textSecondary} style={styles.noticeText}>
            You have full control over what appears in your feed and who you discover.
          </AppText>
        </Card>

        {/* 1. Discovery Area */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Discovery Area
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            Choose the default geographic scope for match recommendations.
          </AppText>

          <View style={styles.pillGroup}>
            {[
              { id: 'nearby', label: 'Nearby (Local First)' },
              { id: 'country', label: 'My Country' },
              { id: 'worldwide', label: 'Worldwide' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  const value = item.id as 'nearby' | 'country' | 'worldwide'
                  setDiscoveryArea(value)
                  saveUserPreferences({ discoveryArea: value }).catch(() => Alert.alert('Could Not Save', 'Please try again.'))
                }}
                style={[
                  styles.pillBtn,
                  discoveryArea === item.id ? styles.pillBtnActive : null,
                ]}
              >
                <AppText
                  variant="bodySm"
                  weight={discoveryArea === item.id ? 'bold' : 'normal'}
                  color={discoveryArea === item.id ? '#FFFFFF' : Colors.text}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Feed Balance */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Feed Balance
          </AppText>
          <AppText variant="caption" color={Colors.textSecondary}>
            Adjust how strongly your Home feed prioritizes local vs global content.
          </AppText>

          <View style={styles.pillGroup}>
            {[
              { id: 'local_first', label: 'Local-First' },
              { id: 'balanced', label: 'Balanced' },
              { id: 'global_heavy', label: 'Global-Heavy' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  const value = item.id as 'local_first' | 'balanced' | 'global_heavy'
                  setFeedBalance(value)
                  saveUserPreferences({ feedBalance: value }).catch(() => Alert.alert('Could Not Save', 'Please try again.'))
                }}
                style={[
                  styles.pillBtn,
                  feedBalance === item.id ? styles.pillBtnActive : null,
                ]}
              >
                <AppText
                  variant="bodySm"
                  weight={feedBalance === item.id ? 'bold' : 'normal'}
                  color={feedBalance === item.id ? '#FFFFFF' : Colors.text}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <AppText variant="label" weight="bold">Personalized Recommendations</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Use your selected interests and safe activity signals to improve recommendations.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Personalized recommendations"
              value={personalizationEnabled}
              onValueChange={(value) => {
                setPersonalizationEnabled(value)
                saveUserPreferences({ personalizationEnabled: value }).catch(() => {
                  setPersonalizationEnabled(!value)
                  Alert.alert('Could Not Save', 'Please try again.')
                })
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={personalizationEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <AppText variant="label" weight="bold">Discovery & Exploration</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Include a small amount of adjacent content so your feed stays useful and varied.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Discovery and exploration recommendations"
              value={explorationEnabled}
              onValueChange={(value) => {
                setExplorationEnabled(value)
                saveUserPreferences({ explorationEnabled: value }).catch(() => {
                  setExplorationEnabled(!value)
                  Alert.alert('Could Not Save', 'Please try again.')
                })
              }}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={explorationEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>
        </View>

        {/* 3. Your Interests */}
        <View style={styles.section}>
          <AppText variant="label" weight="bold">
            Your Chosen Interests
          </AppText>
          <View style={styles.itemsList}>
            {myInterests.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <AppText variant="bodySm" weight="medium">
                  {item.name}
                </AppText>
                <View style={styles.strengthBadge}>
                  <AppText variant="caption" weight="bold" color={Colors.primary}>
                    {item.strength}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Learned Interests */}
        {learnedInterests.length > 0 && (
          <View style={styles.section}>
            <AppText variant="label" weight="bold">
              Learned Topics from Engagement
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              Topics inferred from posts and communities you interacted with.
            </AppText>
            <View style={styles.itemsList}>
              {learnedInterests.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <AppText variant="bodySm" weight="medium">
                    {item.name}
                  </AppText>
                  <View style={styles.learnedRight}>
                    <View style={styles.strengthBadge}>
                      <AppText variant="caption" color={Colors.textSecondary}>
                        {item.strength}
                      </AppText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveLearned(item.id)}
                      style={styles.removeBtn}
                      accessibilityLabel="Remove learned topic"
                    >
                      <X color={Colors.textMuted} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Reset Recommendations Button */}
        <View style={styles.resetSection}>
          <AppButton
            title="Reset Recommendations Algorithm"
            variant="danger"
            leftIcon={<RefreshCw color="#FFFFFF" size={16} />}
            onPress={handleResetAlgorithm}
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
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  noticeText: {
    flex: 1,
    lineHeight: 18,
  },
  section: {
    gap: 8,
  },
  pillGroup: {
    gap: 8,
    marginTop: 4,
  },
  pillBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemsList: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  strengthBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  learnedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  removeBtn: {
    padding: 4,
  },
  resetSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
})
