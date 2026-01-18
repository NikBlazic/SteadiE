import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import { useAuth } from '../../lib/auth-context';
import { useOnboarding } from '../../lib/onboarding-context';

export default function EmergencyContactScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      try {
        const contactData = await DatabaseService.getUserEmergencyContact(user.id);

        setFormData({
          contact_name: contactData?.contact_name || data.emergencyContact?.contact_name || '',
          contact_phone: contactData?.contact_phone || data.emergencyContact?.contact_phone || '',
          contact_email: contactData?.contact_email || data.emergencyContact?.contact_email || '',
          relationship: contactData?.relationship || data.emergencyContact?.relationship || '',
        });

        if (contactData) {
          updateData('emergencyContact', contactData);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData({
          contact_name: data.emergencyContact?.contact_name || '',
          contact_phone: data.emergencyContact?.contact_phone || '',
          contact_email: data.emergencyContact?.contact_email || '',
          relationship: data.emergencyContact?.relationship || '',
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

    // If any contact info is provided, validate it
    if (formData.contact_name.trim() || formData.contact_phone.trim() || formData.contact_email.trim()) {
      if (!formData.contact_name.trim()) {
        newErrors.contact_name = 'Contact name is required if providing contact information';
      }

      if (formData.contact_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      // Only update context, don't save to database yet
      updateData('emergencyContact', {
        contact_name: formData.contact_name.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        relationship: formData.relationship.trim() || null,
      });

      if (user) {
        try {
          await DatabaseService.updateOnboardingStatus(user.id, 'confirmation');
        } catch (error) {
          console.error('Error updating onboarding status:', error);
        }
      }

      router.replace('/onboarding/confirmation' as any);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'support-preferences');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/support-preferences' as any);
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
            Emergency Contact
          </Text>
          <Text className="text-lg text-gray-600">
            Please provide an emergency contact (optional but recommended)
          </Text>
        </View>

        <View className="space-y-8">
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Contact Name {formData.contact_name.trim() || formData.contact_phone.trim() || formData.contact_email.trim() ? '*' : '(Optional)'}
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.contact_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter contact name"
              value={formData.contact_name}
              onChangeText={(value) => updateFormData('contact_name', value)}
              autoCapitalize="words"
            />
            {errors.contact_name && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.contact_name}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Phone Number
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.contact_phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter phone number"
              value={formData.contact_phone}
              onChangeText={(value) => updateFormData('contact_phone', value)}
              keyboardType="phone-pad"
            />
            {errors.contact_phone && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.contact_phone}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Email Address
            </Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                errors.contact_email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
              value={formData.contact_email}
              onChangeText={(value) => updateFormData('contact_email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.contact_email && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.contact_email}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Relationship (Optional)
            </Text>
            <TextInput
              className="border rounded-lg px-4 py-3 text-base border-gray-300"
              placeholder="e.g., Family, Friend, Partner"
              value={formData.relationship}
              onChangeText={(value) => updateFormData('relationship', value)}
              autoCapitalize="words"
            />
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
