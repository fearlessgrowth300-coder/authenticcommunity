import React, { useEffect, useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/services/supabase'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import { Card } from '@/components/primitives/Card'
import {
  BadgeCheck,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react-native'

export default function VerificationResultScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const [status, setStatus] = useState<'loading' | 'verified' | 'pending' | 'retry' | 'failed' | 'expired' | 'revoked'>('loading')
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)
  useEffect(() => {
    if (!user) return
    ;(supabase as any)
      .from('identity_verifications')
      .select('status, identity_verified, verified_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.status === 'verified' && data?.identity_verified) { setStatus('verified'); setVerifiedAt(data.verified_at || null) }
        else if (['pending', 'manual_review'].includes(data?.status)) setStatus('pending')
        else if (['failed', 'expired', 'revoked'].includes(data?.status)) setStatus(data.status)
        else setStatus('retry')
      })
  }, [user])

  const handleFinish = () => {
    router.replace('/(tabs)/profile')
  }

  const title = status === 'verified' ? 'Identity Verified!' : status === 'pending' ? 'Verification Pending' : status === 'expired' ? 'Verification Expired' : status === 'revoked' ? 'Verification Revoked' : status === 'failed' ? 'Verification Failed' : 'Verification Needs Attention'
  const isSuccess = status === 'verified'
  const isPending = status === 'pending'

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {status === 'loading' ? <ActivityIndicator size="large" color={Colors.primary} /> : <View style={[styles.successCircle, !isSuccess && styles.attentionCircle]}>
          {isSuccess ? <BadgeCheck color={Colors.sage} size={64} strokeWidth={2} /> : isPending ? <Clock color={Colors.amber} size={58} /> : <AlertCircle color={Colors.danger} size={58} />}
        </View>}

        <AppText variant="h1" weight="bold" align="center">
          {status === 'loading' ? 'Checking Verification…' : title}
        </AppText>

        <AppText variant="bodySm" color={Colors.textSecondary} align="center" style={styles.subText}>
          {status === 'verified'
            ? 'Your verified badge is active across your profile and community messages.'
            : status === 'pending'
            ? 'Your secure verification was submitted. We will notify you after the provider or safety team completes review.'
            : status === 'revoked'
            ? 'Your verified badge was revoked after a safety review. Contact support if you believe this is an error.'
            : status === 'expired'
            ? 'Your verification session expired before completion. Start a new secure check.'
            : 'We could not confirm a completed verification. Please retry when you are ready.'}
        </AppText>

        <Card style={styles.badgeSummaryCard}>
          <View style={styles.badgeSummaryRow}>
            <ShieldCheck color={Colors.primary} size={22} />
            <View style={styles.badgeSummaryText}>
              <AppText variant="bodySm" weight="bold">
                {status === 'verified' ? 'Authentic Verified Member' : status === 'pending' ? 'Pending Provider Review' : 'Not Yet Verified'}
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                {status === 'verified' ? `Verified on ${verifiedAt ? new Date(verifiedAt).toLocaleDateString() : 'provider approval'}` : 'No badge is shown until approval'}
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.bottomBar}>
        <AppButton
          title={['retry', 'failed', 'expired'].includes(status) ? 'Retry Verification' : 'Back to My Profile'}
          onPress={['retry', 'failed', 'expired'].includes(status) ? () => router.replace('/verification/country') : handleFinish}
          style={styles.finishBtn}
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  attentionCircle: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  subText: {
    lineHeight: 21,
    paddingHorizontal: Spacing.md,
  },
  badgeSummaryCard: {
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    marginTop: Spacing.lg,
    width: '100%',
  },
  badgeSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeSummaryText: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  finishBtn: {
    width: '100%',
  },
})
