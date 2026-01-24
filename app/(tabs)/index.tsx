import { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import "../../global.css";
import { useAuth } from '../../lib/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedDate, setSelectedDate] = useState(21);

  // Show homepage design when user is logged in
  if (user) {


    return (
      <View className="flex-1 bg-white items-center justify-center align-middle">
        <Text className="text-3xl font-bold text-[#008d72]">hello.</Text>
      </View>
    );
  }

  // Show login form when user is not logged in
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Image
        source={require('../../assets/images/logo-noBackground.png')}
        className="w-48 h-48 mb-6"
        resizeMode="contain"
      />

      <TextInput
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity className="w-full bg-[#008d72] px-6 py-3 rounded-lg mb-4">
        <Text className="text-white font-semibold text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Text> 
      </TouchableOpacity>

      <TouchableOpacity className="w-full" onPress={() => setIsSignUp(!isSignUp)}>
        <Text className="text-center text-[#008d72]">
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
