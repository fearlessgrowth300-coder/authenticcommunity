import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Image,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { StepIndicator } from '@/components/onboarding/StepIndicator'
import { Card } from '@/components/primitives/Card'
import { MapPin, Search, X, Lock, Navigation, CheckCircle2 } from 'lucide-react-native'

const DISTANCE_OPTIONS = ['5 mi', '10 mi', '25 mi', '50 mi', '100+ mi']

export default function OnboardingLocationScreen() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()

  const [searchQuery, setSearchQuery] = useState(
    profile?.location_city
      ? [profile.location_city, profile.location_state, profile.location_country].filter(Boolean).join(', ')
      : ''
  )
  const [city, setCity] = useState(profile?.location_city || '')
  const [state, setState] = useState(profile?.location_state || '')
  const [country, setCountry] = useState(profile?.location_country || '')
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  })

  const [selectedDistance, setSelectedDistance] = useState('10 mi')
  const [showCityOnly, setShowCityOnly] = useState(true)

  const [detecting, setDetecting] = useState(false)
  const [detectedNotice, setDetectedNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect if location permission was already granted previously
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((permission) => {
        if (permission.granted && !city) {
          detectLocation()
        }
      })
      .catch(() => {})
  }, [])

  const detectLocation = async () => {
    setDetecting(true)
    setError(null)
    setDetectedNotice(null)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) {
        setDetectedNotice('Location access denied. Please type your city above.')
        setDetecting(false)
        return
      }

      let locationObj = await Location.getLastKnownPositionAsync()
      if (!locationObj) {
        locationObj = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
      }

      if (locationObj?.coords) {
        const { latitude, longitude } = locationObj.coords
        setCoords({ latitude, longitude })

        const addresses = await Location.reverseGeocodeAsync({ latitude, longitude })
        if (addresses && addresses.length > 0) {
          const addr = addresses[0]
          const detectedCity = addr.city || addr.subregion || addr.district || addr.name || ''
          const detectedState = addr.region || addr.subregion || ''
          const detectedCountry = addr.country || ''

          if (detectedCity) setCity(detectedCity)
          if (detectedState) setState(detectedState)
          if (detectedCountry) setCountry(detectedCountry)

          const fullString = [detectedCity, detectedState, detectedCountry].filter(Boolean).join(', ')
          setSearchQuery(fullString)
          setDetectedNotice('Location detected automatically ✓')
        }
      }
    } catch {
      setDetectedNotice('Could not detect location. You can type it in directly.')
    } finally {
      setDetecting(false)
    }
  }

  const handleNext = async () => {
    if (!city.trim() && !searchQuery.trim()) {
      setError('Please enter or select your city to continue.')
      return
    }

    if (!user) {
      setError('Authentication required.')
      return
    }

    let finalCity = city.trim()
    let finalState = state.trim()
    let finalCountry = country.trim()

    if (!finalCity && searchQuery.trim()) {
      const parts = searchQuery.split(',').map((p) => p.trim())
      finalCity = parts[0] || searchQuery.trim()
      finalState = parts[1] || ''
      finalCountry = parts[2] || 'United States'
    }

    setError(null)
    setLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            location_city: finalCity,
            location_state: finalState || null,
            location_country: finalCountry || null,
            latitude: coords.latitude,
            longitude: coords.longitude,
            is_active: true,
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
          {/* Step Indicator Header (1 ── 2 ── 3 ── 4) */}
          <StepIndicator currentStep={1} />

          {/* Title & Subtitle */}
          <View style={styles.header}>
            <AppText variant="h2" weight="bold" style={styles.title}>
              Where are you based?
            </AppText>
            <AppText variant="body" color={Colors.textSecondary}>
              We'll show you events and people nearby.
            </AppText>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <AppText variant="caption" color={Colors.danger}>
                {error}
              </AppText>
            </View>
          )}

          {/* Search / Location Input Bar */}
          <View style={styles.searchBarContainer}>
            <Search color={Colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={(text: string) => {
                setSearchQuery(text)
                setCity(text.split(',')[0]?.trim() || '')
              }}
              placeholder="Search for your city"
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="words"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('')
                  setCity('')
                  setState('')
                  setCountry('')
                  setDetectedNotice(null)
                }}
                style={styles.clearButton}
              >
                <X color={Colors.textMuted} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Auto-Detect Action Button */}
          <TouchableOpacity
            onPress={detectLocation}
            disabled={detecting}
            style={styles.detectButton}
          >
            {detecting ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Navigation color={Colors.primary} size={16} />
            )}
            <AppText variant="caption" weight="semibold" color={Colors.primary}>
              {detecting ? 'Detecting current position...' : 'Use my current location'}
            </AppText>
          </TouchableOpacity>

          {detectedNotice && (
            <View style={styles.noticeBox}>
              <CheckCircle2 color={Colors.sage} size={14} />
              <AppText variant="caption" color={Colors.sage}>
                {detectedNotice}
              </AppText>
            </View>
          )}

          {/* Map Card with City Map Image & Translucent Radius Overlay matching reference */}
          <View style={styles.mapCard}>
            <Image
              source={require('../../assets/city_map.jpg')}
              style={styles.mapBackgroundImage}
              resizeMode="cover"
            />

            {/* Discovery Radius Translucent Circle Overlay */}
            <View style={styles.mapRadiusCircle}>
              {/* Center Map Pin Badge */}
              <View style={styles.centerPinBadge}>
                <MapPin color="#FFFFFF" size={18} />
              </View>
            </View>

            {/* Street/District watermark labels matching reference style */}
            <View style={styles.mapLabelContainer}>
              <AppText variant="caption" weight="semibold" color="#4B5563" style={styles.mapAreaLabel}>
                {city ? `${city.toUpperCase()} AREA` : 'EAST AUSTIN'}
              </AppText>
            </View>
          </View>

          {/* Distance Selection */}
          <View style={styles.section}>
            <AppText variant="label" weight="medium" style={styles.sectionTitle}>
              How far are you open to connect?
            </AppText>
            <View style={styles.distancePillsRow}>
              {DISTANCE_OPTIONS.map((dist) => {
                const isSelected = selectedDistance === dist
                return (
                  <TouchableOpacity
                    key={dist}
                    onPress={() => setSelectedDistance(dist)}
                    style={[
                      styles.distancePill,
                      isSelected ? styles.distancePillActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight={isSelected ? 'bold' : 'normal'}
                      color={isSelected ? Colors.surface : Colors.textSecondary}
                    >
                      {dist}
                    </AppText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Privacy Toggle Card */}
          <Card style={styles.privacyCard}>
            <View style={styles.privacyLeft}>
              <View style={styles.lockCircle}>
                <Lock color={Colors.sage} size={16} />
              </View>
              <View style={styles.privacyTextContainer}>
                <AppText variant="bodySm" weight="semibold">
                  Show my city not exact location
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  Your precise location will stay private.
                </AppText>
              </View>
            </View>
            <Switch
              value={showCityOnly}
              onValueChange={setShowCityOnly}
              trackColor={{ false: Colors.border, true: Colors.sage }}
              thumbColor={Colors.surface}
            />
          </Card>

          {/* Continue Button */}
          <AppButton
            title="Continue"
            onPress={handleNext}
            loading={loading}
            style={styles.continueButton}
          />
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
  header: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: Colors.coralLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.sageLight,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.md,
  },
  mapCard: {
    height: 190,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#E5E7EB',
  },
  mapBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  mapRadiusCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(79, 70, 229, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(79, 70, 229, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  mapLabelContainer: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mapAreaLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  distancePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  distancePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  distancePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  lockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTextContainer: {
    flex: 1,
  },
  continueButton: {
    marginBottom: Spacing.xl,
  },
})
