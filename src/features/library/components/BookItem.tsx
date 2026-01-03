import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';

interface BookItemProps {
    book: Book;
    onPress: () => void;
    onDelete?: () => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onPress, onDelete }) => {
    const theme = useTheme<Theme>();

    return (
        <TouchableOpacity onPress={onPress}>
            <Box
                backgroundColor="card"
                padding="m"
                marginBottom="s"
                borderRadius="m"
                borderWidth={1}
                borderColor="border"
                flexDirection="row"
                alignItems="center"
            >
                {/* Icon placeholder for book cover */}
                <Box
                    width={48}
                    height={64}
                    backgroundColor="foreground"
                    borderRadius="s"
                    marginRight="m"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Ionicons name="book" size={24} color={theme.colors.primary} />
                </Box>

                {/* Book info */}
                <Box flex={1}>
                    <Text variant="title" numberOfLines={1} marginBottom="xs">
                        {book.title}
                    </Text>
                    <Text variant="caption" numberOfLines={1} marginBottom="xs">
                        {book.author}
                    </Text>
                    {book.progress > 0 && (
                        <Box flexDirection="row" alignItems="center" marginTop="xs">
                            <Box
                                height={4}
                                flex={1}
                                backgroundColor="borderLight"
                                borderRadius="full"
                                marginRight="s"
                            >
                                <Box
                                    height={4}
                                    width={`${book.progress}%`}
                                    backgroundColor="primary"
                                    borderRadius="full"
                                />
                            </Box>
                            <Text variant="small" color="textTertiary">
                                {Math.round(book.progress)}%
                            </Text>
                        </Box>
                    )}
                </Box>

                {/* Action buttons */}
                <Box flexDirection="row" alignItems="center" gap="m">
                    {onDelete && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Ionicons
                                name="trash-outline"
                                size={20}
                                color={theme.colors.error}
                            />
                        </TouchableOpacity>
                    )}
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={theme.colors.textSecondary}
                    />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

export default BookItem;
