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
const MAX_REPLY_LENGTH = 1000;

type ReplyTabId = 'comments' | 'reply';

export interface ReplyModalTarget {
  postId: string;
  postTitle: string;
}

type DbCommunityReplyRow = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  community_post_id: number;
};

type ReplyItem = {
  id: string;
  userId: string;
  displayName: string;
  initial: string;
  timeAgo: string;
  content: string;
};

function formatTimeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : '?';
}

interface ReplyModalProps {
  visible: boolean;
  target: ReplyModalTarget | null;
  onClose: () => void;
  onSubmit?: (content: string, target: ReplyModalTarget) => Promise<void> | void;
}

export function ReplyModal({ visible, target, onClose, onSubmit }: ReplyModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReplyTabId>('comments');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState<string>('You');
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [replies, setReplies] = useState<ReplyItem[]>([]);

  const canPost =
    !!user && !!target && content.trim().length > 0 && content.length <= MAX_REPLY_LENGTH && !isSubmitting;
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

  useEffect(() => {
    if (!visible) setContent('');
  }, [visible]);

  const loadReplies = useCallback(async () => {
    if (!target) return;
    const postId = Number(target.postId);
    if (!Number.isFinite(postId)) return;

    setIsLoadingReplies(true);
    try {
      const { data: rawReplies, error } = await supabase
        .from('community_replies')
        .select('id,user_id,content,created_at,likes,community_post_id')
        .eq('community_post_id', postId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const rows = (rawReplies ?? []) as DbCommunityReplyRow[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

      const profileByUserId = new Map<string, { display_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('user_basic_info')
          .select('user_id,display_name')
          .in('user_id', userIds);
        if (profileError) throw profileError;
        (profiles ?? []).forEach((p: any) => {
          profileByUserId.set(String(p.user_id), { display_name: p.display_name ?? null });
        });
      }

      const mapped: ReplyItem[] = rows.map((r) => {
        const name = profileByUserId.get(r.user_id)?.display_name ?? 'Anonymous';
        return {
          id: String(r.id),
          userId: r.user_id,
          displayName: name,
          initial: getInitial(name),
          timeAgo: formatTimeAgo(r.created_at),
          content: r.content,
        };
      });

      setReplies(mapped);
    } catch (e) {
      console.error('Error loading replies:', e);
      setReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [target]);

  useEffect(() => {
    if (!visible) return;
    if (!target) return;
    setActiveTab('comments');
    loadReplies();
  }, [visible, target?.postId, loadReplies]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setContent('');
    onClose();
  }, [isSubmitting, onClose]);

  const handlePost = useCallback(async () => {
    if (!target) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to reply.');
      return;
    }
    if (!canPost) return;
    try {
      setIsSubmitting(true);
      await onSubmit?.(content.trim(), target);
      setContent('');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [target, user, canPost, onSubmit, content, onClose]);

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
          <Text className="text-[17px] font-bold italic" style={{ color: GREEN }}>
            reply.
          </Text>
          <Pressable onPress={handlePost} disabled={!canPost} hitSlop={8} className="px-2 py-2">
            {isSubmitting ? (
              <ActivityIndicator color={GREEN} />
            ) : (
              <Text
                className="text-[16px] font-semibold"
                style={{ color: canPost ? GREEN : '#C4C4C4' }}
              >
                Post
              </Text>
            )}
          </Pressable>
        </View>

        {/* Tabs */}
        <View className="px-6">
          <View className="flex-row justify-between">
            <TouchableOpacity
              onPress={() => setActiveTab('comments')}
              className="flex-1 items-center py-3"
              activeOpacity={0.7}
            >
              <Text
                className="text-[15px] font-semibold"
                style={{ color: activeTab === 'comments' ? GREEN : '#9CA3AF' }}
              >
                Comments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('reply')}
              className="flex-1 items-center py-3"
              activeOpacity={0.7}
            >
              <Text
                className="text-[15px] font-semibold"
                style={{ color: activeTab === 'reply' ? GREEN : '#9CA3AF' }}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>
          <View className="h-px bg-gray-100" />
          <View className="relative h-0.5">
            <View
              className="absolute bottom-0 h-0.5 w-1/2"
              style={{
                left: activeTab === 'comments' ? '0%' : '50%',
                backgroundColor: GREEN,
              }}
            />
          </View>
        </View>

        {activeTab === 'comments' ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-6 pt-4">
              {isLoadingReplies ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[15px] text-gray-500 text-center">Loading…</Text>
                </View>
              ) : replies.length === 0 ? (
                <View className="py-10 items-center justify-center">
                  <Text className="text-[15px] text-gray-500 text-center">
                    No comments yet. Be the first to reply.
                  </Text>
                </View>
              ) : (
                replies.map((r) => (
                  <View key={r.id} className="flex-row gap-3 py-3">
                    <View
                      className="h-11 w-11 rounded-full items-center justify-center shrink-0"
                      style={{ backgroundColor: GREEN }}
                    >
                      <Text className="text-base font-bold text-white">{r.initial}</Text>
                    </View>
                    <View className="flex-1 min-w-0">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[16px] font-bold text-gray-900">{r.displayName}</Text>
                        <Text className="text-[14px] text-gray-400">{r.timeAgo}</Text>
                      </View>
                      <Text className="text-[15px] text-gray-800 mt-1 leading-snug">
                        {r.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        ) : (
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
              <View className="min-w-0">
                <Text className="text-[18px] font-semibold text-gray-900">{displayName}</Text>
                {!!target?.postTitle?.trim() && (
                  <Text className="text-[15px] text-gray-500 mt-1">
                    Replying to{' '}
                    <Text className="text-gray-900 font-semibold">{target.postTitle.trim()}</Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Comment */}
            <View className="px-6 pb-6">
              <Text className="text-[13px] font-semibold text-gray-500 tracking-wide mb-3">
                COMMENT
              </Text>
              <View className="relative">
                <TextInput
                  className="rounded-2xl border border-gray-200 px-4 py-4 text-[16px] text-gray-900 min-h-[170]"
                  placeholder="Write your reply..."
                  placeholderTextColor="#9CA3AF"
                  value={content}
                  onChangeText={(t) => setContent(t.length <= MAX_REPLY_LENGTH ? t : content)}
                  multiline
                  textAlignVertical="top"
                  editable={!isSubmitting}
                  autoCapitalize="sentences"
                  autoCorrect
                />
                <View className="absolute bottom-3 right-4">
                  <Text className="text-[13px]" style={{ color: '#C4C4C4' }}>
                    {contentCount}/{MAX_REPLY_LENGTH}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

