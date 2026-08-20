import React from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Colors, Spacing, Radii } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Plus } from 'lucide-react-native'

export interface StoryUser {
  id: string
  name: string
  avatarUrl: string
  hasUnseen: boolean
  isCommunity?: boolean
}

const SAMPLE_STORIES: StoryUser[] = [
  {
    id: 's1',
    name: 'Sarah',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
    hasUnseen: true,
  },
  {
    id: 's2',
    name: 'David',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80',
    hasUnseen: false,
  },
  {
    id: 's3',
    name: 'Lagos Creators',
    avatarUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150&fit=crop&q=80',
    hasUnseen: true,
    isCommunity: true,
  },
  {
    id: 's4',
    name: 'AI Builders',
    avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&fit=crop&q=80',
    hasUnseen: true,
    isCommunity: true,
  },
  {
    id: 's5',
    name: 'Elena',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&fit=crop&q=80',
    hasUnseen: false,
  },
]

interface StoriesRowProps {
  myAvatarUrl?: string
}

export const StoriesRow: React.FC<StoriesRowProps> = ({ myAvatarUrl }) => {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Your Story item */}
        <TouchableOpacity
          onPress={() => router.push('/story/create')}
          style={styles.storyItem}
          activeOpacity={0.8}
        >
          <View style={styles.myAvatarContainer}>
            <Image
              source={{
                uri:
                  myAvatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            <View style={styles.plusBadge}>
              <Plus color="#FFFFFF" size={12} strokeWidth={3} />
            </View>
          </View>
          <AppText variant="caption" weight="medium" style={styles.nameText}>
            Your Story
          </AppText>
        </TouchableOpacity>

        {/* Stories from others */}
        {SAMPLE_STORIES.map((story) => (
          <TouchableOpacity
            key={story.id}
            onPress={() => router.push(`/story/${story.id}`)}
            style={styles.storyItem}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.storyRing,
                story.hasUnseen ? styles.unseenRing : styles.seenRing,
              ]}
            >
              <Image source={{ uri: story.avatarUrl }} style={styles.avatar} />
            </View>
            <AppText
              variant="caption"
              weight={story.hasUnseen ? 'bold' : 'normal'}
              numberOfLines={1}
              style={styles.nameText}
            >
              {story.name}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  myAvatarContainer: {
    position: 'relative',
    padding: 2,
  },
  storyRing: {
    padding: 2.5,
    borderRadius: 36,
    borderWidth: 2,
  },
  unseenRing: {
    borderColor: Colors.primary,
  },
  seenRing: {
    borderColor: Colors.borderStrong,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.border,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  nameText: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
  },
})
