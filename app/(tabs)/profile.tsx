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
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="bg-white pb-8 pt-16 px-6">
        <View className="items-center">
          <View className="w-28 h-28 rounded-full bg-emerald-500 items-center justify-center mb-4 shadow-lg">
            <Text className="text-4xl font-bold text-white">{initials}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {displayName}
          </Text>
          {profileData?.country && (
            <Text className="text-gray-500 text-base">{profileData.country}</Text>
          )}
        </View>
      </View>

      {!hasData ? (
        <View className="items-center justify-center py-16 px-6">
          <Text className="text-gray-600 text-center text-base">
            No profile information available yet. Complete onboarding to see your profile
            details.
          </Text>
        </View>
      ) : (
        <View className="px-6 py-6">
          {/* Basic Information */}
          {(profileData?.age || profileData?.gender) && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Basic Information</Text>
              <View>
                {profileData.age && (
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">Age</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {profileData.age}
                    </Text>
                  </View>
                )}
                {profileData.gender && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 text-base">Gender</Text>
                    <Text className="text-gray-900 font-semibold text-base capitalize">
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
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Addiction Information</Text>
              <View>
                {profileData.addictionType && (
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">Type</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {profileData.addictionType}
                    </Text>
                  </View>
                )}
                {profileData.severity && (
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">Severity</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {formatValue(profileData.severity)}
                    </Text>
                  </View>
                )}
                {profileData.frequency && (
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">Frequency</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {formatValue(profileData.frequency)}
                    </Text>
                  </View>
                )}
                {profileData.goal && (
                  <View className="flex-row justify-between items-start">
                    <Text className="text-gray-600 text-base" style={{ flex: 1, marginRight: 16 }}>Goal</Text>
                    <Text className="text-gray-900 font-semibold text-base" style={{ flex: 1, textAlign: 'right' }}>
                      {profileData.goal}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Mental Health & Motivation */}
          {(profileData?.recentFeeling || profileData?.readiness) && (
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Mental Health & Motivation
              </Text>
              <View>
                {profileData.recentFeeling && (
                  <View className="flex-row justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <Text className="text-gray-600 text-base">Recent Feeling</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {formatValue(profileData.recentFeeling)}
                    </Text>
                  </View>
                )}
                {profileData.readiness && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 text-base">Readiness</Text>
                    <Text className="text-gray-900 font-semibold text-base">
                      {formatValue(profileData.readiness)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bottom actions */}
      <View className="px-6 pt-2 pb-10 flex-row">
        <TouchableOpacity
          className="flex-1 bg-red-500 rounded-xl py-3 items-center justify-center mr-3"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-base">Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 rounded-xl py-3 items-center justify-center border"
          style={{ borderColor: '#008d72' }}
          onPress={handleSettingsPress}
        >
          <Text className="font-semibold text-base" style={{ color: '#008d72' }}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}