'use client';

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';

interface ProfileData {
  username: string | null;
  age: number | null;
  gender: string | null;
  country: string | null;
  addictionType: string | null;
  severity: string | null;
  frequency: string | null;
  goal: string | null;
  recentFeeling: string | null;
  readiness: string | null;
}

const formatValue = (value: string | null): string => {
  if (!value) return 'Not set';
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [basicInfo, userData, addictionInfo, mentalHealthInfo, motivationInfo] =
          await Promise.all([
            DatabaseService.getUserBasicInfo(user.id),
            DatabaseService.getUserData(user.id),
            DatabaseService.getUserAddictionInfo(user.id),
            DatabaseService.getUserMentalHealthInfo(user.id),
            DatabaseService.getUserMotivation(user.id),
          ]);

        setProfileData({
          username: basicInfo?.display_name || null,
          age: userData?.age || null,
          gender: userData?.gender || null,
          country: basicInfo?.country_region || null,
          addictionType: addictionInfo?.addiction_type || null,
          severity: addictionInfo?.severity || null,
          frequency: addictionInfo?.frequency || null,
          goal: addictionInfo?.goal || null,
          recentFeeling: mentalHealthInfo?.recent_feeling || null,
          readiness: motivationInfo?.readiness || null,
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-lg text-gray-700">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-2xl font-bold mb-2 text-gray-900">Not signed in</Text>
        <Text className="text-center text-gray-600">
          Sign in to view your settings.
        </Text>
      </View>
    );
  }

  const hasAnyInfo =
    profileData?.age ||
    profileData?.gender ||
    profileData?.addictionType ||
    profileData?.severity ||
    profileData?.frequency ||
    profileData?.goal ||
    profileData?.recentFeeling ||
    profileData?.readiness;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!hasAnyInfo ? (
          <View className="items-center justify-center py-16 px-6">
            <Text className="text-gray-500 text-center text-base">
              No profile information yet. Complete onboarding to see your details here.
            </Text>
          </View>
        ) : (
          <View className="px-5 py-6">
            {/* Basic Information */}
            {(profileData?.age || profileData?.gender) && (
              <View className="mb-6">
                <Text style={{ color: '#008d72' }} className="text-sm font-semibold uppercase tracking-wide mb-3">
                  Basic Information
                </Text>
                <View className="bg-gray-50 rounded-2xl overflow-hidden">
                  {profileData.age && (
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                      <Text className="text-gray-500 text-base">Age</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {profileData.age}
                      </Text>
                    </View>
                  )}
                  {profileData.gender && (
                    <View className="flex-row justify-between items-center px-4 py-4">
                      <Text className="text-gray-500 text-base">Gender</Text>
                      <Text className="text-gray-900 font-medium text-base capitalize">
                        {profileData.gender}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Addiction Information */}
            {(profileData?.addictionType ||
              profileData?.severity ||
              profileData?.frequency ||
              profileData?.goal) && (
              <View className="mb-6">
                <Text style={{ color: '#008d72' }} className="text-sm font-semibold uppercase tracking-wide mb-3">
                  Addiction Information
                </Text>
                <View className="bg-gray-50 rounded-2xl overflow-hidden">
                  {profileData.addictionType && (
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                      <Text className="text-gray-500 text-base">Type</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {profileData.addictionType}
                      </Text>
                    </View>
                  )}
                  {profileData.severity && (
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                      <Text className="text-gray-500 text-base">Severity</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {formatValue(profileData.severity)}
                      </Text>
                    </View>
                  )}
                  {profileData.frequency && (
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                      <Text className="text-gray-500 text-base">Frequency</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {formatValue(profileData.frequency)}
                      </Text>
                    </View>
                  )}
                  {profileData.goal && (
                    <View className="flex-row justify-between items-center px-4 py-4">
                      <Text className="text-gray-500 text-base">Goal</Text>
                      <Text className="text-gray-900 font-medium text-base text-right" style={{ flex: 1, marginLeft: 16 }}>
                        {profileData.goal}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Mental Health & Motivation */}
            {(profileData?.recentFeeling || profileData?.readiness) && (
              <View className="mb-6">
                <Text style={{ color: '#008d72' }} className="text-sm font-semibold uppercase tracking-wide mb-3">
                  Mental Health & Motivation
                </Text>
                <View className="bg-gray-50 rounded-2xl overflow-hidden">
                  {profileData.recentFeeling && (
                    <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100">
                      <Text className="text-gray-500 text-base">Recent Feeling</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {formatValue(profileData.recentFeeling)}
                      </Text>
                    </View>
                  )}
                  {profileData.readiness && (
                    <View className="flex-row justify-between items-center px-4 py-4">
                      <Text className="text-gray-500 text-base">Readiness</Text>
                      <Text className="text-gray-900 font-medium text-base">
                        {formatValue(profileData.readiness)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
