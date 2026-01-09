import React from 'react';
import { TouchableOpacity, Image, View, Text, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import clsx from 'clsx';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';
import Card from '../../../components/Card';
import Box from '../../../components/Box';
import { useTranslation } from 'react-i18next';
import BookCover from './BookCover';

interface BookItemProps {
    book: Book;
    viewMode: 'grid' | 'list';
    onPress: () => void;
    onLongPress?: () => void;
    onMenuPress?: () => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    showFileSize?: boolean;
    showFormatLabel?: boolean;
}

// ... (imports)

const CircularProgress = ({ progress }: { progress: number }) => {
    const theme = useTheme<Theme>();
    // C ~= 100
    const dashArray = `${progress}, 100`;

    return (
        <View style={{ width: 24, height: 24, transform: [{ rotate: '-90deg' }] }}>
            <Svg viewBox="0 0 36 36" width="100%" height="100%">
                <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.colors.border} // textSecondary or similar light gray
                    strokeWidth="4"
                />
                <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth="4"
                    strokeDasharray={dashArray}
                />
            </Svg>
        </View>
    );
};

const BookItem: React.FC<BookItemProps> = ({
    book, viewMode, onPress, onLongPress, onMenuPress,
    isSelectionMode = false, isSelected = false,
    showFileSize = false, showFormatLabel = true
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    // const safeCover = getSafePath(book.cover); // Removed unused
    const isGrid = viewMode === 'grid';

    // Helper to format size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Format Badge Color - Using Warning (#FF6F00) for all as per design or sticking to distinct colors?
    // Design uses pure warning orange for EPUB. I'll stick to that style.
    const getFormatBadgeStyle = () => {
        return "bg-amber-600"; // Close to warning #FF6F00
    };

    const isFinished = book.progress >= 99;
    const isUnread = book.progress < 1;

    const { width } = useWindowDimensions();
    // FlatList has padding s (8), so total horizontal padding is 16.
    // Item has margin 6, so total item horizontal margin is 12.
    // Two items: 2*width + 24 = Screen - 16
    // 2*width = Screen - 40
    // width = (Screen - 40) / 2
    const itemWidth = (width - ((theme.spacing.s || 8) * 2) - 24) / 2;

    if (isGrid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onLongPress?.();
                }}
                delayLongPress={500}
                // Fixed width for 2-column grid
                style={{
                    width: itemWidth,
                    margin: 6
                }}
                activeOpacity={0.8}
            >
                <Box
                    className={clsx(
                        "overflow-hidden rounded-lg shadow-sm",
                        isSelected && "ring-2 ring-primary-500 rounded-xl"
                    )}
                    backgroundColor="cardPrimary"
                >
                    {/* Cover Area - 3/4 Aspect Ratio */}
                    <View className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                        <BookCover
                            cover={book.cover}
                            title={book.title}
                            width="100%"
                            height="100%"
                            borderRadius={0}
                        >
                            {/* Format Badge */}
                            {showFormatLabel && (
                                <View
                                    style={{ backgroundColor: theme.colors.warning }}
                                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded shadow-sm z-10"
                                >
                                    <Text className="text-white text-[10px] font-bold">
                                        {book.fileType?.toUpperCase() || 'TXT'}
                                    </Text>
                                </View>
                            )}

                            {/* Selection Overlay */}
                            {isSelectionMode && (
                                <View className={clsx(
                                    "absolute inset-0 z-10 items-center justify-center",
                                    isSelected ? "bg-black/20" : "bg-transparent"
                                )}>
                                    <View className={clsx(
                                        "w-6 h-6 rounded-full border-2 items-center justify-center absolute top-2 left-2 bg-white dark:bg-gray-900",
                                        isSelected ? "border-primary-500 bg-primary-500" : "border-gray-400"
                                    )}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                    </View>
                                </View>
                            )}
                        </BookCover>
                    </View>

                    {/* Info Area */}
                    <View className="p-3">
                        <View className="flex-row justify-between items-start gap-2 mb-1">
                            <Text numberOfLines={2} className="flex-1 text-[16px] font-medium leading-tight" style={{ color: theme.colors.textPrimary }}>
                                {book.title}
                            </Text>

                            {/* Progress Ring */}
                            {!isFinished && !isUnread && (
                                <CircularProgress progress={book.progress} />
                            )}
                            {isFinished && (
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                            )}
                        </View>

                        <Text numberOfLines={1} className="text-[14px] text-gray-500 dark:text-gray-400">
                            {book.author || t('book.unknown_author')}
                        </Text>
                    </View>
                </Box>
            </TouchableOpacity>
        );
    }

    // List Layout
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onLongPress?.();
            }}
            activeOpacity={0.7}
        >
            <Card
                variant="flat"
                className={clsx(
                    "flex-row items-center p-3 mb-3 border",
                    isSelected ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-transparent"
                )}
                style={{ backgroundColor: isSelected ? undefined : theme.colors.cardPrimary }} // Allow selection color override or handle logic
            >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <View className="mr-3">
                        <View className={clsx(
                            "w-5 h-5 rounded-full border-2 items-center justify-center",
                            isSelected ? "border-primary-500 bg-primary-500" : "border-gray-400 bg-transparent"
                        )}>
                            {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                        </View>
                    </View>
                )}

                {/* Cover */}
                <BookCover
                    cover={book.cover}
                    title={book.title}
                    width={48}
                    height={64}
                    borderRadius={6}
                    style={{ marginRight: 12 }}
                >
                    {isUnread && !isFinished && (
                        <View className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800" />
                    )}
                </BookCover>

                {/* Info */}
                <View className="flex-1 justify-center">
                    <View className="flex-row items-center mb-0.5">
                        <Text numberOfLines={1} className="flex-1 text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                            {book.title}
                        </Text>
                        {isFinished && <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} className="ml-1" />}
                    </View>

                    <Text numberOfLines={1} className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                        {book.author || t('book.unknown_author')}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        {!isFinished && book.progress > 0 ? (
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mr-2">
                                    <View className="h-full bg-primary-500 rounded-full" style={{ width: `${book.progress}%` }} />
                                </View>
                                <Text className="text-[10px] text-gray-400 font-bold">
                                    {Math.round(book.progress)}%
                                </Text>
                            </View>
                        ) : isFinished ? (
                            <Text className="text-[10px] text-green-600 font-bold uppercase tracking-wider">{t('book.status.completed')}</Text>
                        ) : (
                            <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('book.status.unread')}</Text>
                        )}

                        {showFileSize && book.size && (
                            <Text className="text-[10px] text-gray-400 ml-2">
                                {formatSize(book.size)}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Menu Button */}
                {!isSelectionMode && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onMenuPress?.();
                        }}
                        className="p-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </Card>
        </TouchableOpacity>
    );
};

export default BookItem;
