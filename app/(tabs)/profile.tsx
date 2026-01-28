'use client';

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
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

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-lg text-gray-700">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-2xl font-bold mb-2 text-gray-900">No profile yet</Text>
        <Text className="text-center text-gray-600 mb-6">
          You&apos;re not signed in. Go to the Home tab to create an account or sign in.
        </Text>
      </View>
    );
  }

  const hasData =
    profileData?.username ||
    profileData?.age ||
    profileData?.gender ||
    profileData?.country ||
    profileData?.addictionType;

  const displayName = profileData?.username || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    try {
      await signOut();
      // Force redirect to sign in page (home tab)
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to log out. Please try again.');
    }
  };

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings will be available soon.');
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ backgroundColor: '#008d72' }} className="pt-16 pb-8 px-6">
        <Text className="text-white text-3xl font-bold">{displayName}</Text>
        {profileData?.country && (
          <Text className="text-white/80 text-base mt-1">{profileData.country}</Text>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <View className="items-center justify-center py-16 px-6">
            <Text className="text-gray-500 text-center text-base">
              No profile information available yet. Complete onboarding to see your profile details.
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

            {/* Settings Button */}
            <TouchableOpacity
              className="rounded-2xl py-4 items-center justify-center mb-3"
              style={{ backgroundColor: '#008d72' }}
              onPress={handleSettingsPress}
            >
              <Text className="text-white font-semibold text-base">Settings</Text>
            </TouchableOpacity>

            {/* Log out Button */}
            <TouchableOpacity
              className="py-4 items-center justify-center"
              onPress={handleLogout}
            >
              <Text className="text-gray-400 font-medium text-base">Log out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}