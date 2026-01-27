import React from 'react';
import { RefreshControl, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import BookItem from '@/features/library/components/BookItem';
import FeaturedBook from '@/features/library/components/FeaturedBook';
import RecentBooksList from '@/features/library/components/RecentBooksList';
import FeaturedBookPlaceholder from '@/features/library/components/FeaturedBookPlaceholder';
import EmptyState from '@/features/library/components/EmptyState';
import { Book } from '@/services/database/types';

interface LibraryListProps {
    books: Book[];
    refreshing: boolean;
    onRefresh: () => void;
    onBookPress: (id: string) => void;
    onMenuAction: (book: Book) => void;
    onFilterPress: () => void;
    onImportPress: () => void;
    theme: any;
}

const LibraryList: React.FC<LibraryListProps> = ({
    books,
    refreshing,
    onRefresh,
    onBookPress,
    onMenuAction,
    onFilterPress,
    onImportPress,
    theme,
}) => {
    const { t } = useTranslation();

    const renderHeader = () => (
        <Box marginBottom="s">
            {/* Featured Book Section (Hero) */}
            <Box paddingHorizontal="m" marginBottom="s" marginTop="s">
                {books.length > 0 ? (
                    <FeaturedBook book={books[0]} onPress={() => onBookPress(books[0].id)} />
                ) : (
                    <FeaturedBookPlaceholder onPress={onImportPress} />
                )}
            </Box>

            {/* Recent / On Your Desk Section - Always Visible */}
            <Box marginBottom="s">
                <RecentBooksList
                    books={books.length > 0 ? books.slice(0, 4) : []}
                    onBookPress={onBookPress}
                />
            </Box>

            {/* "All Books" Section Title */}
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="s"
                paddingHorizontal="m"
            >
                <Text variant="subheader" fontSize={20} color="textPrimary" fontWeight="700">
                    {t('library.collection')}
                </Text>
                <TouchableOpacity onPress={onFilterPress}>
                    <Box flexDirection="row" alignItems="center">
                        <Text variant="caption" color="textSecondary" marginRight="s">
                            {t('library.items_count', { count: books.length })}
                        </Text>
                        <Ionicons name="filter" size={16} color={theme.colors.textSecondary} />
                    </Box>
                </TouchableOpacity>
            </Box>
        </Box>
    );

    return (
        <FlashList<Book>
            data={books}
            keyExtractor={(item) => item.id}
            estimatedItemSize={120}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={theme.colors.primary}
                />
            }
            contentContainerStyle={{ paddingBottom: 160 }}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
                <Box paddingHorizontal="m">
                    <BookItem
                        book={item}
                        viewMode="list"
                        onPress={() => onBookPress(item.id)}
                        onMenuPress={() => onMenuAction(item)}
                        onLongPress={() => onMenuAction(item)}
                        showFileSize={false}
                        showFormatLabel={true}
                    />
                </Box>
            )}
            ListEmptyComponent={
                <Box flex={1} alignItems="center" marginTop="xl">
                    <EmptyState />
                </Box>
            }
        />
    );
};

export default LibraryList;
