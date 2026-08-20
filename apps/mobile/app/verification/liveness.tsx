import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  ArrowLeft,
  Camera,
  Smile,
  ShieldCheck,
} from 'lucide-react-native'

export default function VerificationLivenessScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'position' | 'processing' | 'done'>('position')

  const handleStartCheck = () => {
    setStep('processing')
    setTimeout(() => {
      setStep('done')
      setTimeout(() => {
        router.replace('/verification/result')
      }, 1000)
    }, 2000)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Face Liveness Check
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Center Face Circle Camera Outline */}
        <View style={styles.faceCircleOutline}>
          <View style={styles.faceCircleInner}>
            {step === 'processing' ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : step === 'done' ? (
              <ShieldCheck color={Colors.sage} size={54} />
            ) : (
              <Smile color={Colors.primary} size={64} />
            )}
          </View>
        </View>

        {/* Guidance Prompt */}
        <View style={styles.promptContainer}>
          <AppText variant="h2" weight="bold" align="center">
            {step === 'processing'
              ? 'Verifying Liveness...'
              : step === 'done'
              ? 'Liveness Confirmed ✓'
              : 'Position Your Face in the Circle'}
          </AppText>
          <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.subText}>
            {step === 'processing'
              ? 'Please hold still while we verify your biometrics.'
              : step === 'done'
              ? 'Analyzing encrypted identity credentials...'
              : 'Ensure good lighting and look directly into the camera.'}
          </AppText>
        </View>
      </View>

      {/* Bottom Button */}
      {step === 'position' && (
        <View style={styles.bottomBar}>
          <AppButton
            title="I'm Ready · Start Scan"
            onPress={handleStartCheck}
            style={styles.actionBtn}
          />
        </View>
      )}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
  },
  faceCircleOutline: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 4,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  faceCircleInner: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptContainer: {
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  subText: {
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  actionBtn: {
    width: '100%',
  },
})
