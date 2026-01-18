import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { DatabaseService } from '../../api/onboarding-data';
import { useOnboarding } from '../../lib/onboarding-context';

const SLEEP_QUALITY_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

const STRESS_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'extreme', label: 'Extreme' },
];

const ROUTINE_STABILITY_OPTIONS = [
  { value: 'unstable', label: 'Unstable' },
  { value: 'somewhat_stable', label: 'Somewhat Stable' },
  { value: 'stable', label: 'Stable' },
  { value: 'very_stable', label: 'Very Stable' },
];

const RELATIONSHIPS_OPTIONS = [
  { value: 'poor', label: 'Poor' },
  { value: 'fair', label: 'Fair' },
  { value: 'good', label: 'Good' },
  { value: 'excellent', label: 'Excellent' },
];

export default function LifestyleFactorsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    sleep_quality: '' as '' | 'poor' | 'fair' | 'good' | 'excellent',
    stress_level: '' as '' | 'low' | 'moderate' | 'high' | 'extreme',
    routine_stability: '' as '' | 'unstable' | 'somewhat_stable' | 'stable' | 'very_stable',
    relationships: '' as '' | 'poor' | 'fair' | 'good' | 'excellent',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const lifestyleData = await DatabaseService.getUserLifestyleFactors(user.id);

        setFormData({
          sleep_quality: (lifestyleData?.sleep_quality || data.lifestyleFactors?.sleep_quality || '') as '' | 'poor' | 'fair' | 'good' | 'excellent',
          stress_level: (lifestyleData?.stress_level || data.lifestyleFactors?.stress_level || '') as '' | 'low' | 'moderate' | 'high' | 'extreme',
          routine_stability: (lifestyleData?.routine_stability || data.lifestyleFactors?.routine_stability || '') as '' | 'unstable' | 'somewhat_stable' | 'stable' | 'very_stable',
          relationships: (lifestyleData?.relationships || data.lifestyleFactors?.relationships || '') as '' | 'poor' | 'fair' | 'good' | 'excellent',
        });

        if (lifestyleData) {
          updateData('lifestyleFactors', lifestyleData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          sleep_quality: (data.lifestyleFactors?.sleep_quality || '') as '' | 'poor' | 'fair' | 'good' | 'excellent',
          stress_level: (data.lifestyleFactors?.stress_level || '') as '' | 'low' | 'moderate' | 'high' | 'extreme',
          routine_stability: (data.lifestyleFactors?.routine_stability || '') as '' | 'unstable' | 'somewhat_stable' | 'stable' | 'very_stable',
          relationships: (data.lifestyleFactors?.relationships || '') as '' | 'poor' | 'fair' | 'good' | 'excellent',
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

    if (!formData.sleep_quality) {
      newErrors.sleep_quality = 'Please select sleep quality';
    }

    if (!formData.stress_level) {
      newErrors.stress_level = 'Please select stress level';
    }

    if (!formData.routine_stability) {
      newErrors.routine_stability = 'Please select routine stability';
    }

    if (!formData.relationships) {
      newErrors.relationships = 'Please select relationship quality';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('lifestyleFactors', {
        sleep_quality: formData.sleep_quality,
        stress_level: formData.stress_level,
        routine_stability: formData.routine_stability,
        relationships: formData.relationships,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'support-preferences');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/support-preferences' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'motivation');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/motivation' as any);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderOptionGroup = (
    title: string,
    field: keyof typeof formData,
    options: Array<{ value: string; label: string }>,
    error?: string
  ) => (
    <View className="mb-6">
      <Text className="text-base font-semibold text-gray-900 mb-4">
        {title} *
      </Text>
      <View className="flex-row flex-wrap gap-3 justify-between">
        {options.map((option) => {
          const isSelected = formData[field] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateFormData(field, option.value)}
              className={`flex-1 min-w-[45%] px-4 py-3 rounded-lg border-2 ${
                isSelected
                  ? 'bg-[#008d72] border-[#008d72]'
                  : error
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
      {error && (
        <Text className="text-red-500 text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        <View className="mb-12">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Lifestyle Factors
          </Text>
          <Text className="text-lg text-gray-600">
            Help us understand your lifestyle
          </Text>
        </View>

        <View className="space-y-8">
          {renderOptionGroup(
            'Sleep Quality',
            'sleep_quality',
            SLEEP_QUALITY_OPTIONS,
            errors.sleep_quality
          )}

          {renderOptionGroup(
            'Stress Level',
            'stress_level',
            STRESS_LEVEL_OPTIONS,
            errors.stress_level
          )}

          {renderOptionGroup(
            'Routine Stability',
            'routine_stability',
            ROUTINE_STABILITY_OPTIONS,
            errors.routine_stability
          )}

          {renderOptionGroup(
            'Relationships',
            'relationships',
            RELATIONSHIPS_OPTIONS,
            errors.relationships
          )}
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
