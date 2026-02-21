'use client';

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { DatabaseService } from '../../api/onboarding-data';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('Anonymous');
  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasicDisplay = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const basicInfo = await DatabaseService.getUserBasicInfo(user.id);
        setDisplayName(basicInfo?.display_name || 'Anonymous');
        setCountry(basicInfo?.country_region || null);
      } catch (error) {
        console.error('Error fetching profile display:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBasicDisplay();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to log out. Please try again.');
    }
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings' as any);
  };

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

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View style={{ backgroundColor: '#008d72' }} className="pt-16 pb-8 px-6">
        <Text className="text-white text-5xl font-bold">{displayName}</Text>
        {country && (
          <Text className="text-white/80 text-xl mt-1">{country}</Text>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 py-6">
          {/* Settings Button */}
          <TouchableOpacity
            className="rounded-2xl py-4 items-center justify-center mb-3"
            style={{ backgroundColor: '#008d72' }}
            onPress={handleSettingsPress}
          >
            <Text className="text-white font-semibold text-base">Settings</Text>
          </TouchableOpacity>

          {/* Log out */}
          <TouchableOpacity
            className="py-4 items-center justify-center"
            onPress={handleLogout}
          >
            <Text className="text-gray-400 font-medium text-base">Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}