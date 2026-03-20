'use client';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { DatabaseService } from '../../api/onboarding-data';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const calendarColumns = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const [displayName, setDisplayName] = useState<string>('Anonymous');
  const [country, setCountry] = useState<string | null>(null);
  const [moodChartData, setMoodChartData] = useState<{ value: number; label: string }[]>([]);
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [relapseDateKeys, setRelapseDateKeys] = useState<string[]>([]);
  const [latestRelapseAt, setLatestRelapseAt] = useState<string | null>(null);
  const [checkInCount, setCheckInCount] = useState<number>(0);
  const [moodCheckInCount, setMoodCheckInCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const toDateKey = (dateValue: string | Date) => {
    const date = new Date(dateValue);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const isoDateToKey = (isoDate: string) => {
    // Accept both `YYYY-MM-DD` and timestamp-like strings safely.
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return `${year}-${month - 1}-${day}`;
    }

    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}`;
  };

  const getMonthGrid = (monthDate: Date, today: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayStartOffset = (firstOfMonth.getDay() + 6) % 7;
    const slots = [];

    for (let i = 0; i < mondayStartOffset; i += 1) {
      slots.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      slots.push({
        dayNumber: day,
        key: toDateKey(date),
        isFuture: date > today,
        isToday:
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }

    return slots;
  };

  useEffect(() => {
    const fetchBasicDisplay = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [basicInfo, moodRes, checkInsRes, relapseRes] = await Promise.all([
          DatabaseService.getUserBasicInfo(user.id),
          supabase
            .from('mood_check_in')
            .select('mood, created_at')
            .eq('user_id', user.id)
            .not('mood', 'is', null)
            .order('created_at', { ascending: false })
            .limit(7),
          supabase
            .from('check_ins')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('relapse_dates')
            .select('date, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
        ]);

        if (moodRes.error) {
          throw moodRes.error;
        }
        if (checkInsRes.error) {
          throw checkInsRes.error;
        }
        if (relapseRes.error) {
          throw relapseRes.error;
        }

        const chartPoints = [...(moodRes.data || [])]
          .reverse()
          .map((entry, index) => {
            const date = new Date(entry.created_at);
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              value: entry.mood || 0,
              label: index === 0 || index === (moodRes.data?.length || 0) - 1 ? label : '',
            };
          });

        setMoodChartData(
          chartPoints.length > 0
            ? chartPoints
            : [{ value: 0, label: 'No mood data yet' }],
        );

        const loginDays = Array.from(
          new Set((checkInsRes.data || []).map((entry) => toDateKey(entry.created_at))),
        );
        setCheckInDates(loginDays);
        setCheckInCount(loginDays.length);
        setMoodCheckInCount(moodRes.data?.length || 0);
        const relapseKeys = Array.from(
          new Set(
            (relapseRes.data || [])
              .map((entry) => isoDateToKey(entry.date))
              .filter((key): key is string => Boolean(key)),
          ),
        );
        setRelapseDateKeys(relapseKeys);
        const latestRelapse = relapseRes.data?.[relapseRes.data.length - 1];
        setLatestRelapseAt(latestRelapse?.created_at ?? null);

        setDisplayName(basicInfo?.display_name || 'Anonymous');
        setCountry(basicInfo?.country_region || null);
      } catch (error) {
        console.error('Error fetching profile display:', error);
        setMoodChartData([{ value: 0, label: 'No mood data yet' }]);
        setCheckInDates([]);
        setRelapseDateKeys([]);
        setLatestRelapseAt(null);
        setCheckInCount(0);
        setMoodCheckInCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchBasicDisplay();
  }, [user]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to log out. Please try again.');
    }
  };

  const handleResetRelapse = async () => {
    if (!user) return;
    try {
      const date = new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;

      const { error } = await supabase.from('relapse_dates').insert({
        user_id: user.id,
        date: dateString,
      });

      if (error) {
        throw error;
      }

      const { data: relapseRes, error: relapseFetchError } = await supabase
        .from('relapse_dates')
        .select('date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (relapseFetchError) {
        throw relapseFetchError;
      }

      setRelapseDateKeys(
        Array.from(
          new Set(
            (relapseRes || [])
              .map((entry) => isoDateToKey(entry.date))
              .filter((key): key is string => Boolean(key)),
          ),
        ),
      );
      const latestRelapse = relapseRes?.[relapseRes.length - 1];
      setLatestRelapseAt(latestRelapse?.created_at ?? null);
      setNow(new Date());
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to reset recovery tracker.');
    }
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning,';
    }
    if (hour < 17) {
      return 'Good afternoon,';
    }
    return 'Good evening,';
  };

  if (authLoading || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-lg text-gray-700">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-2xl font-bold mb-2 text-gray-900">No profile yet</Text>
        <Text className="text-center text-gray-600 mb-6">
          You&apos;re not signed in. Go to the Home tab to create an account or sign in.
        </Text>
      </View>
    );
  }

  const goPrevMonth = () => {
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  const monthGrid = getMonthGrid(viewDate, now);
  const today = now;
  const monthTitle = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const relapseDateSet = new Set(relapseDateKeys);
  const lastRelapseDate = latestRelapseAt ? new Date(latestRelapseAt) : null;
  const millisSinceRelapse = lastRelapseDate ? Math.max(0, today.getTime() - lastRelapseDate.getTime()) : 0;
  const relapseDays = lastRelapseDate ? Math.floor(millisSinceRelapse / (1000 * 60 * 60 * 24)) : 0;
  const relapseHours = lastRelapseDate ? Math.floor((millisSinceRelapse / (1000 * 60 * 60)) % 24) : 0;
  const relapseMinutes = lastRelapseDate ? Math.floor((millisSinceRelapse / (1000 * 60)) % 60) : 0;
  const relapseSeconds = lastRelapseDate ? Math.floor((millisSinceRelapse / 1000) % 60) : 0;
  const hasMoodData = moodChartData.some((point) => point.value > 0);

  return (
    <View className="flex-1 bg-[#f7faf9]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-16 pb-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-xl text-gray-500">{getGreeting()}</Text>
            <Text className="text-5xl font-bold text-[#008d72] mt-1">{displayName}</Text>
            {country && <Text className="text-base text-gray-500 mt-1">{country}</Text>}
          </View>

          <View className="mb-5 flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl border border-[#008d72]/10 px-4 py-4">
              <Text className="text-xs text-gray-500">Login days</Text>
              <Text className="text-2xl font-bold text-[#008d72] mt-1">{checkInCount}</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-[#008d72]/10 px-4 py-4">
              <Text className="text-xs text-gray-500">Mood check-ins</Text>
              <Text className="text-2xl font-bold text-[#008d72] mt-1">{moodCheckInCount}</Text>
            </View>
          </View>

          <View className="mb-5 bg-white rounded-3xl border border-[#008d72]/10 p-3.5">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={16} color="#008d72" />
                <Text className="ml-2 text-[#0d7f67] text-lg font-semibold">Recovery Tracker</Text>
              </View>
              <TouchableOpacity
                className="rounded-xl border border-[#e1e7e4] bg-[#f8fbfa] px-3 py-1.5"
                onPress={handleResetRelapse}
              >
                <View className="flex-row items-center">
                  <Ionicons name="refresh" size={14} color="#5b6260" />
                  <Text className="ml-1.5 text-[#4e5653] text-xs font-medium">Reset</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="mb-4 rounded-2xl bg-[#f3f6f5] px-2.5 py-3">
              <Text className="text-center text-[#6d7572] text-xs mb-2">Time since last relapse</Text>
              <View className="flex-row justify-between">
                {[
                  { value: relapseDays, label: 'DAYS' },
                  { value: relapseHours, label: 'HOURS' },
                  { value: relapseMinutes, label: 'MIN' },
                  { value: relapseSeconds, label: 'SEC' },
                ].map((item) => (
                  <View
                    key={item.label}
                    className="h-16 w-[23.5%] rounded-xl bg-white items-center justify-center border border-[#e8ecea]"
                  >
                    <Text className="text-[#0d7f67] text-2xl font-bold">
                      {String(item.value).padStart(2, '0')}
                    </Text>
                    <Text className="text-[#6b7270] text-[10px] mt-0.5 tracking-[0.4px]">{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-2.5 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={goPrevMonth}
                className="p-1"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={20} color="#59615e" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={15} color="#59615e" />
                <Text className="ml-1.5 text-[#2f3533] text-base font-semibold">{monthTitle}</Text>
              </View>
              <TouchableOpacity
                onPress={goNextMonth}
                className="p-1"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-forward" size={20} color="#59615e" />
              </TouchableOpacity>
            </View>

            <View className="mb-1.5 flex-row justify-between px-0.5">
              {calendarColumns.map((columnLabel, idx) => (
                <Text key={`${columnLabel}-${idx}`} className="w-[13.5%] text-center text-[#8a928f] text-[11px]">
                  {columnLabel}
                </Text>
              ))}
            </View>

            <View className="flex-row flex-wrap justify-between">
              {monthGrid.map((slot, idx) => {
                if (!slot) {
                  return <View key={`empty-${idx}`} className="mb-1.5 h-10 w-[13.5%]" />;
                }

                const isRelapseDay = relapseDateSet.has(slot.key);

                return (
                  <View
                    key={slot.key}
                    className={`mb-1.5 h-10 w-[13.5%] items-center justify-center rounded-xl ${
                      slot.isToday
                        ? 'bg-[#008d72]'
                        : isRelapseDay
                            ? 'bg-[#e7eaec]'
                            : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        slot.isToday
                          ? 'text-white font-bold'
                          : isRelapseDay
                              ? 'text-[#6b7280] font-medium'
                            : 'text-[#c3c9c7]'
                      }`}
                    >
                      {slot.dayNumber}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className="mt-2.5 flex-row items-center">
              <View className="h-2.5 w-2.5 rounded-full bg-[#e7eaec]" />
              <Text className="ml-1.5 text-[#727a77] text-xs">Relapse</Text>
            </View>
          </View>

          <View className="mb-6 bg-white rounded-2xl border border-[#008d72]/10 p-4">
            <Text className="text-[#008d72] text-base font-semibold mb-1">Mood trend</Text>
            <Text className="text-sm text-gray-500 mb-4">Your latest 7 mood check-ins</Text>
            <LineChart
              data={moodChartData}
              areaChart
              startFillColor="#008d72"
              endFillColor="#ffffff"
              startOpacity={0.25}
              endOpacity={0.05}
              color="#008d72"
              thickness={3}
              yAxisColor="#d1d5db"
              xAxisColor="#d1d5db"
              hideRules
              yAxisTextStyle={{ color: '#008d72', fontSize: 12 }}
              xAxisLabelTextStyle={{ color: '#008d72', fontSize: 12 }}
              maxValue={5}
              noOfSections={5}
              dataPointsColor="#008d72"
              hideDataPoints={!hasMoodData}
            />
          </View>

          {/* Log out */}
          <TouchableOpacity
            className="py-4 items-center justify-center rounded-2xl bg-white border border-gray-200"
            onPress={handleLogout}
          >
            <Text className="text-gray-500 font-medium text-base">Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}