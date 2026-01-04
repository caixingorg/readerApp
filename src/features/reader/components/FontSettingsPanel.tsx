import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import { BlurView } from 'expo-blur';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import clsx from 'clsx';

interface FontSettingsPanelProps {
    visible: boolean;
    fontSize: number;
    setFontSize: (size: number) => void;
    lineHeight: number;
    setLineHeight: (h: number) => void;
    margin: number;
    setMargin: (m: number) => void;
    fontFamily: string;
    setFontFamily: (f: string) => void;
    bottomOffset?: number;
}

const FontSettingsPanel: React.FC<FontSettingsPanelProps> = ({
    visible,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    margin, setMargin,
    fontFamily, setFontFamily,
    bottomOffset = 0,
}) => {
    const theme = useTheme<Theme>();
    const isDark = theme.colors.card !== '#FFFFFF';

    if (!visible) return null;

    const renderOption = (label: string, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            onPress={onPress}
            className={clsx(
                "px-3 py-1.5 rounded-lg mr-2 border",
                isSelected ? "bg-primary-500 border-primary-500" : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            )}
        >
            <Text className={clsx("text-xs font-medium", isSelected ? "text-white" : "text-gray-700 dark:text-gray-300")}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown.duration(200)}
            style={{ bottom: bottomOffset }}
            className="absolute left-2 right-2 rounded-2xl overflow-hidden z-40"
        >
            <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} className="p-4 rounded-2xl">
                {/* 1. Font Size */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">字号</Text>
                    <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                        <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 1))} className="p-1">
                            <Ionicons name="remove" size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                        <View className="w-12 items-center">
                            <Text className="text-base font-bold text-gray-900 dark:text-gray-100">{fontSize}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setFontSize(Math.min(32, fontSize + 1))} className="p-1">
                            <Ionicons name="add" size={20} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 2. Line Height */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">行距</Text>
                    <View className="flex-row">
                        {renderOption('紧凑', lineHeight === 1.2, () => setLineHeight(1.2))}
                        {renderOption('适中', lineHeight === 1.5, () => setLineHeight(1.5))}
                        {renderOption('宽松', lineHeight === 1.8, () => setLineHeight(1.8))}
                    </View>
                </View>

                {/* 3. Margins */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">边距</Text>
                    <View className="flex-row">
                        {renderOption('窄', margin === 1, () => setMargin(1))}
                        {renderOption('标准', margin === 2, () => setMargin(2))}
                        {renderOption('宽', margin === 3, () => setMargin(3))}
                    </View>
                </View>

                {/* 4. Font Family */}
                <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">字体</Text>
                    <View className="flex-row">
                        {renderOption('系统', fontFamily === 'system', () => setFontFamily('system'))}
                        {renderOption('宋体', fontFamily === 'serif', () => setFontFamily('serif'))}
                        {renderOption('黑体', fontFamily === 'sans-serif', () => setFontFamily('sans-serif'))}
                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

export default FontSettingsPanel;
