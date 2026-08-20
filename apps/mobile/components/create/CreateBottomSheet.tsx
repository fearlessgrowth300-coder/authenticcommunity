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
import {
  FileText,
  Camera,
  Video,
  Flame,
  Users,
  Calendar,
  X,
} from 'lucide-react-native'

interface CreateBottomSheetProps {
  visible: boolean
  onClose: () => void
}

export const CreateBottomSheet: React.FC<CreateBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter()

  const options = [
    {
      id: 'post',
      label: 'Post',
      icon: <FileText color="#FFFFFF" size={24} />,
      bgColor: '#4F46E5', // Indigo
      route: '/post/create',
    },
    {
      id: 'photo',
      label: 'Photo',
      icon: <Camera color="#FFFFFF" size={24} />,
      bgColor: '#F9736B', // Coral
      route: '/post/create?type=photo',
    },
    {
      id: 'video',
      label: 'Video',
      icon: <Video color="#FFFFFF" size={24} />,
      bgColor: '#F6B94A', // Amber
      route: '/post/create?type=video',
    },
    {
      id: 'story',
      label: 'Story',
      icon: <Flame color="#FFFFFF" size={24} />,
      bgColor: '#3BAA7A', // Sage
      route: '/story/create',
    },
    {
      id: 'community',
      label: 'Community',
      icon: <Users color="#FFFFFF" size={24} />,
      bgColor: '#6366F1', // Indigo accent
      route: '/community/create',
    },
    {
      id: 'event',
      label: 'Event',
      icon: <Calendar color="#FFFFFF" size={24} />,
      bgColor: '#8B5CF6', // Purple
      route: '/event/create',
    },
  ]

  const handleSelect = (route: string) => {
    onClose()
    setTimeout(() => {
      router.push(route as any)
    }, 200)
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
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <AppText variant="h3" weight="bold">
                  Create
                </AppText>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color={Colors.textMuted} size={20} />
                </TouchableOpacity>
              </View>

              {/* Grid of 6 options */}
              <View style={styles.grid}>
                {options.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleSelect(item.route)}
                    style={styles.gridItem}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
                      {item.icon}
                    </View>
                    <AppText variant="caption" weight="bold" color={Colors.text} style={styles.itemLabel}>
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
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
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    padding: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  gridItem: {
    width: '28%',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  itemLabel: {
    marginTop: 2,
  },
})
