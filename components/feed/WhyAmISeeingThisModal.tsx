import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { AppButton } from '@/components/primitives/AppButton'
import {
  Sparkles,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  X,
} from 'lucide-react-native'

interface WhyAmISeeingThisModalProps {
  visible: boolean
  onClose: () => void
  topic?: string
  location?: string
  reasons?: string[]
}

export const WhyAmISeeingThisModal: React.FC<WhyAmISeeingThisModalProps> = ({
  visible,
  onClose,
  topic = 'Entrepreneurship',
  location = 'Lagos',
  reasons,
}) => {
  const router = useRouter()

  const handleManage = () => {
    onClose()
    router.push('/settings/content-discovery')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <AppText variant="h3" weight="bold">
                  Why am I seeing this?
                </AppText>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color={Colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>

              <AppText variant="bodySm" color={Colors.textSecondary} style={styles.subtext}>
                We prioritize transparent recommendations driven by your interests and local community.
              </AppText>

              {reasons && reasons.length > 0 ? (
                <View style={styles.reasonsList}>
                  {reasons.slice(0, 4).map((reason) => (
                    <View style={styles.reasonRow} key={reason}>
                      <View style={styles.iconCircle}>
                        <Sparkles color={Colors.primary} size={16} />
                      </View>
                      <AppText variant="bodySm" color={Colors.text} style={styles.reasonText}>{reason}</AppText>
                    </View>
                  ))}
                </View>
              ) : (
              <View style={styles.reasonsList}>
                <View style={styles.reasonRow}>
                  <View style={styles.iconCircle}>
                    <Sparkles color={Colors.primary} size={16} />
                  </View>
                  <AppText variant="bodySm" color={Colors.text} style={styles.reasonText}>
                    You're interested in <AppText variant="bodySm" weight="bold">{topic}</AppText>
                  </AppText>
                </View>

                <View style={styles.reasonRow}>
                  <View style={styles.iconCircle}>
                    <MapPin color={Colors.primary} size={16} />
                  </View>
                  <AppText variant="bodySm" color={Colors.text} style={styles.reasonText}>
                    This creator is based near <AppText variant="bodySm" weight="bold">{location}</AppText>
                  </AppText>
                </View>

                <View style={styles.reasonRow}>
                  <View style={styles.iconCircle}>
                    <TrendingUp color={Colors.primary} size={16} />
                  </View>
                  <AppText variant="bodySm" color={Colors.text} style={styles.reasonText}>
                    People with similar values engaged with this post
                  </AppText>
                </View>
              </View>
              )}

              <AppButton
                title="Manage Recommendations"
                variant="primary"
                leftIcon={<SlidersHorizontal color="#FFFFFF" size={16} />}
                onPress={handleManage}
                style={styles.manageBtn}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: Spacing.xxl,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeBtn: {
    padding: 4,
  },
  subtext: {
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  reasonsList: {
    gap: 14,
    marginBottom: Spacing.xl,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
  },
  manageBtn: {
    width: '100%',
  },
})
