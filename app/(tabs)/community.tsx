import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommunityPost, type CommunityPostData } from '../../components/community/community-post';

const GREEN = '#008d72';

const MOCK_POSTS: CommunityPostData[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    handle: 'sarahwellness',
    initial: 'S',
    timeAgo: '30m',
    content:
      "Reminder: Your anxiety doesn't define you. It's just one part of your experience. You are so much more than your worries.",
    comments: 45,
    likes: 342,
    liked: false,
  },
  {
    id: '2',
    name: 'James Miller',
    handle: 'jamesonmind',
    initial: 'J',
    timeAgo: '1h',
    content: `Three things I learned from therapy this week:
1. Progress isn't linear
2. Self-compassion is a skill
3. It's okay to rest

What did you learn?`,
    comments: 89,
    likes: 567,
    liked: true,
  },
  {
    id: '3',
    name: 'Mia Johnson',
    handle: 'miamindful',
    initial: 'M',
    timeAgo: '2h',
    content:
      'Started my morning with 10 minutes of breathing exercises. Feeling more grounded already. Small steps add up.',
    comments: 23,
    likes: 189,
    liked: false,
  },
];

type TabId = 'my-posts' | 'explore';

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<CommunityPostData[]>(MOCK_POSTS);

  const handleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              likes: p.liked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  }, []);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-4">
          <Text
            className="text-[26px] font-bold tracking-tight"
            style={{ color: GREEN }}
          >
            community.
          </Text>
        </View>

        {/* Search */}
        <View className="px-6 pb-4">
          <View className="flex-row items-center rounded-xl bg-gray-100 px-4 py-3">
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-[15px] text-gray-900"
              placeholder="Search community"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Tabs */}
        <View className="px-6 flex-row justify-center gap-32 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => setActiveTab('my-posts')}
            className="pb-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-[15px] font-semibold"
              style={{
                color: activeTab === 'my-posts' ? GREEN : '#6B7280',
              }}
            >
              My Posts
            </Text>
            {activeTab === 'my-posts' && (
              <View
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: GREEN }}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('explore')}
            className="pb-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-[15px] font-semibold"
              style={{
                color: activeTab === 'explore' ? GREEN : '#6B7280',
              }}
            >
              Explore
            </Text>
            {activeTab === 'explore' && (
              <View
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: GREEN }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Feed */}
        <View className="px-6 pt-6">
          {(activeTab === 'explore' ? posts : []).map((post, index) => (
            <CommunityPost key={post.id} post={post} onLike={handleLike} isFirst={index === 0} />
          ))}
          {activeTab === 'my-posts' && (
            <View className="py-12 items-center">
              <Text className="text-[15px] text-gray-500">
                You haven't posted yet. Share something with the community.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
