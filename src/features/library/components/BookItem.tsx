import { TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import clsx from 'clsx';
import Svg, { Path } from 'react-native-svg';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import Card from '@/components/Card';
import Box from '@/components/Box';
import Text from '@/components/Text';
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

const CircularProgress = ({ progress }: { progress: number }) => {
    const theme = useTheme<Theme>();
    const dashArray = `${progress}, 100`;

    return (
        <Box width={24} height={24} style={styles.circularRotation}>
            <Svg viewBox="0 0 36 36" width="100%" height="100%">
                <Path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={theme.colors.border}
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
        </Box>
    );
};

const BookItem: React.FC<BookItemProps> = ({
    book, viewMode, onPress, onLongPress, onMenuPress,
    isSelectionMode = false, isSelected = false,
    showFileSize = false, showFormatLabel = true
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const isGrid = viewMode === 'grid';

    // Helper to format size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isFinished = book.progress >= 99;
    const isUnread = book.progress < 1;

    const { width } = useWindowDimensions();
    const itemWidth = (width - ((theme.spacing.s || 8) * 2) - 24) / 2;

    const cardBgColor = isSelected ? undefined : theme.colors.cardPrimary;

    const cardStyle = useMemo(() => ({
        backgroundColor: isSelected ? undefined : theme.colors.cardPrimary
    }), [isSelected, theme.colors.cardPrimary]);

    if (isGrid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onLongPress?.();
                }}
                delayLongPress={500}
                activeOpacity={0.8}
            >
                <Box
                    className={clsx(
                        "overflow-hidden rounded-lg shadow-sm",
                        isSelected && "ring-2 ring-primary-500 rounded-xl"
                    )}
                    backgroundColor="cardPrimary"
                    width={itemWidth}
                    margin="xs"
                >
                    {/* Cover Area - 3/4 Aspect Ratio */}
                    <Box className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                        <BookCover
                            cover={book.cover}
                            title={book.title}
                            width="100%"
                            height="100%"
                            borderRadius="none"
                        >
                            {/* Format Badge */}
                            {showFormatLabel && (
                                <Box
                                    backgroundColor="warning"
                                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded shadow-sm z-10"
                                >
                                    <Text color="white" fontSize={10} fontWeight="bold">
                                        {book.fileType?.toUpperCase() || 'TXT'}
                                    </Text>
                                </Box>
                            )}

                            {/* Selection Overlay */}
                            {isSelectionMode && (
                                <Box className={clsx(
                                    "absolute inset-0 z-10 items-center justify-center",
                                    isSelected ? "bg-black/20" : "bg-transparent"
                                )}>
                                    <Box className={clsx(
                                        "w-6 h-6 rounded-full border-2 items-center justify-center absolute top-2 left-2 bg-white dark:bg-gray-900",
                                        isSelected ? "border-primary-500 bg-primary-500" : "border-gray-400"
                                    )}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                                    </Box>
                                </Box>
                            )}
                        </BookCover>
                    </Box>

                    {/* Info Area */}
                    <Box className="p-3">
                        <Box className="flex-row justify-between items-start gap-2 mb-1">
                            <Text numberOfLines={2} className="flex-1 text-[16px] font-medium leading-tight" color="textPrimary">
                                {book.title}
                            </Text>

                            {/* Progress Ring */}
                            {!isFinished && !isUnread && (
                                <CircularProgress progress={book.progress} />
                            )}
                            {isFinished && (
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                            )}
                        </Box>

                        <Text numberOfLines={1} className="text-[14px] text-gray-500 dark:text-gray-400">
                            {book.author || t('book.unknown_author')}
                        </Text>
                    </Box>
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
                style={cardStyle}
            >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                    <Box className="mr-3">
                        <Box className={clsx(
                            "w-5 h-5 rounded-full border-2 items-center justify-center",
                            isSelected ? "border-primary-500 bg-primary-500" : "border-gray-400 bg-transparent"
                        )}>
                            {isSelected && <Ionicons name="checkmark" size={12} color="white" />}
                        </Box>
                    </Box>
                )}

                {/* Cover */}
                <BookCover
                    cover={book.cover}
                    title={book.title}
                    width={48}
                    height={64}
                    borderRadius="s"
                    style={styles.listCover}
                >
                    {isUnread && !isFinished && (
                        <Box className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800" />
                    )}
                </BookCover>

                {/* Info */}
                <Box className="flex-1 justify-center">
                    <Box className="flex-row items-center mb-0.5">
                        <Text numberOfLines={1} className="flex-1 text-base font-semibold" color="textPrimary">
                            {book.title}
                        </Text>
                        {isFinished && <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} className="ml-1" />}
                    </Box>

                    <Text numberOfLines={1} className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                        {book.author || t('book.unknown_author')}
                    </Text>

                    <Box className="flex-row items-center justify-between">
                        {!isFinished && book.progress > 0 ? (
                            <Box className="flex-row items-center flex-1 mr-4">
                                <Box className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full mr-2">
                                    <Box className="h-full bg-primary-500 rounded-full" style={{ width: `${book.progress}%` }} />
                                </Box>
                                <Text className="text-[10px] text-gray-400 font-bold">
                                    {Math.round(book.progress)}%
                                </Text>
                            </Box>
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
                    </Box>
                </Box>

                {/* Menu Button */}
                {!isSelectionMode && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onMenuPress?.();
                        }}
                        className="p-2"
                        hitSlop={styles.hitSlop}
                    >
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    circularRotation: {
        transform: [{ rotate: '-90deg' }]
    },
    listCover: {
        marginRight: 12
    },
    hitSlop: {
        top: 10, bottom: 10, left: 10, right: 10
    }
});

export default BookItem;
