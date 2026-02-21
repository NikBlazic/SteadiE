import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const members = [
  { id: 1, name: 'Sarah', initial: 'S', color: '#008d72' },
  { id: 2, name: 'James', initial: 'J', color: '#008d72' },
  { id: 3, name: 'Mia', initial: 'M', color: '#008d72' },
  { id: 4, name: 'Alex', initial: 'A', color: '#008d72' },
  { id: 5, name: 'Lily', initial: 'L', color: '#008d72' },
];

export function OnlineMembers() {
  return (
    <View className="mb-7">
      <View className="flex-row items-center justify-between mb-3.5">
        <Text className="text-[17px] font-bold text-gray-900">Online Now</Text>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-emerald-400" />
          <Text className="text-[12px] text-gray-500 font-medium">128 active</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', gap: 20 }}
      >
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            className="items-center gap-2"
            activeOpacity={0.7}
          >
            <View className="relative">
              <View
                className="h-[50px] w-[50px] rounded-full items-center justify-center"
                style={{ backgroundColor: `${member.color}B3` }}
              >
                <Text className="text-[15px] font-bold text-white">{member.initial}</Text>
              </View>
              <View className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-[2.5px] border-white" />
            </View>
            <Text className="text-[11px] text-gray-500 font-medium">{member.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
