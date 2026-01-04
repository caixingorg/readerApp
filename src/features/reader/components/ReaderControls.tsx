import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import { EdgeInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

interface ReaderControlsProps {
    visible: boolean;
    onClose: () => void;
    onSearch: () => void;
    onTTS: () => void;
    onAddBookmark: () => void;
    onTOC: () => void;
    onNotes: () => void;
    onViewBookmarks: () => void;
    onTheme: () => void;
    onFont: () => void;
    insets: EdgeInsets;
    title?: string;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
    visible,
    onClose,
    onSearch,
    onTTS,
    onAddBookmark,
    onTOC,
    onNotes,
    onViewBookmarks,
    onTheme,
    onFont,
    insets,
    title
}) => {
    const theme = useTheme<Theme>();
    const progress = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
        progress.value = withTiming(visible ? 1 : 0, { duration: 250 });
    }, [visible]);

    const headerStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [-100, 0], Extrapolation.CLAMP) }],
    }));

    const footerStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [100, 0], Extrapolation.CLAMP) }],
    }));

    return (
        <View className="absolute inset-0 z-50" pointerEvents={visible ? 'box-none' : 'none'}>
            {/* Header Overlay */}
            <Animated.View style={[headerStyle]} className="absolute top-0 left-0 right-0">
                <BlurView intensity={80} tint={theme.colors.card === '#FFFFFF' ? 'light' : 'dark'} className="w-full">
                    <View
                        style={{ paddingTop: insets.top + 10, paddingBottom: 10 }}
                        className="px-4 flex-row justify-between items-center bg-white/70 dark:bg-black/50 border-b border-gray-200/20"
                    >
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                        </TouchableOpacity>

                        <Text className="text-gray-900 dark:text-gray-100 font-medium flex-1 text-center mx-4" numberOfLines={1}>
                            {title || ''}
                        </Text>

                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={onSearch}>
                                <Ionicons name="search" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onTTS}>
                                <Ionicons name="headset-outline" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onAddBookmark}>
                                <Ionicons name="bookmark-outline" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>

            {/* Footer Overlay */}
            <Animated.View style={[footerStyle]} className="absolute bottom-0 left-0 right-0">
                <BlurView intensity={80} tint={theme.colors.card === '#FFFFFF' ? 'light' : 'dark'} className="w-full">
                    <View
                        style={{ paddingBottom: insets.bottom + 20, paddingTop: 16 }}
                        className="bg-white/70 dark:bg-black/50 border-t border-gray-200/20 px-8"
                    >
                        <View className="flex-row justify-between items-center">
                            <TouchableOpacity onPress={onTOC} className="items-center">
                                <Ionicons name="list" size={24} color={theme.colors.text} />
                                <Text className="text-[10px] text-gray-500 mt-1 dark:text-gray-400">目录</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onNotes} className="items-center">
                                <Ionicons name="create-outline" size={24} color={theme.colors.text} />
                                <Text className="text-[10px] text-gray-500 mt-1 dark:text-gray-400">笔记</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onViewBookmarks} className="items-center">
                                <Ionicons name="bookmarks-outline" size={24} color={theme.colors.text} />
                                <Text className="text-[10px] text-gray-500 mt-1 dark:text-gray-400">书签</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onTheme} className="items-center">
                                <Ionicons name="sunny-outline" size={24} color={theme.colors.text} />
                                <Text className="text-[10px] text-gray-500 mt-1 dark:text-gray-400">主题</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onFont} className="items-center">
                                <Ionicons name="text-outline" size={24} color={theme.colors.text} />
                                <Text className="text-[10px] text-gray-500 mt-1 dark:text-gray-400">显示</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>
        </View>
    );
};

export default ReaderControls;
