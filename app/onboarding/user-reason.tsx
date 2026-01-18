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

// Available reason options
const REASON_OPTIONS = [
  { value: 'stop_addiction', label: 'Stop Addiction' },
  { value: 'reduce_substance_use', label: 'Reduce Substance Use' },
  { value: 'maintain_sobriety', label: 'Maintain Sobriety' },
  { value: 'mental_health_support', label: 'Mental Health Support' },
  { value: 'anxiety_management', label: 'Manage Anxiety' },
  { value: 'depression_help', label: 'Cope with Depression' },
  { value: 'stress_relief', label: 'Relieve Stress' },
  { value: 'build_healthy_habits', label: 'Build Healthy Habits' },
  { value: 'improve_sleep', label: 'Improve Sleep Quality' },
  { value: 'increase_motivation', label: 'Increase Motivation' },
  { value: 'track_progress', label: 'Track My Progress' },
  { value: 'daily_support', label: 'Get Daily Support' },
  { value: 'relapse_prevention', label: 'Prevent Relapse' },
  { value: 'emotional_regulation', label: 'Regulate Emotions' },
  { value: 'general_wellness', label: 'General Wellness' },
  { value: 'other', label: 'Other' },
];

export default function UserReasonScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  // Initialize form data from context if available
  const [formData, setFormData] = useState({
    main_reason: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from database and context when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        // Try to load from database first
        const reasonData = await DatabaseService.getUserReason(user.id);

        // Use database data if available, otherwise fall back to context
        const mainReason = reasonData?.main_reason || data.userReason?.main_reason || [];

        setFormData({
          main_reason: Array.isArray(mainReason) ? mainReason : [],
        });

        // Update context with loaded data
        if (reasonData) {
          updateData('userReason', {
            main_reason: reasonData.main_reason,
          });
        } else {
          // Fall back to context data if no database data
          const contextReasons = data.userReason?.main_reason || [];
          setFormData({
            main_reason: Array.isArray(contextReasons) ? contextReasons : [],
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fall back to context data on error
        const contextReasons = data.userReason?.main_reason || [];
        setFormData({
          main_reason: Array.isArray(contextReasons) ? contextReasons : [],
        });
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isInitialized, data, updateData]);


  const getReasonLabel = (value: string) => {
    const option = REASON_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.main_reason || formData.main_reason.length === 0) {
      newErrors.main_reason = 'Please select at least one reason';
    } else if (formData.main_reason.length > 3) {
      newErrors.main_reason = 'Please select up to 3 reasons only';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('userReason', {
        main_reason: formData.main_reason,
      });

      // Update onboarding status before navigating
      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'addiction-info');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/addiction-info' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'basic-info');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/basic-info' as any);
  };

  const toggleReason = (value: string) => {
    setFormData(prev => {
      const currentReasons = prev.main_reason || [];
      let newReasons: string[];

      if (currentReasons.includes(value)) {
        // Remove the reason if it's already selected
        newReasons = currentReasons.filter(reason => reason !== value);
      } else {
        // Add the reason if not selected and under limit
        if (currentReasons.length < 3) {
          newReasons = [...currentReasons, value];
        } else {
          newReasons = currentReasons; // Don't add if already at max
        }
      }

      return { ...prev, main_reason: newReasons };
    });

    // Clear error when user makes a selection
    if (errors.main_reason) {
      setErrors(prev => ({ ...prev, main_reason: '' }));
    }
  };

  // Update context whenever formData changes
  useEffect(() => {
    updateData('userReason', {
      main_reason: formData.main_reason,
    });
  }, [formData.main_reason, updateData]);

  const updateFormData = (field: string, value: string) => {
    if (field === 'main_reason') {
      toggleReason(value);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        {/* Header */}
        <View className="mb-12">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Why are you here?
          </Text>
          <Text className="text-lg text-gray-600">
            Help us understand how we can best support you
          </Text>
        </View>

          {/* Reason Options Grid */}
          <View className="flex-row flex-wrap gap-3 space-y-4">
            {REASON_OPTIONS.map((option) => {
              const isSelected = formData.main_reason.includes(option.value);
              const isDisabled = !isSelected && formData.main_reason.length >= 3;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateFormData('main_reason', option.value)}
                  disabled={isDisabled}
                  className={`px-4 py-3 rounded-lg border-2 ${
                    isSelected
                      ? 'bg-[#008d72] border-[#008d72]'
                      : isDisabled
                      ? 'bg-gray-100 border-gray-200 opacity-50'
                      : errors.main_reason
                      ? 'bg-white border-red-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium text-center ${
                      isSelected ? 'text-white' :
                      isDisabled ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mt-6 mb-8 mr-6 ml-6">
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
    </ScrollView>
  );
}