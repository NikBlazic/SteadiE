import { Stack } from 'expo-router';
import React from 'react';
import { OnboardingProvider } from '../../lib/onboarding-context';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="basic-info" />
        <Stack.Screen name="confirmation" />
      </Stack>
    </OnboardingProvider>
  );
}