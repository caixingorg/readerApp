import React from 'react';
import { View, Text } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

/*
  Custom Toast Config
  Usage: <Toast config={toastConfig} /> in App.tsx
*/

const ToastLayout = ({ text1, text2, icon, color, bgColor, borderColor }: any) => (
    <View className="w-[90%] flex-row items-center p-4 rounded-2xl shadow-lg border bg-white dark:bg-gray-900"
        style={{ borderColor, shadowColor: color, shadowOpacity: 0.1, shadowRadius: 10 }}>
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: bgColor }}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View className="flex-1">
            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{text1}</Text>
            {text2 && <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{text2}</Text>}
        </View>
    </View>
);

export const toastConfig: ToastConfig = {
    success: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="checkmark"
            color="#16A34A" // green-600
            bgColor="#DCFCE7" // green-100
            borderColor="#86EFAC" // green-300
        />
    ),
    error: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="alert"
            color="#DC2626" // red-600
            bgColor="#FEE2E2" // red-100
            borderColor="#FCA5A5" // red-300
        />
    ),
    info: ({ text1, text2 }) => (
        <ToastLayout
            text1={text1}
            text2={text2}
            icon="information"
            color="#2563EB" // blue-600
            bgColor="#DBEAFE" // blue-100
            borderColor="#93C5FD" // blue-300
        />
    )
};
