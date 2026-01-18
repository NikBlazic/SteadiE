import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { DatabaseService } from '../api/onboarding-data';
import { useAuth } from './auth-context';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<'basic-info' | 'user-reason' | 'addiction-info' | 'mental-health-info' | 'motivation' | 'lifestyle-factors' | 'support-preferences' | 'emergency-contact' | 'confirmation' | 'complete' | '' | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setOnboardingStatus(null);
        return;
      }

      setCheckingOnboarding(true);
      try {
        const status = await DatabaseService.getOnboardingStatus(user.id);
        setOnboardingStatus(status);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to empty string (start from beginning) if there's an error
        setOnboardingStatus('');
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Re-check status when segments change (user navigated) to catch status updates
  useEffect(() => {
    const recheckStatus = async () => {
      if (!user || segments[0] !== 'onboarding' || checkingOnboarding) {
        return;
      }

      // Re-check status after a short delay to allow database updates to propagate
      const timeoutId = setTimeout(async () => {
        try {
          const status = await DatabaseService.getOnboardingStatus(user.id);
          setOnboardingStatus(status);
        } catch (error) {
          console.error('Error re-checking onboarding status:', error);
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    };

    recheckStatus();
  }, [user, segments, checkingOnboarding]);

  useEffect(() => {
    if (authLoading || checkingOnboarding || onboardingStatus === null) {
      return;
    }

    const inOnboardingFlow = segments[0] === 'onboarding';
    const inAuthFlow = segments[0] === '(tabs)' && !user;
    const currentScreen = segments[1] || '';

    // If user has completed onboarding, redirect to main app if in onboarding flow
    if (onboardingStatus === 'complete') {
      if (inOnboardingFlow) {
        router.replace('/(tabs)');
      }
      return;
    }

    // If user is authenticated but hasn't completed onboarding, redirect to the correct stage
    const onboardingStatuses = ['', 'basic-info', 'user-reason', 'addiction-info', 'mental-health-info', 'motivation', 'lifestyle-factors', 'support-preferences', 'emergency-contact', 'confirmation'];
    if (user && !inAuthFlow && onboardingStatuses.includes(onboardingStatus || '')) {
      // Check if current screen matches the expected screen based on status
      const expectedScreen = onboardingStatus || 'basic-info';
      const isOnExpectedScreen = inOnboardingFlow && currentScreen === expectedScreen;

      // Only redirect if user is not on the expected screen
      // Add a longer delay to allow status updates to propagate
      if (!isOnExpectedScreen) {
        let targetRoute = '/onboarding/basic-info';
        
        // Determine the target route based on onboarding status
        const statusRouteMap: Record<string, string> = {
          '': '/onboarding/basic-info',
          'basic-info': '/onboarding/basic-info',
          'user-reason': '/onboarding/user-reason',
          'addiction-info': '/onboarding/addiction-info',
          'mental-health-info': '/onboarding/mental-health-info',
          'motivation': '/onboarding/motivation',
          'lifestyle-factors': '/onboarding/lifestyle-factors',
          'support-preferences': '/onboarding/support-preferences',
          'emergency-contact': '/onboarding/emergency-contact',
          'confirmation': '/onboarding/confirmation',
        };
        
        targetRoute = statusRouteMap[onboardingStatus || ''] || '/onboarding/basic-info';

        // Add a delay to avoid interfering with active navigation and allow status updates
        const timeoutId = setTimeout(() => {
          router.replace(targetRoute as any);
        }, 400);

        return () => clearTimeout(timeoutId);
      }
    }

    // If user is not authenticated, allow normal navigation
    if (!user && inOnboardingFlow) {
      // Could redirect to login if needed
    }
  }, [user, onboardingStatus, authLoading, checkingOnboarding, segments, router]);

  if (authLoading || checkingOnboarding) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}