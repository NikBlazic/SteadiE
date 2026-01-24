import { Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import '../../global.css';

export default function MoodCheckInScreen() {
  return (
    <View className="flex-1 bg-white">
      <BackButton />
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl">Mood Check In</Text>
      </View>
    </View>
  );
}
