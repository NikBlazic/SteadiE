import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BackButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className="absolute top-12 left-6 z-10"
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={28} color="#008d72" />
    </TouchableOpacity>
  );
}
