import React, { useMemo } from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Card from '@/components/Card';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import { getSafePath } from '@/utils/PathUtils';

interface ContinueReadingProps {
    book: Book;
    onPress: () => void;
    onHistoryPress?: () => void;
}

const ContinueReading: React.FC<ContinueReadingProps> = ({ book, onPress, onHistoryPress }) => {
    const theme = useTheme<Theme>();
    const safeCover = getSafePath(book.cover);

    const progressStyle = useMemo(() => ({
        width: `${book.progress}%`
    }), [book.progress]);

    return (
        <Box paddingHorizontal="l" marginVertical="m">
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                <Text variant="title" fontWeight="bold">Continue Reading</Text>
                <TouchableOpacity onPress={onHistoryPress}>
                    <Text color="primary" fontSize={14}>History</Text>
                </TouchableOpacity>
            </Box>

            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                <Card variant="elevated" className="flex-row p-4 items-center">
                    {/* Cover */}
                    <Box className="w-24 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm mr-4 items-center justify-center">
                        {safeCover ? (
                            <Image
                                source={{ uri: safeCover }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Ionicons name="book" size={40} color={theme.colors.primary} />
                        )}
                    </Box>

                    {/* Info */}
                    <Box flex={1} justifyContent="center">
                        <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                                <Text numberOfLines={1} variant="title" fontSize={18} fontWeight="bold" marginBottom="xs">
                                    {book.title}
                                </Text>
                                <Text numberOfLines={1} color="textSecondary" fontSize={14} marginBottom="l">
                                    {book.author || 'Unknown Author'}
                                </Text>
                            </Box>
                            <TouchableOpacity className="p-1">
                                <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </Box>

                        <Box>
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
                                <Text color="textTertiary" fontSize={12}>
                                    Chapter 4: The Reunion
                                </Text>
                                <Text color="primary" fontSize={12} fontWeight="bold">
                                    {Math.round(book.progress)}%
                                </Text>
                            </Box>
                            <Box className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <Box
                                    className="h-full bg-primary-500 rounded-full"
                                    width={progressStyle.width as any}
                                />
                            </Box>
                        </Box>
                    </Box>
                </Card>
            </TouchableOpacity>
        </Box>
    );
};

export default ContinueReading;
