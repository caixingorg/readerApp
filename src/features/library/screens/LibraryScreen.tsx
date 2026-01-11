import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import ActionSheetModal from '@/components/ActionSheetModal';

import FeaturedBook from '@/features/library/components/FeaturedBook';
import RecentBooksList from '@/features/library/components/RecentBooksList';
import BookItem from '@/features/library/components/BookItem';
import FeaturedBookPlaceholder from '@/features/library/components/FeaturedBookPlaceholder';
import EmptyState from '@/features/library/components/EmptyState';
import EditBookModal from '@/features/library/components/EditBookModal';
import { useLibraryLogic } from '@/features/library/hooks/useLibraryLogic';

const LibraryScreen: React.FC = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const {
        books,
        streak,
        refreshing,
        actionSheet,
        editingBook,
        setEditingBook,
        theme,
        onRefresh,
        handleBookPress,
        handleMenuAction,
        handleSaveBook,
        handleFilterPress,
        handleImportPress,
        handleSearchPress
    } = useLibraryLogic();

    const renderHeader = () => (
        <Box marginBottom="xl">
            {/* Featured Book Section (Hero) */}
            <Box paddingHorizontal="m" marginBottom="xl" marginTop="s">
                {books.length > 0 ? (
                    <FeaturedBook
                        book={books[0]}
                        onPress={() => handleBookPress(books[0].id)}
                    />
                ) : (
                    <FeaturedBookPlaceholder
                        onPress={handleImportPress}
                    />
                )}
            </Box>

            {/* Recent / On Your Desk Section - Always Visible */}
            <Box marginBottom="xl">
                <RecentBooksList
                    books={books.length > 0 ? books.slice(0, 4) : []}
                    onBookPress={handleBookPress}
                />
            </Box>

            {/* "All Books" Section Title */}
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m" paddingHorizontal="m">
                <Text variant="subheader" fontSize={20} color="textPrimary" fontWeight="700">
                    {t('library.collection')}
                </Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={handleFilterPress}
                >
                    <Text variant="caption" color="textSecondary" marginRight="s">
                        {t('library.items_count', { count: books.length })}
                    </Text>
                    <Ionicons name="filter" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </Box>
        </Box>
    );

    return (
        <ScreenLayout>
            {/* Editorial Header */}
            <Box
                paddingHorizontal="m"
                paddingTop="m"
                paddingBottom="m"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="mainBackground"
            >
                <Box>
                    <Text variant="header" fontSize={32} fontWeight="800" letterSpacing={-0.5} color="textPrimary">
                        {t('library.title')}
                    </Text>
                    <Text variant="caption" color="textSecondary" textTransform="uppercase" letterSpacing={1}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </Box>

                {/* Stats / Streak Chip */}
                <Box flexDirection="row" alignItems="center">
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        paddingHorizontal="m"
                        paddingVertical="s"
                        borderRadius="full"
                        marginRight="m"
                        backgroundColor="cardSecondary"
                    >
                        <Ionicons name="flame" size={16} color={theme.colors.primary} />
                        <Text variant="caption" fontWeight="bold" marginLeft="s" color="textPrimary">
                            {streak} {t('stats.streak')}
                        </Text>
                    </Box>

                    <TouchableOpacity onPress={handleSearchPress}>
                        <Ionicons name="search" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                </Box>
            </Box>

            {/* Content Area */}
            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={onRefresh}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <Box paddingHorizontal="m">
                        <BookItem
                            book={item}
                            viewMode="list"
                            onPress={() => handleBookPress(item.id)}
                            onMenuPress={() => handleMenuAction(item)}
                            onLongPress={() => handleMenuAction(item)}
                            showFileSize={false}
                            showFormatLabel={true}
                        />
                    </Box>
                )}
                ListEmptyComponent={
                    <Box flex={1} alignItems="center" marginTop="xl">
                        <EmptyState onImport={handleImportPress} onWiFi={handleImportPress} />
                    </Box>
                }
            />

            {/* Import FAB */}
            <Box
                position="absolute"
                bottom={insets.bottom + 80}
                right={24}
            >
                <TouchableOpacity onPress={handleImportPress} activeOpacity={0.8}>
                    <Box
                        width={56}
                        height={56}
                        borderRadius="full"
                        backgroundColor="primary"
                        justifyContent="center"
                        alignItems="center"
                        style={styles.fabShadow}
                    >
                        <Ionicons name="add" size={32} color="white" />
                    </Box>
                </TouchableOpacity>
            </Box>

            <EditBookModal
                key={editingBook?.id}
                visible={!!editingBook}
                book={editingBook}
                onClose={() => setEditingBook(null)}
                onSave={handleSaveBook}
            />

            <ActionSheetModal
                visible={actionSheet.visible}
                title={actionSheet.title}
                actions={actionSheet.actions}
                onClose={actionSheet.close}
            />
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    listContent: {
        paddingBottom: 100
    },
    fabShadow: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    }
});

export default LibraryScreen;
