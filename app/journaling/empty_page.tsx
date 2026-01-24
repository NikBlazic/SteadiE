import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect } from 'react';
import { Text, View } from 'react-native';
import BackButton from '../../components/BackButton';
import '../../global.css';

export default function EmptyPageScreen() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <>
      <StatusBar hidden={true} />
      <View className="flex-1 bg-white">
        <BackButton />
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl">Empty Page</Text>
        </View>
      </View>
    </>
  );
}
