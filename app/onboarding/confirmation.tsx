import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { ConfirmOnboardingResponse } from '../../lib/database-types';
import { useOnboarding } from '../../lib/onboarding-context';
import { supabase } from '../../lib/supabase';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const userData = data.user;
  const basicInfo = data.basicInfo;

  const formatGender = (gender: string) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'prefer_not_to_say': return 'Prefer not to say';
      default: return gender;
    }
  };

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!data.user || !data.basicInfo) {
      Alert.alert('Error', 'Missing onboarding data');
      return;
    }

    setIsSaving(true);
    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get Supabase URL from environment
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      // Call the API endpoint
      const response = await fetch(
        `${supabaseUrl}/functions/v1/confirm-onboarding/basic-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            user: data.user,
            basicInfo: data.basicInfo,
          }),
        }
      );

      const result: ConfirmOnboardingResponse = await response.json();

      if (!result.success || !response.ok) {
        throw new Error(result.message || 'Failed to save onboarding data');
      }

      Alert.alert(
        'Success!',
        'Your basic information has been saved. Onboarding completed!',
        [
          {
            text: 'Continue to App',
            onPress: () => {
              // Navigate to main app - the guard will handle this automatically
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save your information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    router.back();
  };

  if (!userData || !basicInfo) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">No information to display</Text>
        <TouchableOpacity
          className="mt-4 bg-[#008d72] px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Your Information
          </Text>
          <Text className="text-lg text-gray-600">
            Please review your details before continuing
          </Text>
        </View>

        {/* Information Display */}
        <View className="bg-gray-50 rounded-lg p-6 mb-8">
          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
              <Text className="text-base font-medium text-gray-600">Username</Text>
              <Text className="text-base text-gray-900">{basicInfo.display_name}</Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
              <Text className="text-base font-medium text-gray-600">Age</Text>
              <Text className="text-base text-gray-900">{userData.age} years old</Text>
            </View>

            <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
              <Text className="text-base font-medium text-gray-600">Gender</Text>
              <Text className="text-base text-gray-900">
                {formatGender(userData.gender || '')}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2">
              <Text className="text-base font-medium text-gray-600">Country</Text>
              <Text className="text-base text-gray-900">{basicInfo.country_region}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4 mb-8">
          <TouchableOpacity
            className={`rounded-lg py-4 px-6 ${isSaving ? 'bg-gray-400' : 'bg-[#008d72]'}`}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isSaving ? 'Saving...' : 'Confirm & Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 rounded-lg py-4 px-6 mt-2"
            onPress={handleEdit}
          >
            <Text className="text-gray-700 text-center font-semibold text-lg">
              Edit Information
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}