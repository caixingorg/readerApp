import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import { EdgeInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    Headphones,
    Bookmark,
    NotebookPen,
    Palette,
    Type,
    ArrowLeftRight,
    ArrowUpDown,
    AlignLeft,
    MessageSquareQuote
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
    const { t } = useTranslation();
    const theme = useTheme<Theme>();
    // Updated isDark check to match theme.ts palette (gray950, gray900)
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);
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
        <View className="absolute inset-0 z-50" pointerEvents="box-none">
            {/* Header Overlay */}
            <View className="absolute top-0 left-0 right-0">
                <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 95}
                    tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                    style={{
                        paddingTop: insets.top,
                        paddingBottom: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(255,255,255,0.7)'
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
                            {title || t('reader.title')}
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
                    intensity={Platform.OS === 'ios' ? 40 : 95}
                    tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                    style={{
                        paddingBottom: insets.bottom + 8,
                        paddingTop: 16,
                        paddingHorizontal: 32, // More breathing room
                        borderTopWidth: 1,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(2, 6, 23, 0.7)' : 'rgba(255,255,255,0.7)'
                    }}
                >
                    <View className="flex-row justify-between items-end">
                        <IconButton onPress={onTOC} icon={AlignLeft} label={t('reader.controls.contents')} />
                        <IconButton onPress={onNotes} icon={MessageSquareQuote} label={t('reader.controls.notes')} />
                        <IconButton onPress={onTheme} icon={Palette} label={t('reader.controls.theme')} />
                        <IconButton onPress={onFont} icon={Type} label={t('reader.controls.style')} />
                        <IconButton onPress={onTTS} icon={Headphones} label={t('reader.controls.listen')} />
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

export default ReaderControls;
