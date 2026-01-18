import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import { useAuth } from '../../lib/auth-context';
import { useOnboarding } from '../../lib/onboarding-context';

const ADDICTION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'tobacco', label: 'Tobacco/Nicotine' },
  { value: 'cannabis', label: 'Cannabis/Marijuana' },
  { value: 'prescription_drugs', label: 'Prescription Drugs' },
  { value: 'illegal_drugs', label: 'Illegal Drugs' },
  { value: 'gambling', label: 'Gambling' },
  { value: 'internet', label: 'Internet/Social Media' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'critical', label: 'Critical' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'occasionally', label: 'Occasionally' },
];

export default function AddictionInfoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    addiction_type: '',
    severity: '' as '' | 'mild' | 'moderate' | 'severe' | 'critical',
    frequency: '' as '' | 'daily' | 'weekly' | 'monthly' | 'occasionally',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const addictionData = await DatabaseService.getUserAddictionInfo(user.id);

        setFormData({
          addiction_type: addictionData?.addiction_type || data.addictionInfo?.addiction_type || '',
          severity: (addictionData?.severity || data.addictionInfo?.severity || '') as '' | 'mild' | 'moderate' | 'severe' | 'critical',
          frequency: (addictionData?.frequency || data.addictionInfo?.frequency || '') as '' | 'daily' | 'weekly' | 'monthly' | 'occasionally',
        });

        if (addictionData) {
          updateData('addictionInfo', addictionData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          addiction_type: data.addictionInfo?.addiction_type || '',
          severity: (data.addictionInfo?.severity || '') as '' | 'mild' | 'moderate' | 'severe' | 'critical',
          frequency: (data.addictionInfo?.frequency || '') as '' | 'daily' | 'weekly' | 'monthly' | 'occasionally',
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

    if (!formData.addiction_type) {
      newErrors.addiction_type = 'Please select an addiction type';
    }

    // Only require severity and frequency if addiction type is not "none"
    if (formData.addiction_type && formData.addiction_type !== 'none') {
      if (!formData.severity) {
        newErrors.severity = 'Please select severity';
      }

      if (!formData.frequency) {
        newErrors.frequency = 'Please select frequency';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('addictionInfo', {
        addiction_type: formData.addiction_type,
        severity: formData.addiction_type === 'none' ? null : formData.severity,
        frequency: formData.addiction_type === 'none' ? null : formData.frequency,
        goal: null,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'mental-health-info');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/mental-health-info' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'user-reason');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/user-reason' as any);
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
            Addiction Information
          </Text>
          <Text className="text-lg text-gray-600">
            Help us understand your situation better
          </Text>
        </View>

        <View className="space-y-8">
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Addiction Type *
            </Text>
            <TouchableOpacity
              className={`border rounded-lg px-4 py-3 ${
                errors.addiction_type ? 'border-red-500' : 'border-gray-300'
              }`}
              onPress={() => {
                Alert.alert(
                  'Select Addiction Type',
                  'Please select the type of addiction',
                  [
                    ...ADDICTION_TYPES.map(type => ({
                      text: type.label,
                      onPress: () => updateFormData('addiction_type', type.value),
                    })),
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text className={`text-base ${formData.addiction_type ? 'text-gray-900' : 'text-gray-500'}`}>
                {formData.addiction_type
                  ? ADDICTION_TYPES.find(t => t.value === formData.addiction_type)?.label
                  : 'Select addiction type'}
              </Text>
            </TouchableOpacity>
            {errors.addiction_type && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.addiction_type}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Severity {formData.addiction_type && formData.addiction_type !== 'none' ? '*' : '(Optional)'}
            </Text>
            <View className="flex-row flex-wrap gap-3 justify-between">
              {SEVERITY_OPTIONS.map((option) => {
                const isSelected = formData.severity === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('severity', option.value)}
                    className={`flex-1 min-w-[45%] px-4 py-3 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.severity
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
            {errors.severity && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.severity}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Frequency {formData.addiction_type && formData.addiction_type !== 'none' ? '*' : '(Optional)'}
            </Text>
            <View className="flex-row flex-wrap gap-3 justify-between">
              {FREQUENCY_OPTIONS.map((option) => {
                const isSelected = formData.frequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => updateFormData('frequency', option.value)}
                    className={`flex-1 min-w-[45%] px-4 py-3 rounded-lg border-2 ${
                      isSelected
                        ? 'bg-[#008d72] border-[#008d72]'
                        : errors.frequency
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
            {errors.frequency && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.frequency}
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
