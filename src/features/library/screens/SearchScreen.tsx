import React, { useState, useMemo, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { useBooks } from '@/features/library/hooks/useBooks';
import BookItem from '@/features/library/components/BookItem';
import SearchHistoryTag from '@/features/library/components/SearchHistoryTag';
import SearchBar from '@/features/library/components/SearchBar';
import { SearchHistoryRepository } from '@/services/database/SearchHistoryRepository';
import { Book } from '@/services/database/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SearchScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const { data: books = [] } = useBooks();
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) loadHistory();
    }, [isFocused]);

    const loadHistory = async () => {
        const data = await SearchHistoryRepository.getAll();
        setHistory(data);
    };

    const filteredBooks = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return (books as Book[]).filter(
            (book) =>
                book.title.toLowerCase().includes(lowerQuery) ||
                book.author.toLowerCase().includes(lowerQuery),
        );
    }, [query, books]);

    const onSubmitSearch = async (text: string = query) => {
        if (text.trim()) {
            await SearchHistoryRepository.add(text.trim());
            loadHistory();
        }
    };

    const clearHistory = async () => {
        await SearchHistoryRepository.clear();
        setHistory([]);
    };

    const renderEmptySearch = () => (
        <Box paddingHorizontal="m">
            {history.length > 0 && (
                <Box marginTop="l">
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="m"
                    >
                        <Text variant="subheader">{t('search.history')}</Text>
                        <TouchableOpacity onPress={clearHistory}>
                            <Ionicons
                                name="trash-bin-outline"
                                size={18}
                                color={theme.colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </Box>
                    <Box flexDirection="row" flexWrap="wrap">
                        {history.map((item, index) => (
                            <SearchHistoryTag
                                key={index}
                                label={item}
                                onPress={() => {
                                    setQuery(item);
                                    onSubmitSearch(item);
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );

    const renderNoResults = () => (
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
            <Text variant="header" marginBottom="s">
                {t('search.no_results')}
            </Text>
            <Text variant="body" color="textSecondary" textAlign="center">
                {t('search.no_matches', { query })}
            </Text>
        </Box>
    );

    return (
        <ScreenLayout
            showBack
            onGoBack={() => navigation.goBack()}
            headerCenter={
                <Box flex={1}>
                    <SearchBar
                        value={query}
                        onChangeText={setQuery}
                        onClear={() => setQuery('')}
                        onSubmit={() => onSubmitSearch()}
                    />
                </Box>
            }
            headerRight={
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text color="primary" fontSize={16} fontWeight="500">
                        {t('search.cancel')}
                    </Text>
                </TouchableOpacity>
            }
        >
            <Box flex={1} paddingTop="s">
                {!query ? (
                    renderEmptySearch()
                ) : (
                    <Box flex={1}>
                        <Box flexDirection="row" paddingHorizontal="m" marginBottom="m" gap="l">
                            <Text fontWeight="bold" color="primary">
                                Best Match
                            </Text>
                            <Text color="textTertiary">Titles</Text>
                            <Text color="textTertiary">Authors</Text>
                        </Box>
                        <Text
                            variant="caption"
                            color="textTertiary"
                            marginLeft="m"
                            marginBottom="s"
                        >
                            {t('search.results_found', { count: filteredBooks.length })}
                        </Text>
                        <FlashList<Book>
                            data={filteredBooks}
                            keyExtractor={(item) => item.id}
                            estimatedItemSize={120}
                            renderItem={({ item }) => (
                                <Box paddingHorizontal="m">
                                    <BookItem
                                        book={item}
                                        viewMode="list"
                                        onPress={() =>
                                            navigation.navigate('Reader', { bookId: item.id })
                                        }
                                    />
                                </Box>
                            )}
                            ListEmptyComponent={renderNoResults()}
                        />
                    </Box>
                )}
            </Box>
        </ScreenLayout>
    );
};

export default SearchScreen;
