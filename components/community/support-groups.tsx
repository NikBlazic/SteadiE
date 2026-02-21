import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Group {
  id: number;
  name: string;
  members: number;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const groups: Group[] = [
  {
    id: 1,
    name: 'Anxiety Support',
    members: 1243,
    description: 'A safe space to share and cope',
    iconName: 'bulb-outline',
  },
  {
    id: 2,
    name: 'Mindful Living',
    members: 876,
    description: 'Daily mindfulness practices',
    iconName: 'heart-outline',
  },
  {
    id: 3,
    name: 'Better Sleep',
    members: 654,
    description: 'Tips for restful nights',
    iconName: 'moon-outline',
  },
];

export function SupportGroups() {
  return (
    <View className="mb-7">
      <View className="flex-row items-center justify-between mb-3.5">
        <Text className="text-[17px] font-bold text-gray-900">Support Groups</Text>
        <TouchableOpacity className="flex-row items-center gap-0.5" activeOpacity={0.7}>
          <Text className="text-[13px] font-semibold text-[#008d72]">See all</Text>
          <Ionicons name="arrow-forward" size={14} color="#008d72" />
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-6 px-6"
        contentContainerStyle={{ flexDirection: 'row', gap: 12, paddingBottom: 4 }}
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            className="shrink-0 w-[155px] rounded-3xl bg-gray-50 border border-gray-200 p-4 flex-col gap-3"
            activeOpacity={0.9}
          >
            <View className="h-11 w-11 rounded-2xl bg-gray-100 items-center justify-center">
              <Ionicons name={group.iconName} size={20} color="#008d72" />
            </View>
            <View>
              <Text className="text-[13px] font-bold text-gray-900 leading-tight">{group.name}</Text>
              <Text className="text-[11px] text-gray-500 mt-1 leading-snug">{group.description}</Text>
            </View>
            <View className="flex-row items-center gap-1.5 mt-auto pt-1">
              <View className="flex-row">
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    className={`h-5 w-5 rounded-full border-2 border-gray-50 ${
                      i > 0 ? '-ml-2' : ''
                    }`}
                    style={{ backgroundColor: 'rgba(0, 141, 114, 0.2)' }}
                  />
                ))}
              </View>
              <Text className="text-[11px] text-gray-500 font-medium">
                {group.members.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
