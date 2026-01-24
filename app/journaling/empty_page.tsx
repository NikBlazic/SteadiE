import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import '../../global.css';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

export default function EmptyPageScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save');
      return;
    }

    if (!title.trim() && !content.trim()) {
      Alert.alert('Error', 'Please enter at least a title or content');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('empty_page')
        .insert({
          user_id: user.id,
          title: title.trim() || null,
          content: content.trim() || null,
        });

      if (error) {
        throw error;
      }

      // Redirect to home page after successful save
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
          {/* Back Button */}
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
              {/* Title Input - Minimal, no label */}
              <TextInput
                className="text-gray-900 text-2xl font-normal mb-4"
                placeholder="Title"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
                returnKeyType="next"
                onSubmitEditing={() => contentInputRef.current?.focus()}
                style={{ color: '#000' }}
              />

              {/* Content Input - Large, prominent */}
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

          {/* Submit Button - Bottom Right Corner */}
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
              name={isSaving ? "hourglass-outline" : "checkmark"} 
              size={26} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
