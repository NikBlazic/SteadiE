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

const FEELING_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'okay', label: 'Okay' },
  { value: 'struggling', label: 'Struggling' },
  { value: 'crisis', label: 'In Crisis' },
];

export default function MentalHealthInfoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    recent_feeling: '' as '' | 'good' | 'okay' | 'struggling' | 'crisis',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const mentalHealthData = await DatabaseService.getUserMentalHealthInfo(user.id);

        setFormData({
          recent_feeling: (mentalHealthData?.recent_feeling || data.mentalHealthInfo?.recent_feeling || '') as '' | 'good' | 'okay' | 'struggling' | 'crisis',
        });

        if (mentalHealthData) {
          updateData('mentalHealthInfo', mentalHealthData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          recent_feeling: (data.mentalHealthInfo?.recent_feeling || '') as '' | 'good' | 'okay' | 'struggling' | 'crisis',
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

    if (!formData.recent_feeling) {
      newErrors.recent_feeling = 'Please select how you\'ve been feeling';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('mentalHealthInfo', {
        struggles: null,
        recent_feeling: formData.recent_feeling,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'motivation');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/motivation' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'addiction-info');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/addiction-info' as any);
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
            Mental Health
          </Text>
          <Text className="text-lg text-gray-600">
            Tell us about your mental health
          </Text>
        </View>

        <View className="space-y-8">
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              How have you been feeling recently? *
            </Text>
            <View className="gap-3">
              {FEELING_OPTIONS.map((option) => {
                const isSelected = formData.recent_feeling === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('recent_feeling', option.value)}
                    className={`w-full px-4 py-4 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.recent_feeling
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
            {errors.recent_feeling && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.recent_feeling}
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
