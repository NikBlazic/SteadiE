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

const SUPPORT_TYPE_OPTIONS = [
  { value: 'daily_checkins', label: 'Daily Check-ins' },
  { value: 'habit_tracker', label: 'Habit Tracker' },
  { value: 'journaling_prompts', label: 'Journaling Prompts' },
];

const NOTIFICATION_FREQUENCY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function SupportPreferencesScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    support_type: [] as string[],
    notification_frequency: '' as '' | 'none' | 'daily' | 'weekly' | 'monthly',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const supportData = await DatabaseService.getUserSupportPreferences(user.id);

        setFormData({
          support_type: (supportData?.support_type || data.supportPreferences?.support_type || []) as string[],
          notification_frequency: (supportData?.notification_frequency || data.supportPreferences?.notification_frequency || '') as '' | 'none' | 'daily' | 'weekly' | 'monthly',
        });

        if (supportData) {
          updateData('supportPreferences', supportData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          support_type: (data.supportPreferences?.support_type || []) as string[],
          notification_frequency: (data.supportPreferences?.notification_frequency || '') as '' | 'none' | 'daily' | 'weekly' | 'monthly',
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

    if (!formData.support_type || formData.support_type.length === 0) {
      newErrors.support_type = 'Please select at least one support type';
    }

    if (!formData.notification_frequency) {
      newErrors.notification_frequency = 'Please select notification frequency';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('supportPreferences', {
        support_type: formData.support_type,
        notification_frequency: formData.notification_frequency,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'emergency-contact');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/emergency-contact' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'lifestyle-factors');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/lifestyle-factors' as any);
  };

  const toggleSupportType = (value: string) => {
    setFormData(prev => {
      const currentTypes = prev.support_type || [];
      let newTypes: string[];

      if (currentTypes.includes(value)) {
        newTypes = currentTypes.filter(type => type !== value);
      } else {
        newTypes = [...currentTypes, value];
      }

      return { ...prev, support_type: newTypes };
    });

    if (errors.support_type) {
      setErrors(prev => ({ ...prev, support_type: '' }));
    }
  };

  const updateFormData = (field: string, value: string) => {
    if (field === 'support_type') {
      toggleSupportType(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        <View className="mb-12">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Support Preferences
          </Text>
          <Text className="text-lg text-gray-600">
            How would you like to be supported?
          </Text>
        </View>

        <View className="space-y-8">
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Support Types * (Select all that apply)
            </Text>
            <View className="flex-row flex-wrap gap-3 justify-between">
              {SUPPORT_TYPE_OPTIONS.map((option) => {
                const isSelected = formData.support_type.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('support_type', option.value)}
                    className={`flex-1 min-w-[45%] px-4 py-3 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.support_type
                        ? 'bg-white border-red-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.support_type && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.support_type}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Notification Frequency *
            </Text>
            <View className="flex-row flex-wrap gap-3 justify-between">
              {NOTIFICATION_FREQUENCY_OPTIONS.map((option) => {
                const isSelected = formData.notification_frequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('notification_frequency', option.value)}
                    className={`flex-1 min-w-[45%] px-4 py-3 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.notification_frequency
                        ? 'bg-white border-red-500'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.notification_frequency && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.notification_frequency}
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
