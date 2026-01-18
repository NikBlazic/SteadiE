import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import { useAuth } from '../../lib/auth-context';
import { useOnboarding } from '../../lib/onboarding-context';

const READINESS_OPTIONS = [
  { value: 'not_ready', label: 'Not Ready' },
  { value: 'thinking_about_it', label: 'Thinking About It' },
  { value: 'ready', label: 'Ready' },
  { value: 'very_ready', label: 'Very Ready' },
];

export default function MotivationScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    readiness: '' as '' | 'not_ready' | 'thinking_about_it' | 'ready' | 'very_ready',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const motivationData = await DatabaseService.getUserMotivation(user.id);

        setFormData({
          readiness: (motivationData?.readiness || data.motivation?.readiness || '') as '' | 'not_ready' | 'thinking_about_it' | 'ready' | 'very_ready',
        });

        if (motivationData) {
          updateData('motivation', motivationData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          readiness: (data.motivation?.readiness || '') as '' | 'not_ready' | 'thinking_about_it' | 'ready' | 'very_ready',
        });
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isInitialized, data, updateData]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.readiness) {
      newErrors.readiness = 'Please select your readiness level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('motivation', {
        readiness: formData.readiness,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'lifestyle-factors');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/lifestyle-factors' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'mental-health-info');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/mental-health-info' as any);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        <View className="mb-12">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            How Ready Are You?
          </Text>
          <Text className="text-lg text-gray-600">
            Help us understand your motivation level
          </Text>
        </View>

        <View className="space-y-8">
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              How ready are you to make a change? *
            </Text>
            <View className="gap-3">
              {READINESS_OPTIONS.map((option) => {
                const isSelected = formData.readiness === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('readiness', option.value)}
                    className={`w-full px-4 py-4 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.readiness
                        ? 'bg-white border-red-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-base font-medium text-center ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.readiness && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.readiness}
              </Text>
            )}
          </View>
        </View>

        <View className="mt-6 mb-8">
          <TouchableOpacity
            className="bg-[#008d72] rounded-lg py-4 px-6"
            onPress={handleContinue}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Loading...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-200 rounded-lg py-4 px-6 mt-4"
            onPress={handleBack}
            disabled={isLoading}
          >
            <Text className="text-gray-700 text-center font-semibold text-lg">
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
