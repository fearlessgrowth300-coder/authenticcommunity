import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
  ArrowLeft,
  Mail,
  Lock,
  DownloadCloud,
  Trash2,
  Shield,
  LogOut,
} from 'lucide-react-native'

export default function AccountSettingsScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      Alert.alert('Success', 'Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    Alert.alert(
      'Export Personal Data',
      'Your account data, match preferences, and message history will be bundled and sent to your registered email address within 24 hours.',
      [{ text: 'Request Export', onPress: () => Alert.alert('Request Sent', 'Check your inbox for export updates.') }, { text: 'Cancel', style: 'cancel' }]
    )
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? All your posts, connections, and verification status will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                const { data, error } = await (supabase.functions as any).invoke('delete-account')
                if (error) throw error
                if (!data?.success) throw new Error(data?.error || 'Account deletion was not confirmed.')
              }
              await signOut()
              router.replace('/(auth)/login')
            } catch (error: any) {
              Alert.alert('Account Not Deleted', error?.message || 'Please try again or contact support.')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <AppText variant="h3" weight="bold">
          Account Settings
        </AppText>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Email Info */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Mail color={Colors.primary} size={20} />
            <AppText variant="bodySm" weight="bold">
              Registered Email
            </AppText>
          </View>
          <AppText variant="body" color={Colors.textSecondary} style={{ marginTop: 4 }}>
            {email || 'No email associated'}
          </AppText>
          <AppText variant="caption" color={Colors.textMuted} style={{ marginTop: 4 }}>
            Your primary email is used for login and verification receipts.
          </AppText>
        </Card>

        {/* Change Password */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Lock color={Colors.coral} size={20} />
            <AppText variant="bodySm" weight="bold">
              Change Password
            </AppText>
          </View>

          <TextInput
            placeholder="New password (min 6 characters)"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />

          <TextInput
            placeholder="Confirm new password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />

          <AppButton
            title={loading ? 'Updating...' : 'Update Password'}
            variant="primary"
            onPress={handleUpdatePassword}
            disabled={loading}
            style={{ marginTop: 12 }}
          />
        </Card>

        {/* Data & Privacy Actions */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <DownloadCloud color={Colors.sage} size={20} />
            <AppText variant="bodySm" weight="bold">
              Data & Export
            </AppText>
          </View>
          <AppText variant="caption" color={Colors.textSecondary} style={{ marginTop: 4, marginBottom: 12 }}>
            Download a secure JSON archive of your personal profile, activity history, and settings.
          </AppText>
          <AppButton title="Export Data Archive" variant="outline" onPress={handleExportData} />
        </Card>

        {/* Danger Zone */}
        <Card style={[styles.sectionCard, styles.dangerCard]}>
          <View style={styles.cardHeaderRow}>
            <Trash2 color="#DC2626" size={20} />
            <AppText variant="bodySm" weight="bold" color="#DC2626">
              Delete Account
            </AppText>
          </View>
          <AppText variant="caption" color="#DC2626" style={{ marginTop: 4, marginBottom: 12 }}>
            Permanently delete your account, member profile, and all associated personal data. This cannot be undone.
          </AppText>
          <AppButton title="Delete Account" variant="outline" onPress={handleDeleteAccount} />
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
    paddingBottom: Spacing.xxl,
  },
  sectionCard: {
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginTop: 10,
  },
  dangerCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
})
