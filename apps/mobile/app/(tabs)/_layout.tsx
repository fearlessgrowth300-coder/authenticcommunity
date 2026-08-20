import React, { useState } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Tabs } from 'expo-router'
import { Colors } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { CreateBottomSheet } from '@/components/create/CreateBottomSheet'
import {
  House,
  Compass,
  Plus,
  MessageCircle,
  User,
} from 'lucide-react-native'

export default function TabsLayout() {
  const [createSheetVisible, setCreateSheetVisible] = useState(false)

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            height: 62,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
              <House color={color} size={size || 22} />
            ),
          }}
        />

        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
              <Compass color={color} size={size || 22} />
            ),
          }}
        />

        <Tabs.Screen
          name="create"
          options={{
            title: '',
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setCreateSheetVisible(true)}
                style={styles.createButtonContainer}
                activeOpacity={0.85}
              >
                <View style={styles.createButton}>
                  <Plus color="#FFFFFF" size={26} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
              <View style={styles.iconContainer}>
                <MessageCircle color={color} size={size || 22} />
                <View style={styles.badge}>
                  <AppText variant="caption" weight="bold" color="#FFFFFF" style={styles.badgeText}>
                    3
                  </AppText>
                </View>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
              <User color={color} size={size || 22} />
            ),
          }}
        />

        {/* Legacy redirect alias tabs */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Global Center Create Bottom Sheet */}
      <CreateBottomSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  createButtonContainer: {
    top: -12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
  },
})
