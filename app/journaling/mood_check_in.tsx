import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BackButton from '../../components/back-button';
import SuccessPopup from '../../components/succesful-mood-check-in';
import '../../global.css';

type MoodLevel = 1 | 2 | 3 | 4 | 5;

interface MoodButtonProps {
  level: MoodLevel;
  isSelected: boolean;
  onPress: () => void;
}

const moodPaths: Record<MoodLevel, string> = {
  1: 'M8 16 Q20 0, 32 16',   // Very sad - very deep frown
  2: 'M10 14 Q20 10, 30 14', // Sad - slight frown
  3: 'M8 12 L32 12',          // Neutral - straight line
  4: 'M10 10 Q20 14, 30 10', // Happy - slight smile
  5: 'M8 8 Q20 22, 32 8',    // Very happy - very big smile
};

const formatDate = () => {
  const now = new Date();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year} at ${hours}:${minutes}`;
};

export default function MoodCheckInScreen() {
  return (
    <View className="flex-1 bg-white">
      <BackButton />
      <View className="flex-1 px-6 justify-center pb-24">
        <Text className="text-4xl font-bold text-[#008d72] mb-6">How are you feeling?</Text>
        
        <View className="flex-row items-center mb-8">
          <View className="bg-gray-200 px-4 py-2 rounded-full">
            <Text className="text-base text-black">{formatDate()}</Text>
          </View>
        </View>
        
        <MoodSelector />
      </View>
    </View>
  );
}

const MoodButton: React.FC<MoodButtonProps> = ({ level, isSelected, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className={`w-16 h-16 rounded-full items-center justify-center ${
        isSelected ? 'bg-[#008d72] opacity-70' : 'bg-[#008d72]'
      }`}
    >
      <Svg width={40} height={24} viewBox="0 0 40 24">
        <Path
          d={moodPaths[level]}
          stroke="#E5E7EB"
          strokeWidth={2.8}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Pressable>
  );
};

export const MoodSelector: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { user } = useAuth();

  const handleSubmitMood = async (mood: MoodLevel) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save');
      return;
    }

    try {
      const { error } = await supabase
        .from('mood_check_in')
        .insert({
          user_id: user.id,
          mood: mood,
        });

      if (error) {
        throw error;
      }

      // Show success popup
      setShowSuccessPopup(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
    }
  };

  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    // Redirect to home page after popup closes
    router.replace('/(tabs)' as any);
  };

  // Moods: 1=Very Sad, 2=Sad, 3=Neutral, 4=Happy, 5=Very Happy
  const moods: MoodLevel[] = [1, 2, 3, 4, 5];

  return (
    <>
      <View className="flex-row gap-5 justify-center items-center">
        {moods.map((level) => (
          <MoodButton
            key={level}
            level={level}
            isSelected={selectedMood === level}
            onPress={() => {
              setSelectedMood(level);
              handleSubmitMood(level);
            }}
          />
        ))}
      </View>
      <SuccessPopup
        visible={showSuccessPopup}
        message="Mood check-in saved successfully!"
        onClose={handlePopupClose}
        duration={2000}
      />
    </>
  );
};