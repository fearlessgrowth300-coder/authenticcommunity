import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Tabs } from 'expo-router'
import { Colors } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Home, Compass, Calendar, MessageCircle, User } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
            <Home color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
            <Compass color={color} size={size || 22} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }: { color: string; size?: number }) => (
            <Calendar color={color} size={size || 22} />
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
      {/* Hidden legacy tab routes */}
      <Tabs.Screen
        name="discover"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
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
