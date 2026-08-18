import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { AppInput } from '@/components/primitives/AppInput'
import { Card } from '@/components/primitives/Card'
import { MapPin, Globe, Navigation, ShieldCheck, CheckCircle } from 'lucide-react-native'

const RADIUS_OPTIONS = [10, 25, 50, 100]

export default function OnboardingLocationScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [city, setCity] = useState(profile?.location_city || '')
  const [state, setState] = useState(profile?.location_state || '')
  const [country, setCountry] = useState(profile?.location_country || '')
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  })
  const [locationSource, setLocationSource] = useState<'device' | 'manual'>('manual')
  const [radiusKm, setRadiusKm] = useState<number>(25)

  const [detecting, setDetecting] = useState(false)
  const [detectedSummary, setDetectedSummary] = useState<string | null>(null)
  const [detectNotice, setDetectNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if location permission was already granted previously
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((permission) => {
        if (permission.granted && !city) {
          detectLocation()
        }
      })
      .catch(() => {
        // Gracefully ignore permission check failure on mount
      })
  }, [])

  const detectLocation = async () => {
    setDetecting(true)
    setError(null)
    setDetectNotice(null)

    try {
      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) {
        setDetectNotice('We couldn\'t access your location. You can enter your city and country manually.')
        setDetecting(false)
        return
      }

      // 2. Try fast last-known location first
      let locationObj = await Location.getLastKnownPositionAsync()
      if (!locationObj) {
        locationObj = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
      }

      if (!locationObj?.coords) {
        setDetectNotice('Could not determine current position. Please enter your location manually.')
        setDetecting(false)
        return
      }

      const { latitude, longitude } = locationObj.coords
      setCoords({ latitude, longitude })

      // 3. Reverse geocode to extract locality components
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (addresses && addresses.length > 0) {
        const addr = addresses[0]
        const detectedCity = addr.city || addr.subregion || addr.district || addr.name || ''
        const detectedState = addr.region || addr.subregion || ''
        const detectedCountry = addr.country || ''

        if (detectedCity) setCity(detectedCity)
        if (detectedState) setState(detectedState)
        if (detectedCountry) setCountry(detectedCountry)

        const summaryParts = [detectedCity, detectedState, detectedCountry].filter(Boolean)
        setDetectedSummary(summaryParts.join(', '))
        setLocationSource('device')
      } else {
        setDetectNotice('Location detected. Please confirm your city name.')
      }
    } catch {
      setDetectNotice('We couldn\'t detect your location. Enter your city and country below.')
    } finally {
      setDetecting(false)
    }
  }

  const handleNext = async () => {
    if (!city.trim() || !country.trim()) {
      setError('Please provide your city and country to discover local connections.')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            location_city: city.trim(),
            location_state: state.trim() || null,
            location_country: country.trim(),
            latitude: coords.latitude,
            longitude: coords.longitude,
            max_distance_km: radiusKm,
            show_location: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (updateError) throw updateError

      await refreshProfile()
      router.push('/(onboarding)/interests')
    } catch (err: any) {
      setError(err?.message || 'Failed to save location.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <AppText variant="caption" color={Colors.primary} weight="semibold">
              Step 1 of 4: Location
            </AppText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '25%' }]} />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Where are you based?
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              We prioritize showing you people, events, and communities nearby.
            </AppText>
          </View>

          {/* Quick Auto-Detect Button */}
          <TouchableOpacity
            onPress={detectLocation}
            disabled={detecting}
            style={styles.autoDetectButton}
            accessibilityLabel="Use current location"
          >
            {detecting ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Navigation color={Colors.primary} size={18} />
            )}
            <AppText variant="bodySm" weight="semibold" color={Colors.primary}>
              {detecting ? 'Finding your location...' : 'Use my current location'}
            </AppText>
          </TouchableOpacity>

          {/* Location Detection Banner */}
          {detectedSummary && (
            <View style={styles.detectedBanner}>
              <View style={styles.detectedHeader}>
                <CheckCircle color={Colors.success} size={16} />
                <AppText variant="bodySm" weight="semibold" color={Colors.success}>
                  Location detected
                </AppText>
              </View>
              <AppText variant="body" weight="medium" style={styles.detectedLocation}>
                {detectedSummary}
              </AppText>
              <AppText variant="caption" color={Colors.textMuted} style={styles.detectedHint}>
                Not quite right? You can edit the fields below.
              </AppText>
            </View>
          )}

          {/* Friendly Detection Failure Notice */}
          {detectNotice && (
            <View style={styles.noticeBanner}>
              <AppText variant="caption" color={Colors.textSecondary}>
                {detectNotice}
              </AppText>
            </View>
          )}

          {/* Form Card */}
          <Card style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <AppText variant="caption" color={Colors.danger}>
                  {error}
                </AppText>
              </View>
            )}

            <AppInput
              label="City"
              placeholder="e.g. Austin, Lagos, Toronto"
              value={city}
              onChangeText={(text: string) => {
                setCity(text)
                setLocationSource('manual')
              }}
              leftIcon={<MapPin color={Colors.textMuted} size={18} />}
            />

            <AppInput
              label="State / Province (Optional)"
              placeholder="e.g. Texas, Ontario, Lagos State"
              value={state}
              onChangeText={(text: string) => {
                setState(text)
                setLocationSource('manual')
              }}
            />

            <AppInput
              label="Country"
              placeholder="e.g. United States, Canada, Nigeria"
              value={country}
              onChangeText={(text: string) => {
                setCountry(text)
                setLocationSource('manual')
              }}
              leftIcon={<Globe color={Colors.textMuted} size={18} />}
            />

            {/* Discovery Radius Selector */}
            <View style={styles.radiusSection}>
              <AppText variant="label" weight="medium" style={styles.radiusLabel}>
                Discovery Radius
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={styles.radiusDesc}>
                Find matches, events, and communities within:
              </AppText>

              <View style={styles.radiusChips}>
                {RADIUS_OPTIONS.map((km) => {
                  const selected = radiusKm === km
                  return (
                    <TouchableOpacity
                      key={km}
                      onPress={() => setRadiusKm(km)}
                      style={[styles.radiusChip, selected ? styles.radiusChipActive : null]}
                    >
                      <AppText
                        variant="bodySm"
                        weight={selected ? 'semibold' : 'normal'}
                        color={selected ? Colors.primaryDark : Colors.textSecondary}
                      >
                        {km} km
                      </AppText>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            {/* Privacy Badge */}
            <View style={styles.privacyBox}>
              <ShieldCheck color={Colors.sage} size={16} />
              <AppText variant="caption" color={Colors.textSecondary} style={styles.privacyText}>
                We only display your city publicly, never your exact address or coordinates.
              </AppText>
            </View>

            <AppButton
              title="Continue"
              onPress={handleNext}
              loading={loading}
              style={styles.submitButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: 4,
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    paddingVertical: 12,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  detectedBanner: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.sage,
    marginBottom: Spacing.md,
  },
  detectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detectedLocation: {
    color: Colors.text,
    marginBottom: 2,
  },
  detectedHint: {
    marginTop: 2,
  },
  noticeBanner: {
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  card: {
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  radiusSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  radiusLabel: {
    marginBottom: 2,
  },
  radiusDesc: {
    marginBottom: 8,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.lg,
  },
  privacyText: {
    flex: 1,
    lineHeight: 16,
  },
  submitButton: {
    marginTop: 4,
  },
})
