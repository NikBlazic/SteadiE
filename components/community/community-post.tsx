import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const GREEN = '#008d72';
const GREY_MUTED = '#9CA3AF';

export interface CommunityPostData {
  id: string;
  name: string;
  handle: string;
  initial: string;
  timeAgo: string;
  title?: string;
  content: string;
  hashtags?: string[];
  comments: number;
  likes: number;
  liked?: boolean;
}

interface CommunityPostProps {
  post: CommunityPostData;
  onLike?: (id: string) => void;
  isFirst?: boolean;
}

function formatContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const isNumbered = /^\d+\.\s/.test(line);
    return (
      <Text
        key={i}
        className={`text-[15px] text-gray-900 leading-snug ${i > 0 ? 'mt-1' : ''} ${isNumbered ? 'pl-4' : ''}`}
      >
        {line}
      </Text>
    );
  });
}

function formatHashtags(hashtags?: string[]) {
  const tags = (hashtags ?? []).filter(Boolean);
  if (tags.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-2 mt-3">
      {tags.map((t) => (
        <View key={t} className="px-2.5 py-1 rounded-full bg-gray-100">
          <Text className="text-[12px] text-gray-700">#{t}</Text>
        </View>
      ))}
    </View>
  );
}

export function CommunityPost({ post, onLike, isFirst }: CommunityPostProps) {
  const handleLike = () => onLike?.(post.id);

  return (
    <View className={`flex-row gap-4 pb-6 border-b border-gray-100 ${isFirst ? 'pt-0' : 'pt-5'}`}>
      <View
        className="h-11 w-11 rounded-full items-center justify-center shrink-0"
        style={{ backgroundColor: GREEN }}
      >
        <Text className="text-base font-bold text-white">{post.initial}</Text>
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-1.5 mt-0.5 mb-2">
          <Text className="text-[17px] font-bold text-gray-900">{post.name}</Text>
          <Text className="text-[13px] text-gray-400">·</Text>
          <Text className="text-[15px] text-gray-400">{post.timeAgo}</Text>
        </View>
        <View className="mb-4">
          {!!post.title?.trim() && (
            <Text className="text-[15px] font-semibold text-gray-900 leading-snug">
              {post.title.trim()}
            </Text>
          )}
          <View className={post.title?.trim() ? 'mt-1' : ''}>
            {formatContent(post.content)}
          </View>
          {formatHashtags(post.hashtags)}
        </View>
        <View className="flex-row items-center gap-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="chatbubble-outline" size={18} color={GREY_MUTED} />
            <Text className="text-[13px] text-gray-600">{post.comments}</Text>
          </View>
          <TouchableOpacity
            onPress={handleLike}
            className="flex-row items-center gap-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name={post.liked ? 'heart' : 'heart-outline'}
              size={18}
              color={post.liked ? GREEN : GREY_MUTED}
            />
            <Text
              className="text-[13px]"
              style={{ color: post.liked ? GREEN : '#4B5563' }}
            >
              {post.likes}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
