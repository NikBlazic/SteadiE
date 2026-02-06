'use client';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const QUOTE_STORAGE_KEY = 'daily_quote';
const QUOTE_DATE_KEY = 'daily_quote_date';

export default function HomeScreen() {
  const { user } = useAuth();
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [checkIns, setCheckIns] = useState<number>(0);
  const [avgMood, setAvgMood] = useState<string>('—');
  const [displayName, setDisplayName] = useState<string>('');
  const [quote, setQuote] = useState<{ text: string; author: string }>({
    text: "",
    author: ""
  });
  const today = new Date();
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const formatMood = (mood: number): string => {
    if (mood >= 4.5) return 'Very Happy';
    if (mood >= 3.5) return 'Happy';
    if (mood >= 2.5) return 'Neutral';
    if (mood >= 1.5) return 'Sad';
    return 'Very Sad';
  };

  const getTodayDateString = (): string => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  };

  const fetchRandomQuote = useCallback(async () => {
    try {
      // Get all quotes from the database
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('quote, author');

      if (error) {
        console.error('Error fetching quotes:', error);
        return;
      }

      if (quotes && quotes.length > 0) {
        // Select a random quote
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = {
          text: quotes[randomIndex].quote,
          author: quotes[randomIndex].author || 'Unknown'
        };

        // Store the quote and today's date
        await AsyncStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(randomQuote));
        await AsyncStorage.setItem(QUOTE_DATE_KEY, getTodayDateString());
        
        setQuote(randomQuote);
      }
    } catch (error) {
      console.error('Error fetching random quote:', error);
    }
  }, []);

  const loadDailyQuote = useCallback(async () => {
    try {
      const storedDate = await AsyncStorage.getItem(QUOTE_DATE_KEY);
      const todayDateString = getTodayDateString();

      // If no stored date or it's a different day, fetch a new quote
      if (!storedDate || storedDate !== todayDateString) {
        await fetchRandomQuote();
      } else {
        // Load the stored quote for today
        const storedQuote = await AsyncStorage.getItem(QUOTE_STORAGE_KEY);
        if (storedQuote) {
          setQuote(JSON.parse(storedQuote));
        } else {
          // Fallback: fetch a new quote if stored quote is missing
          await fetchRandomQuote();
        }
      }
    } catch (error) {
      console.error('Error loading daily quote:', error);
      // Fallback: try to fetch a new quote
      await fetchRandomQuote();
    }
  }, [fetchRandomQuote]);

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_basic_info')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        
        if (!userProfileError && userProfile) {
          setDisplayName(userProfile.display_name || 'Anonymous');
        }
      };
      fetchUserProfile();
      loadDailyQuote();
    }
  }, [user, loadDailyQuote]);

  const calculateStreak = (checkInDates: Date[]): number => {
    if (checkInDates.length === 0) return 0;

    // Normalize dates to midnight in user's timezone
    const normalizeDate = (date: Date): Date => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    // Get unique dates (one per day)
    const uniqueDates = new Set<number>();
    checkInDates.forEach(date => {
      const normalized = normalizeDate(date);
      uniqueDates.add(normalized.getTime());
    });

    // Convert to sorted array (most recent first)
    const sortedUniqueDates = Array.from(uniqueDates)
      .map(time => new Date(time))
      .sort((a, b) => b.getTime() - a.getTime());

    const today = normalizeDate(new Date());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if there's a check-in today or yesterday
    const hasToday = sortedUniqueDates.some(d => normalizeDate(d).getTime() === today.getTime());
    const hasYesterday = sortedUniqueDates.some(d => normalizeDate(d).getTime() === yesterday.getTime());

    // If no check-in today or yesterday, streak is 0
    if (!hasToday && !hasYesterday) {
      return 0;
    }

    // Start from today if there's a check-in today, otherwise start from yesterday
    let expectedDate = hasToday ? today : yesterday;
    let currentStreak = 0;

    // Count consecutive days backwards
    for (const checkInDate of sortedUniqueDates) {
      const normalizedCheckIn = normalizeDate(checkInDate);
      
      if (normalizedCheckIn.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate = new Date(expectedDate);
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (normalizedCheckIn.getTime() < expectedDate.getTime()) {
        // Gap found, streak breaks
        break;
      }
    }

    return currentStreak;
  };

  const fetchStats = useCallback(async () => {
    if (!user) {
      setTotalEntries(0);
      setStreak(0);
      setCheckIns(0);
      setAvgMood('—');
      return;
    }

    try {
      // Fetch all check-ins for this user
      const { data: checkInsData, error: checkInsError } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (checkInsError) {
        throw checkInsError;
      }

      // Count total entries
      setTotalEntries(checkInsData?.length || 0);

      // Count unique days with at least 1 check-in
      const uniqueDays = new Set<string>();
      checkInsData?.forEach(checkIn => {
        const date = new Date(checkIn.created_at);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        uniqueDays.add(dateKey);
      });
      setCheckIns(uniqueDays.size);

      // Calculate streak
      const checkInDates = checkInsData?.map(ci => new Date(ci.created_at)) || [];
      const currentStreak = calculateStreak(checkInDates);
      setStreak(currentStreak);

      // Fetch mood check-ins and calculate average
      const { data: moodData, error: moodError } = await supabase
        .from('mood_check_in')
        .select('mood')
        .eq('user_id', user.id);

      if (moodError) {
        throw moodError;
      }

      if (moodData && moodData.length > 0) {
        const validMoods = moodData.filter(m => m.mood !== null && m.mood !== undefined);
        if (validMoods.length > 0) {
          const sum = validMoods.reduce((acc, m) => acc + (m.mood || 0), 0);
          const average = sum / validMoods.length;
          setAvgMood(formatMood(average));
        } else {
          setAvgMood('—');
        }
      } else {
        setAvgMood('—');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setTotalEntries(0);
      setStreak(0);
      setCheckIns(0);
      setAvgMood('—');
    }
  }, [user]);

  // Refresh stats and quote when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
      loadDailyQuote();
    }, [fetchStats, loadDailyQuote])
  );

  const getWeekDates = () => {
    const curr = new Date();
    const dayOfWeek = curr.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + mondayOffset);

    return daysOfWeek.map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date.getDate();
    });
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning,';
    } else if (hour < 17) {
      return 'Good afternoon,';
    } else  {
      return 'Good evening,';
    }
  };

  const weekDates = getWeekDates();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-5 pt-16">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-xl text-gray-500">{getGreeting()}</Text>
          <Text className="text-5xl font-bold text-gray-800 mt-1">{displayName}</Text>
        </View>

        {/* Week Calendar */}
        <View className="flex-row justify-between mb-6">
          {daysOfWeek.map((day, index) => {
            const isToday = currentDayIndex === index;

            return (
              <View
                key={day}
                className={`items-center py-3 px-2.5 rounded-2xl min-w-[44px] ${
                  isToday 
                    ? 'bg-[#008d72]' 
                    : ''
                }`}
              >
                <Text
                  className={`text-xs mb-1.5 ${
                    isToday ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {day}
                </Text>
                <Text
                  className={`text-base font-semibold ${
                    isToday ? 'text-white' : 'text-gray-800'
                  }`}
                >
                  {weekDates[index]}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Quote Card */}
        <View className="bg-[#008d72] rounded-2xl p-5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-2">
              <Ionicons name="chatbubbles" size={16} color="#fff" />
            </View>
            <Text className="text-sm font-medium text-white/80">Daily Quote</Text>
          </View>
          <Text className="text-lg font-medium text-white leading-7">"{quote.text}"</Text>
          <Text className="text-sm text-white/70 mt-4">— {quote.author}</Text>
        </View>

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Quick Start</Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/journaling/empty_page' as any)}
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-3"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-lg bg-[#008d72]/10 items-center justify-center mr-3">
                <Ionicons name="document-text-outline" size={20} color="#008d72" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">empty page.</Text>
                <Text className="text-sm text-gray-500 mt-0.5">start with a blank canvas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/journaling/ideas' as any)}
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-[#008d72]/10 items-center justify-center mr-3">
                <Ionicons name="bulb-outline" size={20} color="#008d72" />
              </View>
              <View>
                <Text className="text-base font-medium text-gray-800">ideas.</Text>
                <Text className="text-sm text-gray-500 mt-0.5">capture your thoughts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/journaling/mood_check_in' as any)}
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl p-4 mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-lg bg-[#008d72]/10 items-center justify-center mr-3">
                <Ionicons name="heart-outline" size={20} color="#008d72" />
              </View>
              <View>
                <Text className="text-base font-medium text-gray-800">mood check in.</Text>
                <Text className="text-sm text-gray-500 mt-0.5">reflect on how you're feeling</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Your Progress</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="w-[48%] bg-gray-50 rounded-xl p-4">
              <View className="w-9 h-9 rounded-lg bg-[#008d72]/10 items-center justify-center">
                <Ionicons name="flame" size={20} color="#008d72" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-3">{streak}</Text>
              <Text className="text-sm text-gray-500">day streak</Text>
            </View>
            <View className="w-[48%] bg-gray-50 rounded-xl p-4">
              <View className="w-9 h-9 rounded-lg bg-[#008d72]/10 items-center justify-center">
                <Ionicons name="book-outline" size={20} color="#008d72" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-3">{totalEntries}</Text>
              <Text className="text-sm text-gray-500">entries</Text>
            </View>
            <View className="w-[48%] bg-gray-50 rounded-xl p-4">
              <View className="w-9 h-9 rounded-lg bg-[#008d72]/10 items-center justify-center">
                <Ionicons name="happy-outline" size={20} color="#008d72" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-3">{avgMood}</Text>
              <Text className="text-sm text-gray-500">avg mood</Text>
            </View>
            <View className="w-[48%] bg-gray-50 rounded-xl p-4">
              <View className="w-9 h-9 rounded-lg bg-[#008d72]/10 items-center justify-center">
                <Ionicons name="calendar-outline" size={20} color="#008d72" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-3">{checkIns}</Text>
              <Text className="text-sm text-gray-500">check-ins</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
