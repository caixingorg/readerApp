import React, { useState, useMemo, useEffect } from 'react';
import { TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import { useBooks } from '../hooks/useBooks';
import BookItem from '../components/BookItem';
import SearchHistoryTag from '../components/SearchHistoryTag';
import SearchBar from '../components/SearchBar';
import { SearchHistoryRepository } from '../../../services/database/SearchHistoryRepository';

const SearchScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { data: books = [] } = useBooks();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const isFocused = useIsFocused(); // Reload on focus

    useEffect(() => {
        loadHistory();
    }, [isFocused]);

    const loadHistory = async () => {
        const data = await SearchHistoryRepository.getAll();
        setHistory(data);
    };

    const filteredBooks = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return books.filter(book =>
            book.title.toLowerCase().includes(lowerQuery) ||
            book.author.toLowerCase().includes(lowerQuery)
        );
    }, [query, books]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.trim()) {
            await SearchHistoryRepository.add(text.trim());
            // We reload history immediately to reflect "move to top" if it was already there, 
            // or we optimize by optimistic update. For keys simplicity, let's just reload or append.
            // Actually, we usually save on *Submit*, but here we save on type? 
            // Better only save on "Submit" or valid selection.
            // But for now, let's follow the existing pattern: save on non-empty change?
            // Wait, existing code said: if (text.trim() && !history.includes(text.trim()))
            // We should arguably only save when user hits "Enter" or selects a history item or stops typing.
            // But effectively, SearchBar `onChangeText` triggers this.
            // Let's NOT save on every keystroke. 
            // SearchBar usually has `onSubmitEditing`.
        }
    };

    // We need a separate submit handler to save history properly, rather than on every keystroke.
    // However, the previous code called handleSearch on onChangeText. 
    // Let's refactor: onChangeText -> just update query. onSubmit -> save history.

    const onChangeText = (text: string) => {
        setQuery(text);
    };

    const onSubmit = async () => {
        if (query.trim()) {
            await SearchHistoryRepository.add(query.trim());
            loadHistory();
        }
    };

    const clearHistory = async () => {
        await SearchHistoryRepository.clear();
        setHistory([]);
    };

    const deleteHistoryItem = async (item: string) => {
        await SearchHistoryRepository.delete(item);
        loadHistory();
    };

    const renderHeader = () => (
        <Box flexDirection="row" alignItems="center" paddingHorizontal="m" paddingVertical="s" paddingBottom="m">
            <Box flex={1}>
                <SearchBar
                    value={query}
                    onChangeText={onChangeText}
                    onClear={() => setQuery('')}
                    onSubmit={onSubmit} // Ensure SearchBar has this prop or we add it
                />
            </Box>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 12 }}>
                <Text color="primary" fontSize={16} fontWeight="500">{t('search.cancel')}</Text>
            </TouchableOpacity>
        </Box>
    );

    const renderDefaultView = () => (
        <Box flex={1} paddingHorizontal="m">
            {/* History Section */}
            {history.length > 0 && (
                <Box marginTop="l">
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                        <Text variant="subheader">{t('search.history')}</Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Ionicons name="trash-bin-outline" size={18} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                    </Box>
                    <Box flexDirection="row" flexWrap="wrap">
                        {history.map((item, index) => (
                            <SearchHistoryTag
                                key={index}
                                label={item}
                                onPress={() => {
                                    setQuery(item);
                                    SearchHistoryRepository.add(item); // Refresh timestamp
                                }}
                            // Assuming SearchHistoryTag might support long press to delete?
                            // If not, we rely on Clear All for now, or add remove icon
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <ScreenLayout>
            <Box flex={1} paddingTop="s">
                {renderHeader()}

                {!query ? (
                    <FlatList
                        data={[]}
                        renderItem={null}
                        ListHeaderComponent={renderDefaultView}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    />
                ) : (
                    <Box flex={1}>
                        {/* Filter Tabs Mock */}
                        <Box flexDirection="row" paddingHorizontal="m" marginBottom="m" gap="l">
                            <Text fontWeight="bold" color="primary">Best Match</Text>
                            <Text color="textTertiary">Titles</Text>
                            <Text color="textTertiary">Authors</Text>
                        </Box>
                        <Text variant="caption" color="textTertiary" marginLeft="m" marginBottom="s">
                            {t('search.results_found', { count: filteredBooks.length })}
                        </Text>
                        <FlatList
                            data={filteredBooks}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <BookItem
                                    book={item}
                                    viewMode="list"
                                    onPress={() => {
                                        // Navigate to Reader
                                        // @ts-ignore
                                        navigation.navigate('Reader', { bookId: item.id });
                                    }}
                                />
                            )}
                            ListEmptyComponent={
                                <Box flex={1} alignItems="center" marginTop="xxl" padding="xl">
                                    <Box
                                        width={100}
                                        height={100}
                                        borderRadius="full"
                                        backgroundColor="cardSecondary"
                                        alignItems="center"
                                        justifyContent="center"
                                        marginBottom="l"
                                    >
                                        <Ionicons name="search-outline" size={40} color={theme.colors.textTertiary} />
                                    </Box>
                                    <Text variant="header" marginBottom="s">{t('search.no_results')}</Text>
                                    <Text variant="body" color="textSecondary" textAlign="center">
                                        {t('search.no_matches', { query })}
                                    </Text>
                                </Box>
                            }
                        />
                    </Box>
                )}
            </Box>
        </ScreenLayout>
    );
};

export default SearchScreen;
