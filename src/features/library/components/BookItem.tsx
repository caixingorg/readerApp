import React from 'react';
import { TouchableOpacity, Image, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import clsx from 'clsx';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';
import Card from '../../../components/Card';
import { LinearGradient } from 'expo-linear-gradient';

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

const BookItem: React.FC<BookItemProps> = ({
    book, viewMode, onPress, onLongPress, onMenuPress,
    isSelectionMode = false, isSelected = false,
    showFileSize = false, showFormatLabel = true
}) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(book.cover);
    const isGrid = viewMode === 'grid';

    // Helper to format size
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Format Badge Color
    const getFormatColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'epub': return 'bg-green-500';
            case 'pdf': return 'bg-red-500';
            case 'txt': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    if (isGrid) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onLongPress?.();
                }}
                delayLongPress={500}
                className="flex-1 m-1.5"
                activeOpacity={0.8}
            >
                <Card
                    variant="elevated"
                    className={clsx(
                        "p-0 overflow-hidden border",
                        isSelected ? "border-primary-500 ring-2 ring-primary-500" : "border-gray-100 dark:border-gray-800"
                    )}
                >
                    {/* Cover Area */}
                    <View className="h-44 bg-gray-100 dark:bg-gray-800 items-center justify-center relative">
                        {safeCover ? (
                            <Image
                                source={{ uri: safeCover }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="items-center justify-center w-full h-full">
                                <Ionicons name="book" size={48} color={theme.colors.primary} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.05)']}
                                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                                />
                            </View>
                        )}

                        {/* Gradient Overlay for text readability if needed, or just style */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                            className="absolute bottom-0 left-0 right-0 h-10"
                        />

                        {/* Format Badge */}
                        {showFormatLabel && (
                            <View className={clsx(
                                "absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs shadow-sm",
                                getFormatColor(book.fileType || 'txt')
                            )}>
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
                    </View>

                    {/* Info Area */}
                    <View className="p-3 bg-white dark:bg-gray-900">
                        <Text numberOfLines={1} className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-0.5">
                            {book.title}
                        </Text>
                        <Text numberOfLines={1} className="text-xs text-gray-500 dark:text-gray-400">
                            {book.author || 'Unknown Author'}
                        </Text>

                        {/* Progress Bar */}
                        {book.progress > 0 && (
                            <View className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                                <View
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${book.progress}%` }}
                                />
                            </View>
                        )}
                    </View>
                </Card>
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
                    isSelected ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-transparent bg-white dark:bg-gray-800"
                )}
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
                <View className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden mr-3 items-center justify-center shadow-sm">
                    {safeCover ? (
                        <Image
                            source={{ uri: safeCover }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="book" size={20} color={theme.colors.textSecondary} />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1 justify-center">
                    <View className="flex-row items-center mb-1">
                        {showFormatLabel && (
                            <View className={clsx("px-1.5 py-0.5 rounded mr-2", getFormatColor(book.fileType || 'txt'))}>
                                <Text className="text-white text-[10px] font-bold">
                                    {book.fileType?.toUpperCase() || 'TXT'}
                                </Text>
                            </View>
                        )}
                        <Text numberOfLines={1} className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                            {book.title}
                        </Text>
                    </View>

                    <Text numberOfLines={1} className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">
                        {book.author || 'Unknown'}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        {book.progress > 0 ? (
                            <View className="flex-row items-center flex-1 mr-4">
                                <View className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                                    <View className="h-full bg-primary-500 rounded-full" style={{ width: `${book.progress}%` }} />
                                </View>
                                <Text className="text-xs text-gray-400">
                                    {Math.round(book.progress)}%
                                </Text>
                            </View>
                        ) : <View className="flex-1" />}

                        {showFileSize && book.size && (
                            <Text className="text-xs text-gray-400">
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
                        <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </Card>
        </TouchableOpacity>
    );
};

export default BookItem;
