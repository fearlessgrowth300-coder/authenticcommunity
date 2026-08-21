import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Lock,
} from 'lucide-react-native'

const DOC_TYPES = [
  { id: 'passport', title: 'Passport', sub: 'Photo page with clear details' },
  { id: 'national_id', title: 'National Identity Card', sub: 'Front and back card' },
  { id: 'drivers_license', title: "Driver's License", sub: 'Government issued photo license' },
]

export default function VerificationDocumentScreen() {
  const router = useRouter()
  const { country = 'NG' } = useLocalSearchParams<{ country?: string }>()
  const [selectedType, setSelectedType] = useState('passport')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)

  const handleCapture = async () => {
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    })
    if (!res.canceled && res.assets[0]) {
      setCapturedPhoto(res.assets[0].uri)
    }
  }

  const handleNext = () => {
    router.push(`/verification/liveness?country=${country}&documentType=${selectedType}`)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          ID Document
        </AppText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppText variant="bodySm" color={Colors.textSecondary} style={styles.subText}>
          Select your document type and capture a clear, un-obscured photo.
        </AppText>

        {/* Document Type Selector */}
        <View style={styles.docTypesList}>
          {DOC_TYPES.map((doc) => {
            const isSelected = selectedType === doc.id
            return (
              <TouchableOpacity
                key={doc.id}
                onPress={() => setSelectedType(doc.id)}
                style={[
                  styles.docTypeCard,
                  isSelected ? styles.docTypeActive : null,
                ]}
              >
                <View style={styles.docTypeInfo}>
                  <AppText variant="bodySm" weight="bold">
                    {doc.title}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {doc.sub}
                  </AppText>
                </View>
                {isSelected && <CheckCircle2 color={Colors.primary} size={20} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Camera Capture Box */}
        <View style={styles.captureBox}>
          {capturedPhoto ? (
            <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} resizeMode="cover" />
          ) : (
            <TouchableOpacity onPress={handleCapture} style={styles.cameraPlaceholder}>
              <View style={styles.cameraCircle}>
                <Camera color={Colors.primary} size={28} />
              </View>
              <AppText variant="bodySm" weight="bold" color={Colors.primary}>
                Take Photo of Document
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} align="center">
                Ensure text is readable with no glare or shadows
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {capturedPhoto && (
          <TouchableOpacity onPress={handleCapture} style={styles.retakeBtn}>
            <AppText variant="caption" weight="bold" color={Colors.primary}>
              Retake Photo
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomBar}>
        <AppButton
          title="Continue to Liveness Check"
          disabled={!capturedPhoto}
          onPress={handleNext}
          style={styles.continueBtn}
        />
      </View>
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
    paddingBottom: 100,
    gap: Spacing.md,
  },
  subText: {
    marginBottom: Spacing.xs,
  },
  docTypesList: {
    gap: 8,
  },
  docTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docTypeActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF2FF',
  },
  docTypeInfo: {
    flex: 1,
    gap: 2,
  },
  captureBox: {
    width: '100%',
    height: 220,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: 6,
  },
  cameraCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  retakeBtn: {
    alignSelf: 'center',
    padding: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueBtn: {
    width: '100%',
  },
})
