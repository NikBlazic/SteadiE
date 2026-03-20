'use client';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
const GREEN_LIGHT = 'rgba(0, 141, 114, 0.2)';

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

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  return toDateKey(d);
}

function formatSelectedDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const fetchEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
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
          .select('id, content, created_at, ideas(content)')
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
        date: '',
        created_at: row.created_at,
      }));
      const ideaEntries: JournalEntry[] = (ideasRes.data || []).map((row) => {
        const relatedIdea = (row as any).ideas;
        const ideaTitle = (relatedIdea?.[0]?.content || relatedIdea?.content || '').trim().replace(/[;]+$/, '');
        return {
          id: `idea-${row.id}`,
          type: 'ideas',
          title: ideaTitle || 'project brainstorm.',
          excerpt: (row.content || '').trim().slice(0, 60) + ((row.content?.length || 0) > 60 ? '...' : ''),
          date: '',
          created_at: row.created_at,
        };
      });
      const moodEntries: JournalEntry[] = (moodRes.data || []).map((row) => ({
        id: `mood-${row.id}`,
        type: 'mood_check_in',
        title: 'evening reflection.',
        excerpt: (row.note || '').trim().slice(0, 60) || 'Mood check-in entry.',
        date: '',
        created_at: row.created_at,
      }));

      const all = [...emptyEntries, ...ideaEntries, ...moodEntries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setEntries(all);
    } catch (e) {
      console.error('Error fetching entries for calendar:', e);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries])
  );

  const datesWithEntries = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(getDateKeyFromIso(e.created_at)));
    return set;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const total = startPad + daysInMonth;
    const rows = Math.ceil(total / 7);
    const cells: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const remaining = rows * 7 - cells.length;
    for (let i = 0; i < remaining; i++) cells.push(null);
    return { cells, year: y, month: m };
  }, [viewDate]);

  const selectedKey = toDateKey(selectedDate);
  const entriesForSelected = useMemo(
    () => entries.filter((e) => getDateKeyFromIso(e.created_at) === selectedKey),
    [entries, selectedKey]
  );

  const goPrevMonth = () => {
    setViewDate((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() - 1);
      return next;
    });
  };

  const goNextMonth = () => {
    setViewDate((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + 1);
      return next;
    });
  };

  const onSelectDay = (day: number | null) => {
    if (day === null) return;
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  };

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-16 pb-4">
        <View className="flex-row items-baseline">
          <Text className="text-3xl font-bold" style={{ color: GREEN }}>
            calendar.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Month navigation */}
        <View className="flex-row items-center justify-center mb-4 px-4">
          <TouchableOpacity onPress={goPrevMonth} className="p-2" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black mx-4 min-w-[160px] text-center">
            {monthLabel}
          </Text>
          <TouchableOpacity onPress={goNextMonth} className="p-2" hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-forward" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View className="flex-row px-2 mb-2">
          {DAYS.map((day) => (
            <View key={day} className="flex-1 items-center">
              <Text className="text-xs text-gray-500">{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="px-2 mb-6">
          <View className="flex-row flex-wrap">
            {calendarDays.cells.map((day, index) => {
              const isSelected =
                day !== null &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === calendarDays.month &&
                selectedDate.getFullYear() === calendarDays.year;
              const dateKey =
                day !== null
                  ? toDateKey(new Date(calendarDays.year, calendarDays.month, day))
                  : '';
              const hasEntries = day !== null && datesWithEntries.has(dateKey);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onSelectDay(day)}
                  activeOpacity={0.7}
                  className="items-center justify-center rounded-xl mb-2"
                  style={{ width: `${100 / 7}%` }}
                >
                  <View
                    className="w-9 h-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: isSelected ? GREEN : hasEntries ? GREEN_LIGHT : 'transparent',
                    }}
                  >
                    {day !== null ? (
                      <Text
                        className="text-base font-medium"
                        style={{ color: isSelected ? '#fff' : '#000' }}
                      >
                        {day}
                      </Text>
                    ) : null}
                  </View>
                  {day !== null && hasEntries && !isSelected ? (
                    <View
                      className="w-1.5 h-1.5 rounded-full mt-0.5"
                      style={{ backgroundColor: GREEN }}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected date label */}
        <Text className="text-lg font-bold text-black px-5 mb-4">
          {formatSelectedDateLabel(selectedDate)}
        </Text>

        {/* Entries for selected date */}
        {loading ? (
          <Text className="text-gray-500 px-5 py-4">Loading...</Text>
        ) : entriesForSelected.length === 0 ? (
          <Text className="text-gray-500 px-5 py-4">No entries for this day.</Text>
        ) : (
          <View className="px-5 gap-3">
            {entriesForSelected.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                className="flex-row items-center rounded-2xl p-4 border border-gray-200 bg-white"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/journaling/view_entry',
                    params: { id: entry.id, type: entry.type },
                  } as any);
                }}
              >
                <View
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: GREEN_LIGHT }}
                >
                  <Ionicons name={getIconName(entry.type)} size={20} color={GREEN} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-base font-semibold" style={{ color: GREEN }} numberOfLines={1}>
                    {entry.title}
                    {entry.type === 'ideas' ? '' : (!entry.title.endsWith('.') ? '.' : '')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
                    {entry.excerpt || 'No content'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
