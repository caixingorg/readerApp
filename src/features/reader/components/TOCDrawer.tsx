import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View, Platform, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import clsx from 'clsx';
import { X, ChevronRight, BookOpen } from 'lucide-react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    runOnJS,
    SlideInLeft,
    SlideOutLeft,
    FadeIn
} from 'react-native-reanimated';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { EpubChapter } from '../utils/EpubService';

interface TOCDrawerProps {
    visible: boolean;
    onClose: () => void;
    chapters: EpubChapter[];
    currentHref?: string;
    onSelectChapter: (href: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

const TOCDrawer: React.FC<TOCDrawerProps> = ({
    visible,
    onClose,
    chapters,
    currentHref,
    onSelectChapter,
}) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    // Robust check for dark mode colors
    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = [
        '#020617', '#0F172A', '#121212', // Old Slate/Dark
        '#0C0A09', '#1C1917', '#292524'  // New Stone Dark
    ].includes(theme.colors.mainBackground);

    if (!visible) return null;

    const flattenChapters = (items: EpubChapter[], level = 0): (EpubChapter & { level: number })[] => {
        let result: (EpubChapter & { level: number })[] = [];
        items.forEach(item => {
            result.push({ ...item, level });
            if (item.subitems && item.subitems.length > 0) {
                result = result.concat(flattenChapters(item.subitems, level + 1));
            }
        });
        return result;
    };

    const flatChapters = flattenChapters(chapters);

    const renderChapterItem = ({ item }: { item: EpubChapter & { level: number } }) => {
        const isCurrent = currentHref && item.href.includes(currentHref);

        return (
            <TouchableOpacity
                className={clsx(
                    "flex-row items-center py-4 pr-5 active:bg-black/5 dark:active:bg-white/5",
                    item.level === 0 && "mb-1"
                )}
                style={{
                    paddingLeft: 24 + item.level * 16,
                    backgroundColor: isCurrent ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent'
                }}
                onPress={() => { onSelectChapter(item.href); onClose(); }}
            >
                {/* Visual Indicator for Nesting or Current */}
                <View className="mr-3" style={{ width: 4 }}>
                    {isCurrent && (
                        <View
                            className="bg-primary-500 rounded-full"
                            style={{ width: 4, height: 24 }}
                        />
                    )}
                </View>

                {/* Chapter Title */}
                <View className="flex-1">
                    <Text
                        className={clsx(
                            isCurrent ? "font-bold" : "font-medium"
                        )}
                        style={{
                            fontSize: item.level === 0 ? 16 : 15,
                            color: isCurrent ? theme.colors.primary : theme.colors.textPrimary,
                            opacity: isCurrent ? 1 : (item.level === 0 ? 0.9 : 0.7),
                            letterSpacing: 0.3
                        }}
                        numberOfLines={2}
                    >
                        {item.label.trim()}
                    </Text>
                    {/* Optional: Add page number or progress if available */}
                </View>

                {/* Chevron for better affordance */}
                {!isCurrent && (
                    <ChevronRight size={16} color={theme.colors.textSecondary} opacity={0.5} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            {/* Backdrop */}
            <TouchableOpacity
                style={StyleSheet.absoluteFill}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(0,0,0,0.4)' }
                    ]}
                />
            </TouchableOpacity>

            {/* Drawer Panel */}
            <View
                style={[
                    styles.drawer,
                    {
                        width: DRAWER_WIDTH,
                        // Ensure background is solid for the drawer content
                        // Dark: Slate 950 (#020617) to match Global, or Slate 900 (#0F172A) for contrast?
                        // Let's use Slate 950 (#020617) for seamless look, or slightly lighter.
                        backgroundColor: isDark ? '#020617' : '#FFFFFF',
                        borderTopRightRadius: 20,
                        borderBottomRightRadius: 20,
                    }
                ]}
            >
                <View style={{ flex: 1, paddingTop: insets.top }}>
                    {/* Premium Header */}
                    <View
                        className="px-6 pb-6 pt-4 flex-row justify-between items-center"
                        style={{
                            borderBottomWidth: 1,
                            borderColor: isDark ? '#1F2937' : '#F3F4F6' // gray-800 : gray-100
                        }}
                    >
                        <View className="flex-row items-center gap-3">
                            <View
                                className="w-8 h-8 rounded-full items-center justify-center"
                                style={{
                                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(56, 189, 248, 0.1)' // Adjusted primary opacity
                                }}
                            >
                                <BookOpen size={18} color={theme.colors.primary} />
                            </View>
                            <Text variant="subheader" fontSize={22} fontWeight="700" letterSpacing={0.5} style={{ color: theme.colors.textPrimary }}>
                                Contents
                            </Text>
                        </View>
                    </View>

                    {/* Stats or Info Header */}
                    <View
                        className="px-6 py-3 mb-2"
                        style={{
                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F9FAFB' // black/20 : gray-50
                        }}
                    >
                        <Text className="text-xs uppercase font-bold tracking-widest" style={{ color: isDark ? '#9CA3AF' : '#9CA3AF' }}>
                            {flatChapters.length} Chapters
                        </Text>
                    </View>

                    {/* List */}
                    <FlatList
                        data={flatChapters}
                        keyExtractor={(item, index) => item.id + item.href + index}
                        renderItem={renderChapterItem}
                        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        shadowColor: "#000",
        shadowOffset: { width: 10, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
        elevation: 20,
        overflow: 'hidden', // Ensure radius clips content
    },
});

export default TOCDrawer;
