import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import '../../global.css';

export default function AddScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pt-12">
      <Text className="text-3xl font-bold text-[#008d72] mb-8 pt-8">
        journal.
      </Text>
      <View className=" justify-center">
        {/* Empty Page Button */}
        <TouchableOpacity
          className="rounded-2xl p-5 mb-4 flex-row items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          onPress={() => router.push('/journaling/empty_page' as any)}
          activeOpacity={0.7}
        >
          <View className="flex-1 mr-4">
            <Text className="text-[#008d72] text-2xl font-bold mb-1">
              empty page.
            </Text>
            <Text className="text-gray-500 text-sm">
              start with a blank canvas.
            </Text>
          </View>
          <Ionicons name="document-text-outline" size={28} color="#008d72" />
        </TouchableOpacity>

        {/* Ideas Button */}
        <TouchableOpacity
          className="rounded-2xl p-5 mb-4 flex-row items-center justify-between"
          style={{
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
          onPress={() => router.push('/journaling/ideas' as any)}
          activeOpacity={0.7}
        >
          <View className="flex-1 mr-4">
            <Text className="text-[#008d72] text-2xl font-bold mb-1">
              ideas.
            </Text>
            <Text className="text-gray-500 text-sm">
              capture your thoughts and inspiration.
            </Text>
          </View>
          <Ionicons name="bulb-outline" size={28} color="#008d72" />
        </TouchableOpacity>

        {/* Mood Check In Button */}
        <TouchableOpacity
          className="rounded-2xl p-5 flex-row items-center justify-between"
          style={{
            backgroundColor: '#008d72',
          }}
          onPress={() => router.push('/journaling/mood_check_in' as any)}
          activeOpacity={0.7}
        >
          <View className="flex-1 mr-4">
            <Text className="text-white text-2xl font-bold mb-1">
              mood check in.
            </Text>
            <Text className="text-white/80 text-sm">
              reflect on how you're feeling.
            </Text>
          </View>
          <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
