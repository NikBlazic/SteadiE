import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatabaseService } from '../api/onboarding-data';
import { useAuth } from '../lib/auth-context';

const perks = [
  '14 days completely free — no credit card required',
  'Full access to journaling, check-ins, and community',
  'Progress insights and streak tracking',
  'After the trial: $4.99/month — cancel anytime before it ends',
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const startTrial = async () => {
    if (!user) {
      router.replace('/(tabs)/homepage');
      return;
    }
    setBusy(true);
    try {
      await DatabaseService.startFreeTrialAndCompleteSubscriptionOnboarding(user.id);
      router.replace('/(tabs)/homepage');
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Something went wrong',
        'Could not start your trial. Check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-100">
          <Text className="text-center text-sm font-medium text-emerald-900">
            SteadiE Plus includes everything you need — start with a free trial, no card upfront.
          </Text>
        </View>

        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Start your free trial
        </Text>

        <View className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 mb-6">
          <View className="items-center mb-1">
            <View className="rounded-full bg-[#008d72]/15 px-3 py-1 mb-3">
              <Text className="text-sm font-semibold text-[#008d72]">14-day free trial</Text>
            </View>
          </View>
          <View className="flex-row items-baseline justify-center mb-1">
            <Text className="text-4xl font-bold text-gray-900">$4.99</Text>
            <Text className="text-lg text-gray-600 ml-1">/ month</Text>
          </View>
          <Text className="text-center text-sm text-gray-500 mb-5">
            Billed only after your trial if you stay subscribed
          </Text>

          {perks.map((line) => (
            <View key={line} className="flex-row items-center gap-3 mb-3">
              <Ionicons name="checkmark-circle" size={22} color="#008d72" />
              <Text className="flex-1 text-base text-gray-800">{line}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="bg-[#008d72] rounded-xl py-4 px-6"
          onPress={startTrial}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-lg">
              Start 14-day free trial
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-xs text-gray-400 text-center mt-8 leading-5">
          By starting your trial you agree that SteadiE Plus will be $4.99/month after 14 days unless
          you cancel. No charges during the trial and no card required to begin.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
