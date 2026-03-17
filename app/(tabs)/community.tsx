import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommunityPost, type CommunityPostData } from '../../components/community/community-post';
import { NewPostModal, type NewPostData } from '../../components/community/new-post-modal';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

const GREEN = '#008d72';

type TabId = 'my-posts' | 'explore';

type DbCommunityPostRow = {
  id: number;
  user_id: string;
  created_at: string;
  title: string;
  content: string;
  likes: number;
  replies: number;
  hashtags: string[];
};

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : '?';
}

function slugHandle(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  return base.length > 0 ? base : 'anonymous';
}

function formatTimeAgo(iso: string) {
  const ts = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function parseHashtags(input: string): string[] {
  const cleaned = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^#/, ''))
    .filter(Boolean);

  return cleaned
    .map((t) => t.slice(0, 20)) // enforce max 20 chars
    .slice(0, 10); // enforce max 10 hashtags
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [myPosts, setMyPosts] = useState<CommunityPostData[]>([]);
  const [newPostModalVisible, setNewPostModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = useCallback((id: string) => {
    const postId = Number(id);
    if (!Number.isFinite(postId)) return;
    if (!user) return;

    const apply = (liked: boolean, likes: number) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked, likes } : p)));
      setMyPosts((prev) => prev.map((p) => (p.id === id ? { ...p, liked, likes } : p)));
    };

    (async () => {
      try {
        // Determine current state from local list (fast path)
        const current =
          posts.find((p) => p.id === id) ?? myPosts.find((p) => p.id === id);
        const currentlyLiked = !!current?.liked;
        const currentLikes = Math.max(0, Number(current?.likes ?? 0));

        if (currentlyLiked) {
          // Unlike: delete like row (idempotent) then decrement counter
          const { error: delError } = await supabase
            .from('community_post_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('community_post_id', postId);
          if (delError) throw delError;

          const newLikes = Math.max(0, currentLikes - 1);
          const { error: postError } = await supabase
            .from('community_posts')
            .update({ likes: newLikes })
            .eq('id', postId);
          if (postError) throw postError;

          apply(false, newLikes);
        } else {
          // Like: insert like row (unique constraint prevents duplicates) then increment counter
          const { error: insError } = await supabase.from('community_post_likes').insert({
            user_id: user.id,
            community_post_id: postId,
          });
          if (insError) throw insError;

          const newLikes = currentLikes + 1;
          const { error: postError } = await supabase
            .from('community_posts')
            .update({ likes: newLikes })
            .eq('id', postId);
          if (postError) throw postError;

          apply(true, newLikes);
        }
      } catch (e) {
        console.error('Error toggling like:', e);
      }
    })();
  }, [user, posts, myPosts]);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: rawPosts, error } = await supabase
        .from('community_posts')
        .select('id,user_id,created_at,title,content,likes,replies,hashtags')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const rows = (rawPosts ?? []) as DbCommunityPostRow[];
      const userIds = Array.from(new Set(rows.map((p) => p.user_id)));
      const postIds = rows.map((p) => p.id);

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

      const likedPostIds = new Set<number>();
      if (user?.id && postIds.length > 0) {
        const { data: likesRows, error: likesError } = await supabase
          .from('community_post_likes')
          .select('community_post_id')
          .eq('user_id', user.id)
          .in('community_post_id', postIds);
        if (likesError) throw likesError;
        (likesRows ?? []).forEach((r: any) => likedPostIds.add(Number(r.community_post_id)));
      }

      const mapped: CommunityPostData[] = rows.map((p) => {
        const displayName = profileByUserId.get(p.user_id)?.display_name ?? 'Anonymous';
        return {
          id: String(p.id),
          name: displayName,
          handle: slugHandle(displayName),
          initial: getInitial(displayName),
          timeAgo: formatTimeAgo(p.created_at),
          title: p.title,
          content: p.content,
          hashtags: p.hashtags ?? [],
          comments: p.replies ?? 0,
          likes: p.likes ?? 0,
          liked: likedPostIds.has(p.id),
        };
      });

      setPosts(mapped);
      if (user?.id) {
        setMyPosts(mapped.filter((p) => rows.find((r) => String(r.id) === p.id)?.user_id === user.id));
      } else {
        setMyPosts([]);
      }
    } catch (e) {
      console.error('Error loading community posts:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  const handleNewPost = useCallback(
    async (data: NewPostData) => {
      if (!user) return;
      try {
        const { error } = await supabase.from('community_posts').insert({
          user_id: user.id,
          title: data.title.trim(),
          content: data.content.trim(),
          hashtags: parseHashtags(data.hashtags),
        });
        if (error) throw error;
        await loadPosts();
      } catch (e) {
        console.error('Error creating community post:', e);
      }
    },
    [user, loadPosts]
  );

  const filteredExplorePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const text = `${p.name} ${p.handle} ${p.title ?? ''} ${p.content} ${(p.hashtags ?? []).join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [posts, searchQuery]);

  const filteredMyPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return myPosts;
    return myPosts.filter((p) => {
      const text = `${p.name} ${p.handle} ${p.title ?? ''} ${p.content} ${(p.hashtags ?? []).join(' ')}`.toLowerCase();
      return text.includes(q);
    });
  }, [myPosts, searchQuery]);

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
          {activeTab === 'explore' &&
            (isLoading ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-[15px] text-gray-500 text-center">Loading…</Text>
              </View>
            ) : filteredExplorePosts.length === 0 ? (
              <View className="py-8 items-center justify-center">
                <Text className="text-[15px] text-gray-500 text-center">
                  No posts yet. Be the first to share something.
                </Text>
              </View>
            ) : (
              filteredExplorePosts.map((post, index) => (
                <CommunityPost
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  isFirst={index === 0}
                />
              ))
            ))}
          {activeTab === 'my-posts' && (
            <>
              <TouchableOpacity
                onPress={() => setNewPostModalVisible(true)}
                className="flex-row items-center justify-center gap-2 py-4 mb-4 rounded-xl border-2 border-dashed"
                style={{ borderColor: GREEN }}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={22} color={GREEN} />
                <Text className="text-[15px] font-semibold " style={{ color: GREEN }}>
                  New post
                </Text>
              </TouchableOpacity>
              {isLoading ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[15px] text-gray-500 text-center">Loading…</Text>
                </View>
              ) : filteredMyPosts.length === 0 ? (
                <View className="py-8 items-center justify-center">
                  <Text className="text-[15px] text-gray-500 text-center">
                    You haven't posted anything yet.
                    Share something with the community.
                  </Text>
                </View>
              ) : (
                filteredMyPosts.map((post, index) => (
                  <CommunityPost
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    isFirst={index === 0}
                  />
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      <NewPostModal
        visible={newPostModalVisible}
        onClose={() => setNewPostModalVisible(false)}
        onSubmit={handleNewPost}
      />
    </View>
  );
}
