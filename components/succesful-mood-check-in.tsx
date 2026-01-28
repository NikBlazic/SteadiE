import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuccessPopupProps {
  visible: boolean;
  message?: string;
  onClose: () => void;
  duration?: number; // Duration in milliseconds before auto-close
}

export default function SuccessPopup({
  visible,
  message = 'Mood check-in saved successfully!',
  onClose,
  duration = 2000,
}: SuccessPopupProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={handleClose}
        className="bg-black/30 justify-center items-center"
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="bg-white rounded-2xl p-6 mx-6 shadow-lg"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="items-center">
              <View className="bg-[#008d72] rounded-full p-4 mb-4">
                <Ionicons name="checkmark-circle" size={48} color="white" />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                Success!
              </Text>
              <Text className="text-base text-gray-600 text-center">
                {message}
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
