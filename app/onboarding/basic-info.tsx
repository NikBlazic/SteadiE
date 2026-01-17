import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useOnboarding } from '../../lib/onboarding-context';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { updateData } = useOnboarding();

  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    gender: '' as '' | 'male' | 'female' | 'prefer_not_to_say',
    country_region: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatGenderDisplay = (gender: string) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'prefer_not_to_say': return 'Prefer not to say';
      default: return '';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.display_name.trim() && formData.display_name.trim().length < 2) {
      newErrors.display_name = 'Username must be at least 2 characters';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        newErrors.age = 'Please enter a valid age (13-120)';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!formData.country_region.trim()) {
      newErrors.country_region = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      // Update the onboarding context with user data (age, gender)
      updateData('user', {
        age: parseInt(formData.age),
        gender: formData.gender,
      });

      // Update the onboarding context with basic info (display_name, country_region)
      updateData('basicInfo', {
        display_name: formData.display_name.trim() || 'Anonymous',
        country_region: formData.country_region.trim(),
      });

      router.push('/onboarding/confirmation' as any);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to SteadiE
          </Text>
          <Text className="text-lg text-gray-600">
            Let's get to know you better to personalize your experience
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          {/* Username */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Username
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.display_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your username (optional)"
              value={formData.display_name}
              onChangeText={(value) => updateFormData('display_name', value)}
              autoCapitalize="none"
            />
            {errors.display_name && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.display_name}
              </Text>
            )}
          </View>

          {/* Age */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Age *
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.age ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your age"
              value={formData.age}
              onChangeText={(value) => updateFormData('age', value)}
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.age && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.age}
              </Text>
            )}
          </View>

          {/* Gender */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Gender *
            </Text>
            <TouchableOpacity
              className={`border rounded-lg px-4 py-3 ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
              onPress={() => {
                Alert.alert(
                  'Select Gender',
                  'Please select your gender',
                  [
                    { text: 'Male', onPress: () => updateFormData('gender', 'male') },
                    { text: 'Female', onPress: () => updateFormData('gender', 'female') },
                    { text: 'Prefer not to say', onPress: () => updateFormData('gender', 'prefer_not_to_say') },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text className={`text-base ${formData.gender ? 'text-gray-900' : 'text-gray-500'}`}>
                {formData.gender ? formatGenderDisplay(formData.gender) : 'Select gender'}
              </Text>
            </TouchableOpacity>
            {errors.gender && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.gender}
              </Text>
            )}
          </View>

          {/* Country */}
          <View>
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Country *
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.country_region ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your country"
              value={formData.country_region}
              onChangeText={(value) => updateFormData('country_region', value)}
              autoCapitalize="words"
            />
            {errors.country_region && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.country_region}
              </Text>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <View className="mt-8 mb-8">
          <TouchableOpacity
            className="bg-[#008d72] rounded-lg py-4 px-6"
            onPress={handleContinue}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}