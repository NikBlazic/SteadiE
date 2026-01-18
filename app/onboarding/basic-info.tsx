import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import { useAuth } from '../../lib/auth-context';
import { useOnboarding } from '../../lib/onboarding-context';

export default function BasicInfoScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  // Initialize form data from context if available
  const [formData, setFormData] = useState({
    display_name: '',
    age: '',
    gender: '' as '' | 'male' | 'female' | 'prefer_not_to_say',
    country_region: '',
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
        const [basicInfoData, userData] = await Promise.all([
          DatabaseService.getUserBasicInfo(user.id),
          DatabaseService.getUserData(user.id),
        ]);

        // Use database data if available, otherwise fall back to context
        const displayName = basicInfoData?.display_name || data.basicInfo?.display_name || '';
        const countryRegion = basicInfoData?.country_region || data.basicInfo?.country_region || '';
        const age = userData?.age?.toString() || data.user?.age?.toString() || '';
        const gender = (userData?.gender || data.user?.gender || '') as '' | 'male' | 'female' | 'prefer_not_to_say';

        setFormData({
          display_name: displayName,
          age: age,
          gender: gender,
          country_region: countryRegion,
        });

        // Update context with loaded data
        if (basicInfoData || userData) {
          if (basicInfoData) {
            updateData('basicInfo', {
              display_name: basicInfoData.display_name,
              country_region: basicInfoData.country_region,
            });
          }
          if (userData) {
            updateData('user', {
              age: userData.age,
              gender: userData.gender,
            });
          }
        } else {
          // Fall back to context data if no database data
          setFormData({
            display_name: data.basicInfo?.display_name || '',
            age: data.user?.age?.toString() || '',
            gender: (data.user?.gender as '' | 'male' | 'female' | 'prefer_not_to_say') || '',
            country_region: data.basicInfo?.country_region || '',
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fall back to context data on error
        setFormData({
          display_name: data.basicInfo?.display_name || '',
          age: data.user?.age?.toString() || '',
          gender: (data.user?.gender as '' | 'male' | 'female' | 'prefer_not_to_say') || '',
          country_region: data.basicInfo?.country_region || '',
        });
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isInitialized, data, updateData]);

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

  const handleContinue = async () => {
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

      // Update onboarding status before navigating
      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'user-reason');
          // Use replace instead of push to avoid navigation issues
          router.replace('/onboarding/user-reason' as any);
        } catch (error) {
          console.error('Error updating onboarding status:', error);
          // Still navigate even if status update fails
          router.replace('/onboarding/user-reason' as any);
        }
      } else {
        router.replace('/onboarding/user-reason' as any);
      }
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update context in real-time as user types
    if (field === 'display_name' || field === 'country_region') {
      updateData('basicInfo', {
        [field]: value,
      });
    } else if (field === 'age') {
      // Store the raw string value, but also update context with parsed number if valid
      const ageNum = parseInt(value);
      if (!isNaN(ageNum) && value.trim() !== '') {
        updateData('user', {
          age: ageNum,
        });
      }
    } else if (field === 'gender') {
      updateData('user', {
        gender: value,
      });
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-32">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to SteadiE
          </Text>
          <Text className="text-lg text-gray-600">
            Let's get to know you better to personalize your experience
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-2">
          {/* Username */}
          <View className="mb-2 mt-2">
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
          <View className="mb-2 mt-2">
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
          <View className="mb-2 mt-2">
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
          <View className="mb-2 mt-2">
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
        </View>
      </View>
    </ScrollView>
  );
}