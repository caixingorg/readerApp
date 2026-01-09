import React from 'react';
import { TouchableOpacity, View, Image } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Book, Bookmark, Note } from '../../../services/database/types';

interface NotebookItemProps {
    type: 'note' | 'highlight' | 'bookmark';
    data: Note | Bookmark;
    book?: Book;
    onPress: () => void;
    onDelete: () => void;
    onShare?: () => void;
}

const NotebookItem: React.FC<NotebookItemProps> = ({ type, data, book, onPress, onDelete, onShare }) => {
    const theme = useTheme<Theme>();

    // Type Guards and Data Extraction
    const isBookmark = type === 'bookmark';
    const noteData = !isBookmark ? (data as Note) : null;
    const bookmarkData = isBookmark ? (data as Bookmark) : null;

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric'
    }).format(new Date(data.createdAt));

    // Determine vertical bar color for highlights/notes
    const barColor = noteData?.color || theme.colors.primary;

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Box
                backgroundColor="cardPrimary"
                borderRadius="l" // Softer border radius for flat cards
                padding="m"
                marginBottom="m"
                borderWidth={1}
                borderColor="border"
            // REMOVED SHADOWS
            >
                {/* Header: Book Info & Timestamp */}
                <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" marginBottom="s">
                    <Box flexDirection="row" flex={1} marginRight="m">
                        {/* Book Cover (Placeholder or Image) */}
                        <Box
                            width={32}
                            height={48}
                            borderRadius="s"
                            backgroundColor="border"
                            overflow="hidden"
                            marginRight="m"
                        >
                            {book?.cover ? (
                                <Image source={{ uri: book.cover }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Box flex={1} alignItems="center" justifyContent="center" backgroundColor="cardSecondary">
                                    <Ionicons name="book" size={16} color={theme.colors.primary} />
                                </Box>
                            )}
                        </Box>

                        <Box flex={1}>
                            <Box flexDirection="row" alignItems="center" gap="s" marginBottom="xs">
                                {isBookmark && (
                                    <Box
                                        backgroundColor="cardSecondary"
                                        paddingHorizontal="s"
                                        paddingVertical="s"
                                        borderRadius="s"
                                    >
                                        <Text variant="caption" color="primary" fontSize={10} fontWeight="bold">BOOKMARK</Text>
                                    </Box>
                                )}
                                <Text
                                    variant="body"
                                    fontWeight="bold"
                                    numberOfLines={1}
                                    fontSize={14}
                                >
                                    {book?.title || 'Unknown Book'}
                                </Text>
                            </Box>
                            <Text variant="caption" color="textTertiary" fontSize={12} numberOfLines={1}>
                                {isBookmark
                                    ? `Page ${bookmarkData?.page || '?'} • ${(bookmarkData?.percentage || 0).toFixed(0)}%`
                                    : `Chapter ${book?.currentChapterIndex ? book.currentChapterIndex + 1 : '?'}`
                                } • {formattedDate}
                            </Text>
                        </Box>
                    </Box>

                    {/* Options / Delete */}
                    <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="trash-bin-outline" size={18} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                </Box>

                {/* Content */}
                <Box marginTop="s">
                    {isBookmark ? (
                        <Box flexDirection="row" alignItems="center">
                            <Ionicons name="bookmark" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text variant="body" color="text" numberOfLines={2} fontStyle="italic">
                                {bookmarkData?.previewText || 'No preview available'}
                            </Text>
                        </Box>
                    ) : (
                        <Box>
                            {/* Highlight Text */}
                            <Box flexDirection="row" marginBottom="s">
                                <Box width={4} borderRadius="full" style={{ backgroundColor: barColor }} marginRight="m" />
                                {/* removed backgroundColor="primary" prop from Box above to avoid conflict/override */}
                                <Text variant="body" color="text" style={{ fontFamily: 'serif', lineHeight: 22 }}>
                                    "{noteData?.fullText}"
                                </Text>
                            </Box>

                            {/* User Note */}
                            {noteData?.note && (
                                <Box flexDirection="row" alignItems="flex-start" marginTop="xs" paddingLeft="l">
                                    <Ionicons name="create-outline" size={16} color={theme.colors.textSecondary} style={{ marginRight: 8, marginTop: 2 }} />
                                    <Text variant="body" color="textSecondary" fontSize={14}>
                                        {noteData.note}
                                    </Text>
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Actions Footer (Share) - Optional based on design */}
                {onShare && (
                    <Box flexDirection="row" justifyContent="flex-end" marginTop="m">
                        <TouchableOpacity onPress={onShare}>
                            <Ionicons name="share-social-outline" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </Box>
                )}
            </Box>
        </TouchableOpacity>
    );
};

export default NotebookItem;
