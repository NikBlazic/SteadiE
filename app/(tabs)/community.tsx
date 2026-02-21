import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { OnlineMembers } from '../../components/community/online-members';
import { SupportGroups } from '../../components/community/support-groups';
import { TopicChips } from '../../components/community/topic-chips';

export default function CommunityScreen() {
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header area */}
        <View className="px-6 pt-16">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-[13px] text-gray-500 tracking-wide">Welcome to the,</Text>
              <Text className="text-[26px] font-bold text-gray-900 leading-tight tracking-tight">Community</Text>
            </View>
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-2xl bg-[#008d72]"
                accessibilityLabel="Create new post"
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
        </View>

        {/* Scrollable content */}
        <View className="pt-2">
          <View className="mb-7">
            <TopicChips />
          </View>
          <View className="px-6">
            <OnlineMembers />
          </View>
          <View className="px-6">
            <SupportGroups />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
