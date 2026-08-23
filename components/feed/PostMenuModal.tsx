import React from 'react'
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import {
  HelpCircle,
  TrendingUp,
  Flame,
  EyeOff,
  VolumeX,
  UserX,
  Flag,
  Ban,
  X,
} from 'lucide-react-native'

interface PostMenuModalProps {
  visible: boolean
  onClose: () => void
  onWhySeeing: () => void
  onAction?: (action: string) => void
  authorName?: string
}

export const PostMenuModal: React.FC<PostMenuModalProps> = ({
  visible,
  onClose,
  onWhySeeing,
  onAction,
  authorName = 'Creator',
}) => {
  const menuItems = [
    {
      id: 'why_seeing',
      label: 'Why am I seeing this?',
      icon: <HelpCircle color={Colors.primary} size={20} />,
      onPress: () => {
        onClose()
        onWhySeeing()
      },
    },
    {
      id: 'see_more',
      label: 'See more like this',
      icon: <TrendingUp color={Colors.sage} size={20} />,
      onPress: () => {
        onAction?.('see_more')
        onClose()
      },
    },
    {
      id: 'not_interested',
      label: 'Not interested in this post',
      icon: <EyeOff color={Colors.textSecondary} size={20} />,
      onPress: () => {
        onAction?.('not_interested')
        onClose()
      },
    },
    {
      id: 'see_fewer',
      label: 'See fewer posts like this',
      icon: <Flame color={Colors.textSecondary} size={20} />,
      onPress: () => {
        onAction?.('see_fewer')
        onClose()
      },
    },
    {
      id: 'mute',
      label: `Mute @${authorName.toLowerCase().replace(/\s+/g, '')}`,
      icon: <VolumeX color={Colors.textSecondary} size={20} />,
      onPress: () => {
        onAction?.('mute')
        onClose()
      },
    },
    {
      id: 'unfollow',
      label: `Unfollow ${authorName}`,
      icon: <UserX color={Colors.coral} size={20} />,
      onPress: () => {
        onAction?.('unfollow')
        onClose()
      },
    },
    {
      id: 'report',
      label: 'Report post',
      icon: <Flag color={Colors.coral} size={20} />,
      onPress: () => {
        onAction?.('report')
        onClose()
      },
    },
    {
      id: 'block',
      label: `Block ${authorName}`,
      icon: <Ban color="#DC2626" size={20} />,
      danger: true,
      onPress: () => {
        onAction?.('block')
        onClose()
      },
    },
  ]

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
                  Post Options
                </AppText>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color={Colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuList}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={item.onPress}
                    style={styles.menuRow}
                  >
                    <View style={styles.iconWrap}>{item.icon}</View>
                    <AppText
                      variant="bodySm"
                      weight={item.danger ? 'bold' : 'medium'}
                      color={item.danger ? '#DC2626' : Colors.text}
                      style={styles.menuLabel}
                    >
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    paddingBottom: Spacing.xl,
    maxHeight: '75%',
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
    marginBottom: Spacing.md,
  },
  closeBtn: {
    padding: 4,
  },
  menuList: {
    paddingBottom: Spacing.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
  },
  menuLabel: {
    flex: 1,
  },
})
