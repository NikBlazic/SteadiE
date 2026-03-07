'use client';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

const GREEN = '#008d72';

type JournalEntryType = 'empty_page' | 'ideas' | 'mood_check_in';

interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  excerpt: string;
  date: string;
  created_at: string;
}

function getIconName(type: JournalEntryType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'empty_page':
      return 'document-text-outline';
    case 'ideas':
      return 'bulb-outline';
    case 'mood_check_in':
      return 'heart-outline';
    default:
      return 'document-text-outline';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isThisWeek(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  const start = getStartOfWeek(now);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const [totalEntries, setTotalEntries] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setTotalEntries(0);
      setThisWeekCount(0);
      setRecentEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [emptyRes, ideasRes, moodRes] = await Promise.all([
        supabase
          .from('empty_page')
          .select('id, title, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('journal_idea')
          .select('id, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mood_check_in')
          .select('id, note, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const emptyEntries: JournalEntry[] = (emptyRes.data || []).map((row) => ({
        id: String(row.id),
        type: 'empty_page',
        title: row.title?.trim() || 'untitled.',
        excerpt: (row.content || '').trim().slice(0, 60) + ((row.content?.length || 0) > 60 ? '...' : ''),
        date: formatDate(row.created_at),
        created_at: row.created_at,
      }));

      const ideaEntries: JournalEntry[] = (ideasRes.data || []).map((row) => ({
        id: `idea-${row.id}`,
        type: 'ideas',
        title: 'project brainstorm.',
        excerpt: (row.content || '').trim().slice(0, 60) + ((row.content?.length || 0) > 60 ? '...' : ''),
        date: formatDate(row.created_at),
        created_at: row.created_at,
      }));

      const moodEntries: JournalEntry[] = (moodRes.data || []).map((row) => ({
        id: `mood-${row.id}`,
        type: 'mood_check_in',
        title: 'evening reflection.',
        excerpt: (row.note || '').trim().slice(0, 60) || 'Mood check-in entry.',
        date: formatDate(row.created_at),
        created_at: row.created_at,
      }));

      const all: JournalEntry[] = [...emptyEntries, ...ideaEntries, ...moodEntries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTotalEntries(all.length);
      setThisWeekCount(all.filter((e) => isThisWeek(e.created_at)).length);
      setRecentEntries(all.slice(0, 20));
    } catch (e) {
      console.error('Error fetching history:', e);
      setTotalEntries(0);
      setThisWeekCount(0);
      setRecentEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-16 pb-8">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-bold" style={{ color: GREEN }}>
              history.
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.push('/journaling/calendar' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={24} color={GREEN} />
          </TouchableOpacity>
        </View>

        {/* Summary cards */}
        <View className="flex-row gap-3 mb-6">
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: GREEN }}
          >
            <Text className="text-sm font-medium text-white/80">total entries</Text>
            <Text className="text-2xl font-bold text-white mt-1">
              {loading ? '—' : totalEntries}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl p-4 bg-gray-100">
            <Text className="text-sm font-medium text-gray-500">this week</Text>
            <Text className="text-2xl font-bold mt-1" style={{ color: GREEN }}>
              {loading ? '—' : thisWeekCount}
            </Text>
          </View>
        </View>

        {/* Recent Journals */}
        <Text className="text-lg font-semibold text-gray-800 mb-4">Recent Journals</Text>

        {loading ? (
          <Text className="text-gray-500 py-4">Loading...</Text>
        ) : recentEntries.length === 0 ? (
          <Text className="text-gray-500 py-4">No journal entries yet.</Text>
        ) : (
          <View className="gap-3">
            {recentEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                className="flex-row items-center rounded-2xl p-4 border border-gray-200 bg-white"
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/journaling/view_entry',
                    params: { id: entry.id, type: entry.type },
                  } as any);
                }}
              >
                <View className="w-10 h-10 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: `${GREEN}1A` }}>
                  <Ionicons name={getIconName(entry.type)} size={20} color={GREEN} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold" style={{ color: GREEN }} numberOfLines={1}>
                    {entry.title}
                    {!entry.title.endsWith('.') ? '.' : ''}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                    {entry.excerpt || 'No content'}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">{entry.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
