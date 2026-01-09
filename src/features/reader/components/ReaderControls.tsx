import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import { EdgeInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
    ChevronLeft,
    Headphones,
    Bookmark,
    NotebookPen,
    Palette,
    Type,
    ArrowLeftRight,
    ArrowUpDown,
    AlignLeft
} from 'lucide-react-native';

interface ReaderControlsProps {
    visible: boolean;
    onClose: () => void;
    onTTS: () => void;
    onAddBookmark: () => void;
    onTOC: () => void;
    onNotes: () => void;
    onViewBookmarks: () => void;
    onTheme: () => void;
    onFont: () => void;
    onToggleFlow: () => void;
    flow: 'paginated' | 'scrolled';
    insets: EdgeInsets;
    title?: string;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
    visible,
    onClose,
    onTTS,
    onAddBookmark,
    onTOC,
    onNotes,
    onTheme,
    onFont,
    onToggleFlow,
    flow,
    insets,
    title
}) => {
    const theme = useTheme<Theme>();
    const isDark = theme.colors.mainBackground === '#121212' || theme.colors.mainBackground === '#000000';
    const ICON_SIZE = 22;
    if (!visible) return null;

    // Common Button Style
    const IconButton = ({ onPress, icon: Icon, label }: { onPress: () => void, icon: any, label?: string }) => (
        <TouchableOpacity
            onPress={onPress}
            className="items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Icon size={ICON_SIZE} color={theme.colors.textPrimary} strokeWidth={2} />
            {label && (
                <Text
                    className="text-[10px] mt-1.5 font-medium"
                    style={{ color: theme.colors.textSecondary }}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="absolute inset-0 z-50">
            {/* Header Overlay */}
            <View className="absolute top-0 left-0 right-0">
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={{
                        paddingTop: insets.top,
                        paddingBottom: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'
                    }}
                >
                    <View className="flex-row items-center justify-between mt-2">
                        {/* Left: Back */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-10 h-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
                        >
                            <ChevronLeft size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Center: Title (Truncated) */}
                        <Text
                            className="flex-1 text-center mx-4 font-semibold text-lg"
                            numberOfLines={1}
                            style={{ color: theme.colors.textPrimary }}
                        >
                            {title || 'Reading'}
                        </Text>

                        {/* Right: Quick Actions */}
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={onToggleFlow}>
                                {flow === 'paginated' ? (
                                    <ArrowLeftRight size={ICON_SIZE} color={theme.colors.textPrimary} />
                                ) : (
                                    <ArrowUpDown size={ICON_SIZE} color={theme.colors.textPrimary} />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onAddBookmark}>
                                <Bookmark size={ICON_SIZE} color={theme.colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </BlurView>
            </View>

            {/* Footer Overlay */}
            <View className="absolute bottom-0 left-0 right-0">
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={{
                        paddingBottom: insets.bottom + 8,
                        paddingTop: 16,
                        paddingHorizontal: 32, // More breathing room
                        borderTopWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)'
                    }}
                >
                    <View className="flex-row justify-between items-end">
                        <IconButton onPress={onTOC} icon={AlignLeft} label="Contents" />
                        <IconButton onPress={onTheme} icon={Palette} label="Theme" />
                        <IconButton onPress={onFont} icon={Type} label="Style" />
                        <IconButton onPress={onTTS} icon={Headphones} label="Listen" />
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

export default ReaderControls;
