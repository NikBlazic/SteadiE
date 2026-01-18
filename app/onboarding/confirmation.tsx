import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import { useAuth } from '../../lib/auth-context';
import { useOnboarding } from '../../lib/onboarding-context';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data from database if not in context
  useEffect(() => {
    const loadAllData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load all data from database
        const [
          basicInfoData,
          userDataFromDb,
          reasonData,
          addictionData,
          mentalHealthData,
          motivationData,
          lifestyleData,
          supportData,
          contactData,
        ] = await Promise.all([
          DatabaseService.getUserBasicInfo(user.id),
          DatabaseService.getUserData(user.id),
          DatabaseService.getUserReason(user.id),
          DatabaseService.getUserAddictionInfo(user.id),
          DatabaseService.getUserMentalHealthInfo(user.id),
          DatabaseService.getUserMotivation(user.id),
          DatabaseService.getUserLifestyleFactors(user.id),
          DatabaseService.getUserSupportPreferences(user.id),
          DatabaseService.getUserEmergencyContact(user.id),
        ]);

        // Update context with all loaded data
        if (basicInfoData) {
          updateData('basicInfo', basicInfoData);
        }
        if (userDataFromDb) {
          updateData('user', userDataFromDb);
        }
        if (reasonData) {
          updateData('userReason', reasonData);
        }
        if (addictionData) {
          updateData('addictionInfo', addictionData);
        }
        if (mentalHealthData) {
          updateData('mentalHealthInfo', mentalHealthData);
        }
        if (motivationData) {
          updateData('motivation', motivationData);
        }
        if (lifestyleData) {
          updateData('lifestyleFactors', lifestyleData);
        }
        if (supportData) {
          updateData('supportPreferences', supportData);
        }
        if (contactData) {
          updateData('emergencyContact', contactData);
        }
      } catch (error) {
        console.error('Error loading confirmation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [user, updateData]);

  const formatGender = (gender: string) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'prefer_not_to_say': return 'Prefer not to say';
      default: return gender;
    }
  };

  const formatSeverity = (severity: string) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const formatFeeling = (feeling: string) => {
    switch (feeling) {
      case 'good': return 'Good';
      case 'okay': return 'Okay';
      case 'struggling': return 'Struggling';
      case 'crisis': return 'In Crisis';
      default: return feeling;
    }
  };

  const formatReadiness = (readiness: string) => {
    switch (readiness) {
      case 'not_ready': return 'Not Ready';
      case 'thinking_about_it': return 'Thinking About It';
      case 'ready': return 'Ready';
      case 'very_ready': return 'Very Ready';
      default: return readiness;
    }
  };

  const formatQuality = (quality: string) => {
    return quality.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatSupportType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatNotificationFrequency = (freq: string) => {
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  const getReasonLabel = (value: string) => {
    const reasonLabels: Record<string, string> = {
      'stop_addiction': 'Stop Addiction',
      'reduce_substance_use': 'Reduce Substance Use',
      'maintain_sobriety': 'Maintain Sobriety',
      'mental_health_support': 'Mental Health Support',
      'anxiety_management': 'Manage Anxiety',
      'depression_help': 'Cope with Depression',
      'stress_relief': 'Relieve Stress',
      'build_healthy_habits': 'Build Healthy Habits',
      'improve_sleep': 'Improve Sleep Quality',
      'increase_motivation': 'Increase Motivation',
      'track_progress': 'Track My Progress',
      'daily_support': 'Get Daily Support',
      'relapse_prevention': 'Prevent Relapse',
      'emotional_regulation': 'Regulate Emotions',
      'general_wellness': 'General Wellness',
      'other': 'Other',
    };
    return reasonLabels[value] || value;
  };

  const getAddictionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'alcohol': 'Alcohol',
      'tobacco': 'Tobacco/Nicotine',
      'cannabis': 'Cannabis/Marijuana',
      'prescription_drugs': 'Prescription Drugs',
      'illegal_drugs': 'Illegal Drugs',
      'gambling': 'Gambling',
      'internet': 'Internet/Social Media',
      'other': 'Other',
    };
    return typeLabels[type] || type;
  };

  const handleConfirm = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!data.user || !data.basicInfo) {
      Alert.alert('Error', 'Missing required onboarding data');
      return;
    }

    setIsSaving(true);
    try {
      // Save all data to database
      if (data.userReason?.main_reason) {
        await DatabaseService.saveUserReason(user.id, data.userReason.main_reason);
      }

      if (data.addictionInfo) {
        await DatabaseService.saveUserAddictionInfo(user.id, {
          addiction_type: data.addictionInfo.addiction_type || '',
          severity: data.addictionInfo.severity || 'mild',
          frequency: data.addictionInfo.frequency || 'occasionally',
          goal: data.addictionInfo.goal || null,
        });
      }

      if (data.mentalHealthInfo) {
        await DatabaseService.saveUserMentalHealthInfo(user.id, {
          struggles: data.mentalHealthInfo.struggles || null,
          recent_feeling: data.mentalHealthInfo.recent_feeling || 'okay',
        });
      }

      if (data.motivation?.readiness) {
        await DatabaseService.saveUserMotivation(user.id, {
          readiness: data.motivation.readiness,
        });
      }

      if (data.lifestyleFactors) {
        await DatabaseService.saveUserLifestyleFactors(user.id, {
          sleep_quality: data.lifestyleFactors.sleep_quality || 'fair',
          stress_level: data.lifestyleFactors.stress_level || 'moderate',
          routine_stability: data.lifestyleFactors.routine_stability || 'somewhat_stable',
          relationships: data.lifestyleFactors.relationships || 'fair',
        });
      }

      if (data.supportPreferences) {
        await DatabaseService.saveUserSupportPreferences(user.id, {
          support_type: data.supportPreferences.support_type || [],
          notification_frequency: data.supportPreferences.notification_frequency || 'none',
        });
      }

      if (data.emergencyContact?.contact_name) {
        await DatabaseService.saveUserEmergencyContact(user.id, {
          contact_name: data.emergencyContact.contact_name,
          contact_phone: data.emergencyContact.contact_phone || null,
          contact_email: data.emergencyContact.contact_email || null,
          relationship: data.emergencyContact.relationship || null,
        });
      }

      // Save user data (age, gender) - these are required, so we know they exist
      await DatabaseService.saveUserData(user.id, {
        age: data.user.age!,
        gender: data.user.gender || 'prefer_not_to_say',
      });

      // Save basic info (display_name, country_region) - these are required, so we know they exist
      await DatabaseService.saveUserBasicInfo(user.id, {
        display_name: data.basicInfo.display_name || 'Anonymous',
        country_region: data.basicInfo.country_region || '',
        anonymous: data.basicInfo.anonymous ?? false,
      });

      // Mark onboarding as complete
      await DatabaseService.markOnboardingComplete(user.id);

      Alert.alert(
        'Success!',
        'Your information has been saved. Onboarding completed!',
        [
          {
            text: 'Continue to App',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      const errorMessage = error.message || error.error?.message || 'Failed to save your information. Please try again.';
      const errorCode = error.code || error.error?.code || '';
      Alert.alert(
        'Error',
        errorCode ? `${errorMessage} (Code: ${errorCode})` : errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (user) {
      try {
        await DatabaseService.updateOnboardingStatus(user.id, 'emergency-contact');
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    router.push('/onboarding/emergency-contact' as any);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading your information...</Text>
      </View>
    );
  }

  // Show error state if required data is missing
  if (!data.user || !data.basicInfo) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">No information to display</Text>
        <Text className="text-sm text-gray-500 mt-2 px-6 text-center">
          Please go back and complete the previous steps
        </Text>
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
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Your Information
          </Text>
          <Text className="text-lg text-gray-600">
            Please review your details before continuing
          </Text>
        </View>

        <View className="bg-gray-50 rounded-lg p-6 mb-8">
          <View className="space-y-4">
            {/* Basic Info */}
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">Basic Information</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                  <Text className="text-base font-medium text-gray-600">Username</Text>
                  <Text className="text-base text-gray-900">{data.basicInfo.display_name || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                  <Text className="text-base font-medium text-gray-600">Age</Text>
                  <Text className="text-base text-gray-900">{data.user.age} years old</Text>
                </View>
                <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                  <Text className="text-base font-medium text-gray-600">Gender</Text>
                  <Text className="text-base text-gray-900">
                    {formatGender(data.user.gender || '')}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-base font-medium text-gray-600">Country</Text>
                  <Text className="text-base text-gray-900">{data.basicInfo.country_region || 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* User Reasons */}
            {data.userReason?.main_reason && data.userReason.main_reason.length > 0 && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Reasons</Text>
                  <View className="space-y-2">
                    {data.userReason.main_reason.map((reason, index) => (
                      <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-200">
                        <Text className="text-base text-gray-900">
                          {getReasonLabel(reason)}
                        </Text>
                        <Text className="text-base text-[#000000] font-bold">✓</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Addiction Info */}
            {data.addictionInfo?.addiction_type && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">Addiction Information</Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                    <Text className="text-base font-medium text-gray-600">Type</Text>
                    <Text className="text-base text-gray-900">
                      {getAddictionTypeLabel(data.addictionInfo.addiction_type)}
                    </Text>
                  </View>
                  {data.addictionInfo.severity && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Severity</Text>
                      <Text className="text-base text-gray-900">
                        {formatSeverity(data.addictionInfo.severity)}
                      </Text>
                    </View>
                  )}
                  {data.addictionInfo.frequency && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Frequency</Text>
                      <Text className="text-base text-gray-900">
                        {formatFrequency(data.addictionInfo.frequency)}
                      </Text>
                    </View>
                  )}
                  {data.addictionInfo.goal && (
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-base font-medium text-gray-600">Goal</Text>
                      <Text className="text-base text-gray-900 flex-1 text-right ml-2">
                        {data.addictionInfo.goal}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              </>
            )}

            {/* Mental Health Info */}
            {data.mentalHealthInfo && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">Mental Health</Text>
                <View className="space-y-2">
                  {data.mentalHealthInfo.recent_feeling && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Recent Feeling</Text>
                      <Text className="text-base text-gray-900">
                        {formatFeeling(data.mentalHealthInfo.recent_feeling)}
                      </Text>
                    </View>
                  )}
                  {data.mentalHealthInfo.struggles && (
                    <View className="flex-row justify-between items-start py-2">
                      <Text className="text-base font-medium text-gray-600">Struggles</Text>
                      <Text className="text-base text-gray-900 flex-1 text-right ml-2">
                        {data.mentalHealthInfo.struggles}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              </>
            )}

            {/* Motivation */}
            {data.motivation?.readiness && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Motivation</Text>
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-base font-medium text-gray-600">Readiness</Text>
                    <Text className="text-base text-gray-900">
                      {formatReadiness(data.motivation.readiness)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Lifestyle Factors */}
            {data.lifestyleFactors && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                  <Text className="text-lg font-bold text-gray-900 mb-3">Lifestyle Factors</Text>
                <View className="space-y-2">
                  {data.lifestyleFactors.sleep_quality && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Sleep Quality</Text>
                      <Text className="text-base text-gray-900">
                        {formatQuality(data.lifestyleFactors.sleep_quality)}
                      </Text>
                    </View>
                  )}
                  {data.lifestyleFactors.stress_level && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Stress Level</Text>
                      <Text className="text-base text-gray-900">
                        {formatQuality(data.lifestyleFactors.stress_level)}
                      </Text>
                    </View>
                  )}
                  {data.lifestyleFactors.routine_stability && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Routine Stability</Text>
                      <Text className="text-base text-gray-900">
                        {formatQuality(data.lifestyleFactors.routine_stability)}
                      </Text>
                    </View>
                  )}
                  {data.lifestyleFactors.relationships && (
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-base font-medium text-gray-600">Relationships</Text>
                      <Text className="text-base text-gray-900">
                        {formatQuality(data.lifestyleFactors.relationships)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              </>
            )}

            {/* Support Preferences */}
            {data.supportPreferences && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">Support Preferences</Text>
                <View className="space-y-2">
                  {data.supportPreferences.support_type && data.supportPreferences.support_type.length > 0 && (
                    <View className="space-y-2">
                      <Text className="text-base font-medium text-gray-600 mb-2">Support Types</Text>
                      {data.supportPreferences.support_type.map((type, index) => (
                        <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-200">
                          <Text className="text-base text-gray-900">
                            {formatSupportType(type)}
                          </Text>
                          <Text className="text-base text-[#000000] font-bold">✓</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {data.supportPreferences.notification_frequency && (
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-base font-medium text-gray-600">Notification Frequency</Text>
                      <Text className="text-base text-gray-900">
                        {formatNotificationFrequency(data.supportPreferences.notification_frequency)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              </>
            )}

            {/* Emergency Contact */}
            {data.emergencyContact?.contact_name && (
              <>
                <View className="my-4 px-4">
                  <View className="h-[2px] bg-black" />
                </View>
                <View className="mb-4">
                <Text className="text-lg font-bold text-gray-900 mb-3">Emergency Contact</Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                    <Text className="text-base font-medium text-gray-600">Name</Text>
                    <Text className="text-base text-gray-900">{data.emergencyContact.contact_name}</Text>
                  </View>
                  {data.emergencyContact.contact_phone && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Phone</Text>
                      <Text className="text-base text-gray-900">{data.emergencyContact.contact_phone}</Text>
                    </View>
                  )}
                  {data.emergencyContact.contact_email && (
                    <View className="flex-row justify-between items-center py-2 border-b border-gray-200">
                      <Text className="text-base font-medium text-gray-600">Email</Text>
                      <Text className="text-base text-gray-900">{data.emergencyContact.contact_email}</Text>
                    </View>
                  )}
                  {data.emergencyContact.relationship && (
                    <View className="flex-row justify-between items-center py-2">
                      <Text className="text-base font-medium text-gray-600">Relationship</Text>
                      <Text className="text-base text-gray-900">{data.emergencyContact.relationship}</Text>
                    </View>
                  )}
                </View>
              </View>
              </>
            )}
          </View>
        </View>

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
            className="bg-gray-200 rounded-lg py-4 px-6 mt-4"
            onPress={handleBack}
            disabled={isSaving}
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
