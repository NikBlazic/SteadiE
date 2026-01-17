import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from './auth-context';
import { DatabaseService } from './database';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setOnboardingCompleted(null);
        return;
      }

      setCheckingOnboarding(true);
      try {
        const completed = await DatabaseService.checkOnboardingCompleted(user.id);
        setOnboardingCompleted(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to false if there's an error
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    if (authLoading || checkingOnboarding || onboardingCompleted === null) {
      return;
    }

    const inOnboardingFlow = segments[0] === 'onboarding';
    const inAuthFlow = segments[0] === '(tabs)' && !user;

    // If user is authenticated but hasn't completed onboarding, redirect to onboarding
    if (user && !onboardingCompleted && !inOnboardingFlow && !inAuthFlow) {
      router.replace('/onboarding/basic-info');
      return;
    }

    // If user has completed onboarding or is not authenticated, allow normal navigation
    if (!user || onboardingCompleted) {
      // If we're currently in onboarding flow but shouldn't be, redirect to main app
      if (inOnboardingFlow) {
        router.replace('/(tabs)');
      }
    }
  }, [user, onboardingCompleted, authLoading, checkingOnboarding, segments, router]);

  if (authLoading || checkingOnboarding) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}