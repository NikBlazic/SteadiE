import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import "../../global.css";
import { useAuth } from '../../lib/auth-context';

export default function HomeScreen() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      if (isSignUp) {
        await signUp(email, password);
        Alert.alert('Success', 'Check your email for verification!');
      } else {
        await signIn(email, password);
        Alert.alert('Success', 'Welcome back!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg">Loading...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-2xl font-bold mb-4">Welcome back!</Text>
        <Text className="text-lg mb-4">Email: {user.email}</Text>
        <TouchableOpacity
          className="bg-red-500 px-6 py-3 rounded-lg"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-2xl font-bold mb-8">Welcome to SteadiE</Text>

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

      <TouchableOpacity
        className="w-full bg-blue-500 px-6 py-3 rounded-lg mb-4"
        onPress={handleAuth}
      >
        <Text className="text-white font-semibold text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full"
        onPress={() => setIsSignUp(!isSignUp)}
      >
        <Text className="text-center text-blue-500">
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
