import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  UploadCloud,
  Navigation,
  Globe,
  Lock,
} from 'lucide-react-native'

const CATEGORIES = [
  'Outdoors',
  'Wellness',
  'Learning',
  'Faith',
  'Arts & Culture',
  'Technology',
  'Food',
  'Music',
]

export default function CreateCommunityScreen() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Outdoors')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [location, setLocation] = useState('Austin, Texas, USA')
  const [privacy, setPrivacy] = useState<'Public' | 'Private'>('Public')
  const [showPrivacyPicker, setShowPrivacyPicker] = useState(false)
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const handlePickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri)
    }
  }

  const handleContinue = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1)
    } else {
      router.replace('/(tabs)/explore')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold" style={styles.headerTitle}>
          Create Your Community
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step Progress Circles (1 to 5) */}
        <View style={styles.stepProgressContainer}>
          {[1, 2, 3, 4, 5].map((step, idx) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.stepCircle,
                  step <= currentStep ? styles.stepCircleActive : null,
                ]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  color={step <= currentStep ? Colors.surface : Colors.textMuted}
                >
                  {step}
                </AppText>
              </View>
              {idx < 4 && (
                <View
                  style={[
                    styles.stepLine,
                    step < currentStep ? styles.stepLineActive : null,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.stepSubtitle}>
          Let's build a space where people belong.
        </AppText>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Community Name */}
          <View style={styles.fieldGroup}>
            <AppText variant="label" weight="semibold">
              Community Name
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Austin Coffee Connect"
              placeholderTextColor={Colors.textMuted}
              style={styles.textInput}
            />
          </View>

          {/* Category Selector */}
          <View style={styles.fieldGroup}>
            <AppText variant="label" weight="semibold">
              Category
            </AppText>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              style={styles.selectTrigger}
            >
              <AppText variant="bodySm" color={category ? Colors.text : Colors.textMuted}>
                {category || 'Select a category'}
              </AppText>
              <ChevronRight color={Colors.textMuted} size={18} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryDropdown}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat)
                      setShowCategoryPicker(false)
                    }}
                    style={styles.categoryOption}
                  >
                    <AppText
                      variant="bodySm"
                      weight={category === cat ? 'bold' : 'normal'}
                      color={category === cat ? Colors.primary : Colors.text}
                    >
                      {cat}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <AppText variant="label" weight="semibold">
              Location
            </AppText>
            <View style={styles.inputWithIcon}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Austin, Texas, USA"
                placeholderTextColor={Colors.textMuted}
                style={styles.inputInner}
              />
              <TouchableOpacity style={styles.iconInside}>
                <Navigation color={Colors.primary} size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Privacy */}
          <View style={styles.fieldGroup}>
            <AppText variant="label" weight="semibold">
              Privacy
            </AppText>
            <TouchableOpacity
              onPress={() => setShowPrivacyPicker(!showPrivacyPicker)}
              style={styles.selectTrigger}
            >
              <View style={styles.privacyOptionRow}>
                {privacy === 'Public' ? (
                  <Globe color={Colors.primary} size={18} />
                ) : (
                  <Lock color={Colors.primary} size={18} />
                )}
                <View>
                  <AppText variant="bodySm" weight="medium">
                    {privacy}
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    {privacy === 'Public'
                      ? 'Anyone can find and join'
                      : 'Requires invite or request'}
                  </AppText>
                </View>
              </View>
              <ChevronDown color={Colors.textMuted} size={18} />
            </TouchableOpacity>

            {showPrivacyPicker && (
              <View style={styles.categoryDropdown}>
                <TouchableOpacity
                  onPress={() => {
                    setPrivacy('Public')
                    setShowPrivacyPicker(false)
                  }}
                  style={styles.categoryOption}
                >
                  <AppText variant="bodySm" weight="bold">
                    Public
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Anyone can find and join
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPrivacy('Private')
                    setShowPrivacyPicker(false)
                  }}
                  style={styles.categoryOption}
                >
                  <AppText variant="bodySm" weight="bold">
                    Private
                  </AppText>
                  <AppText variant="caption" color={Colors.textSecondary}>
                    Requires approval to join
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Upload a Photo */}
          <View style={styles.fieldGroup}>
            <AppText variant="label" weight="semibold">
              Upload a Photo
            </AppText>
            <TouchableOpacity
              onPress={handlePickPhoto}
              style={styles.uploadBox}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.uploadedPreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <UploadCloud color={Colors.primary} size={32} />
                  <AppText variant="bodySm" weight="medium" color={Colors.primary} style={styles.uploadTitle}>
                    Tap to upload a photo
                  </AppText>
                  <AppText variant="caption" color={Colors.textMuted}>
                    JPG or PNG · Max 5MB
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <AppButton
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.saveDraftButton}
          >
            <AppText variant="bodySm" color={Colors.textSecondary}>
              Save Draft
            </AppText>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  stepProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  stepSubtitle: {
    marginBottom: Spacing.xl,
  },
  formSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  fieldGroup: {
    gap: 6,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  privacyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  iconInside: {
    padding: 6,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    gap: 4,
  },
  uploadTitle: {
    marginTop: 4,
  },
  uploadedPreview: {
    width: '100%',
    height: '100%',
  },
  bottomActions: {
    gap: 12,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  continueButton: {
    width: '100%',
  },
  saveDraftButton: {
    paddingVertical: 8,
  },
})
