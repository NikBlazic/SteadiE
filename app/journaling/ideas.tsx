import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

export default function IdeasScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const [ideaTitle, setIdeaTitle] = useState('Loading idea...');
  const [ideaId, setIdeaId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchRandomIdea = async () => {
      try {
        const { data, error } = await supabase.from('ideas').select('id, content').not('content', 'is', null);

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          setIdeaTitle('No ideas available');
          setIdeaId(null);
          return;
        }

        const randomIndex = Math.floor(Math.random() * data.length);
        const selectedIdea = data[randomIndex];
        const cleanTitle = (selectedIdea.content || '').trim().replace(/[;]+$/, '');
        setIdeaTitle(cleanTitle || 'Untitled idea');
        setIdeaId(selectedIdea.id);
      } catch (error: any) {
        setIdeaTitle('Could not load idea');
        setIdeaId(null);
        Alert.alert('Error', error.message || 'Failed to load idea');
      }
    };

    fetchRandomIdea();
  }, []);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before saving');
      return;
    }

    if (!ideaId) {
      Alert.alert('Error', 'No idea selected. Please try again.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: ideaJournalError } = await supabase.from('journal_idea').insert({
        user_id: user.id,
        content: content.trim(),
        idea_id: ideaId,
      });

      if (ideaJournalError) {
        throw ideaJournalError;
      }

      const { error: checkInError } = await supabase.from('check_ins').insert({
        user_id: user.id,
        completed: 'ideas',
      });

      if (checkInError) {
        throw checkInError;
      }

      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save entry');
      setIsSaving(false);
    }
  };

  return (
    <>
      <StatusBar hidden={true} />
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-6 z-10"
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#008d72" />
          </TouchableOpacity>

          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
          >
            <View className="flex-1 px-4 pt-28">
              <TextInput
                className="text-gray-900 text-2xl font-normal mb-4"
                value={ideaTitle}
                editable={false}
                style={{ color: '#000' }}
              />

              <TextInput
                ref={contentInputRef}
                className="text-gray-900 text-base font-normal flex-1"
                placeholder="Start writing..."
                placeholderTextColor="#999"
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
                style={{
                  color: '#000',
                  minHeight: 400,
                }}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.8}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#008d72',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons
              name={isSaving ? 'hourglass-outline' : 'checkmark'}
              size={26}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
