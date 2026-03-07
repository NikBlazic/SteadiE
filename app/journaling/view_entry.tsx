import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

type EntryType = 'empty_page' | 'ideas' | 'mood_check_in';

export default function ViewEntryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id: rawId, type: rawType } = useLocalSearchParams<{ id: string; type: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericId = rawId ? (rawId.replace(/^(idea|mood)-/, '') || rawId) : null;
  const type: EntryType = rawType === 'ideas' || rawType === 'mood_check_in' ? rawType : 'empty_page';

  const fetchEntry = useCallback(async () => {
    if (!user || !numericId) {
      setError('Missing entry or user');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (type === 'empty_page') {
        const { data, error: fetchError } = await supabase
          .from('empty_page')
          .select('title, content')
          .eq('id', Number(numericId))
          .eq('user_id', user.id)
          .single();

        if (fetchError || !data) {
          setError('Entry not found');
          setTitle('');
          setContent('');
          return;
        }
        setTitle(data.title?.trim() || '');
        setContent(data.content?.trim() || '');
      } else if (type === 'ideas') {
        const { data, error: fetchError } = await supabase
          .from('journal_idea')
          .select('content')
          .eq('id', Number(numericId))
          .eq('user_id', user.id)
          .single();

        if (fetchError || !data) {
          setError('Entry not found');
          setTitle('');
          setContent('');
          return;
        }
        setTitle('project brainstorm.');
        setContent(data.content?.trim() || '');
      } else {
        const { data, error: fetchError } = await supabase
          .from('mood_check_in')
          .select('mood, note')
          .eq('id', Number(numericId))
          .eq('user_id', user.id)
          .single();

        if (fetchError || !data) {
          setError('Entry not found');
          setTitle('');
          setContent('');
          return;
        }
        setTitle('evening reflection.');
        const moodLabel = data.mood != null ? `Mood: ${data.mood}\n\n` : '';
        setContent(moodLabel + (data.note?.trim() || ''));
      }
    } catch (e) {
      setError('Failed to load entry');
      setTitle('');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [user, numericId, type]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return (
    <>
      <StatusBar hidden={true} />
      <View className="flex-1 bg-white">
        {/* Back Button - same position as empty_page */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-6 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#008d72" />
        </TouchableOpacity>

        {loading ? (
          <View className="flex-1 items-center justify-center pt-28">
            <ActivityIndicator size="large" color="#008d72" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center pt-28 px-6">
            <Text className="text-gray-500 text-center">{error}</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          >
            <View className="flex-1 px-4 pt-28">
              {/* Title - read-only, same style as empty_page input */}
              <Text
                className="text-gray-900 text-2xl font-normal mb-4"
                style={{ color: '#000' }}
              >
                {title || 'Title'}
              </Text>

              {/* Content - read-only, same style as empty_page input */}
              <Text
                className="text-gray-900 text-base font-normal flex-1"
                style={{
                  color: '#000',
                  minHeight: 400,
                }}
              >
                {content || 'No content'}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
