import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

const GREEN = '#008d72';
const MAX_CONTENT_LENGTH = 750;

export interface NewPostData {
  title: string;
  content: string;
  hashtags: string;
}

interface NewPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: NewPostData) => Promise<void> | void;
}

export function NewPostModal({
  visible,
  onClose,
  onSubmit,
}: NewPostModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string>('You');

  const canPost = !!user && title.trim().length > 0 && content.trim().length > 0 && !isSubmitting;
  const contentCount = content.length;

  const initial = useMemo(() => {
    const t = displayName.trim();
    return t.length > 0 ? t[0]!.toUpperCase() : 'Y';
  }, [displayName]);

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      if (!visible) return;
      if (!user) {
        setDisplayName('Guest');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('user_basic_info')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        if (!isCancelled) setDisplayName(data?.display_name || 'You');
      } catch {
        if (!isCancelled) setDisplayName('You');
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [visible, user]);

  const resetFields = useCallback(() => {
    setTitle('');
    setContent('');
    setHashtags('');
  }, []);

  const handlePost = useCallback(async () => {
    if (!canPost) {
      if (!user) Alert.alert('Error', 'You must be logged in to post.');
      return;
    }
    const rawTags = hashtags.trim();
    if (rawTags.length > 0) {
      const tags = rawTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ''));
      if (tags.length > 10) {
        Alert.alert('Too many hashtags', 'You can add up to 10 hashtags per post.');
        return;
      }
      const tooLong = tags.find((t) => t.length > 20);
      if (tooLong) {
        Alert.alert(
          'Hashtag too long',
          'Each hashtag must be 20 characters or less.'
        );
        return;
      }
    }
    try {
      setIsSubmitting(true);
      await onSubmit?.({
        title: title.trim(),
        content: content.trim(),
        hashtags: hashtags.trim(),
      });
      resetFields();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [canPost, user, onSubmit, title, content, hashtags, resetFields, onClose]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetFields();
    onClose();
  }, [isSubmitting, resetFields, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting}
            hitSlop={12}
            className="p-2 -ml-2"
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-row items-baseline">
            <Text className="text-[17px] font-bold italic" style={{ color: GREEN }}>
              new post.
            </Text>
          </View>
          <Pressable
            onPress={handlePost}
            disabled={!canPost}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: canPost ? GREEN : '#E5E7EB',
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className="text-[15px] font-semibold"
                style={{ color: canPost ? '#fff' : '#6B7280' }}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* User row */}
          <View className="flex-row items-center gap-3 px-6 pt-6 pb-4">
            <View
              className="h-11 w-11 rounded-full items-center justify-center"
              style={{ backgroundColor: GREEN }}
            >
              <Text className="text-base font-bold text-white">{initial}</Text>
            </View>
            <View>
              <Text className="text-[15px] font-semibold text-gray-900">{displayName}</Text>
              {!user && (
                <Text className="text-[12px] text-gray-400 mt-0.5">
                  Log in to create a post
                </Text>
              )}
            </View>
          </View>

          {/* Title */}
          <View className="px-6 pb-4">
            <Text className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
              TITLE
            </Text>
            <TextInput
              className="rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-900"
              placeholder="Give your post a title..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Content */}
          <View className="px-6 pb-4">
            <Text className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
              CONTENT
            </Text>
            <View className="relative">
              <TextInput
                className="rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-900 min-h-[120]"
                placeholder="What's on your mind?"
                placeholderTextColor="#9CA3AF"
                value={content}
                onChangeText={(t) => setContent(t.length <= MAX_CONTENT_LENGTH ? t : content)}
                multiline
                textAlignVertical="top"
                editable={!isSubmitting}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View className="absolute bottom-3 right-3">
                <Text className="text-[12px] text-gray-400">
                  {contentCount}/{MAX_CONTENT_LENGTH}
                </Text>
              </View>
            </View>
          </View>

          {/* Hashtags */}
          <View className="px-6 pb-6">
            <Text className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
              # HASHTAGS
            </Text>
            <TextInput
              className="rounded-xl border border-gray-200 px-4 py-3 text-[15px] text-gray-900"
              placeholder="wellness, mindfulness, selfcare"
              placeholderTextColor="#9CA3AF"
              value={hashtags}
              onChangeText={setHashtags}
              editable={!isSubmitting}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="text-[12px] text-gray-400 mt-1.5">Separate with commas</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
