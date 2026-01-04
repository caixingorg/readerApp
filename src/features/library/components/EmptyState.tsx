import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Button from '../../../components/Button';
import Svg, { Path, Circle } from 'react-native-svg';

interface EmptyStateProps {
    onImport: () => void;
    onWiFi: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImport, onWiFi }) => {
    return (
        <View className="flex-1 justify-center items-center p-8 bg-white dark:bg-gray-900">
            <Animated.View
                entering={FadeInUp.delay(200).springify()}
                className="items-center w-full"
            >
                {/* Illustration */}
                <View className="w-48 h-48 bg-blue-50 dark:bg-gray-800 rounded-full items-center justify-center mb-8 relative">
                    <Svg height="120" width="120" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5">
                        <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </Svg>

                    {/* Decorative circle */}
                    <View className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full opacity-20" />
                    <View className="absolute bottom-4 -left-2 w-6 h-6 bg-red-400 rounded-full opacity-20" />
                </View>

                <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                    书架空空如也
                </Text>

                <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8 leading-6">
                    快去导入你喜欢的电子书吧{'\n'}支持 TXT, EPUB, PDF 格式
                </Text>

                <View className="w-full gap-4 max-w-xs">
                    <Button
                        title="从文件导入"
                        onPress={onImport}
                        size="large"
                        icon="document-text-outline"
                        fullWidth
                        className="shadow-md shadow-blue-500/30"
                    />

                    <Button
                        title="WiFi 传书"
                        onPress={onWiFi}
                        variant="secondary"
                        size="large"
                        icon="wifi-outline"
                        fullWidth
                    />
                </View>
            </Animated.View>
        </View>
    );
};

export default EmptyState;
