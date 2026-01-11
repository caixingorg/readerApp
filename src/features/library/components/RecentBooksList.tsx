import React, { useMemo } from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';
import BookCover from './BookCover';

interface RecentBooksListProps {
    books: Book[];
    onBookPress: (bookId: string) => void;
    onMorePress?: () => void;
}

type ListItem = Book | number;

const RecentBooksList: React.FC<RecentBooksListProps> = ({ books, onBookPress, onMorePress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const placeholderData: number[] = [1, 2, 3];
    const dataToRender: ListItem[] = books.length > 0 ? books : placeholderData;

    const renderItem = ({ item }: { item: ListItem }) => {
        // Placeholder Render
        if (typeof item === 'number') {
            return (
                <Box marginRight="m" width={100} opacity={0.5}>
                    <Box
                        marginBottom="s"
                        height={140}
                        width={100}
                        borderRadius="m"
                        backgroundColor="cardSecondary"
                        justifyContent="center"
                        alignItems="center"
                        borderWidth={1}
                        borderColor="border"
                        style={styles.dashedBorder}
                    >
                        <Ionicons name="book" size={24} color={theme.colors.textTertiary} />
                    </Box>
                    <Box height={10} width={80} backgroundColor="cardSecondary" borderRadius="s" marginBottom="xs" />
                    <Box height={10} width={50} backgroundColor="cardSecondary" borderRadius="s" />
                </Box>
            );
        }

        // Real Book Render
        return (
            <TouchableOpacity onPress={() => onBookPress(item.id)} activeOpacity={0.7}>
                <Box marginRight="m" width={100}>
                    <Box marginBottom="s" style={styles.bookShadow}>
                        <BookCover
                            cover={item.cover}
                            title={item.title}
                            width={100}
                            height={140}
                            borderRadius="m"
                        />
                        {item.progress > 0 && (
                            <Box
                                position="absolute"
                                bottom={0}
                                left={0}
                                right={0}
                                height={3}
                                backgroundColor="border"
                                borderBottomLeftRadius="m"
                                borderBottomRightRadius="m"
                                overflow="hidden"
                            >
                                <Box
                                    height="100%"
                                    width={`${item.progress}%` as any}
                                    backgroundColor="primary"
                                />
                            </Box>
                        )}
                    </Box>
                    <Text variant="caption" numberOfLines={2} color="textPrimary" fontWeight="500">
                        {item.title}
                    </Text>
                </Box>
            </TouchableOpacity>
        );
    };

    return (
        <Box>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" paddingHorizontal="m" marginBottom="m">
                <Text variant="subheader" fontSize={18}>{t('recent.title')}</Text>
            </Box>
            <FlatList
                horizontal
                data={dataToRender}
                renderItem={renderItem}
                keyExtractor={(item) => typeof item === 'number' ? `placeholder-${item}` : item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </Box>
    );
};

const styles = StyleSheet.create({
    dashedBorder: {
        borderStyle: 'dashed'
    },
    bookShadow: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    listContent: {
        paddingHorizontal: 16
    }
});

export default RecentBooksList;
