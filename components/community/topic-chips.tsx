import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

interface Topic {
  id: string;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const topics: Topic[] = [
  { id: 'all', label: 'All', iconName: 'star' },
  { id: 'anxiety', label: 'Anxiety', iconName: 'bulb-outline' },
  { id: 'self-care', label: 'Self-Care', iconName: 'heart-outline' },
  { id: 'sleep', label: 'Sleep', iconName: 'moon-outline' },
  { id: 'stress', label: 'Stress', iconName: 'flame' },
  { id: 'mindfulness', label: 'Mindful', iconName: 'happy-outline' },
];

export function TopicChips() {
  const [active, setActive] = useState('all');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-6 px-6"
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 4, paddingLeft: 24}}
    >
      {topics.map((topic) => {
        const isActive = active === topic.id;
        return (
          <TouchableOpacity
            key={topic.id}
            onPress={() => setActive(topic.id)}
            className={`shrink-0 flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${
              isActive
                ? 'bg-[#008d72] border-[#008d72] shadow-sm'
                : 'bg-gray-50 border border-gray-200'
            }`}
            activeOpacity={0.7}
            style={isActive ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {}}
          >
            <Ionicons
              name={topic.iconName}
              size={14}
              color={isActive ? '#FFFFFF' : '#6B7280'}
            />
            <Text className={`text-[13px] font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
              {topic.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
