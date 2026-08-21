import React from 'react'
import { Stack } from 'expo-router'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="location" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="values" />
      <Stack.Screen name="bio" />
    </Stack>
  )
}
