import React, { useState, useMemo } from 'react';
import { TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import ScreenLayout from '../../../components/ScreenLayout';
import { useBooks } from '../hooks/useBooks';
import BookItem from '../components/BookItem';
import SearchHistoryTag from '../components/SearchHistoryTag';
import SearchBar from '../components/SearchBar';

const MOCK_HISTORY = ['The Three-Body Problem', 'Atomic Habits'];

const SearchScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { data: books = [] } = useBooks();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>(MOCK_HISTORY);

    const filteredBooks = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return books.filter(book =>
            book.title.toLowerCase().includes(lowerQuery) ||
            book.author.toLowerCase().includes(lowerQuery)
        );
    }, [query, books]);

    const handleSearch = (text: string) => {
        setQuery(text);
        if (text.trim() && !history.includes(text.trim())) {
            // Optional: Logic to add to history on submit
        }
    };

    const clearHistory = () => {
        setHistory([]);
    };

    const renderHeader = () => (
        <Box flexDirection="row" alignItems="center" paddingHorizontal="m" paddingVertical="s" paddingBottom="m">
            <Box flex={1}>
                <SearchBar
                    value={query}
                    onChangeText={handleSearch}
                    onClear={() => handleSearch('')}
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
                            <SearchHistoryTag key={index} label={item} onPress={() => setQuery(item)} />
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
