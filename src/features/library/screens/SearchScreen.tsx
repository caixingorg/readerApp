import React, { useState, useMemo } from 'react';
import { TouchableOpacity, FlatList, TextInput, Keyboard } from 'react-native';
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

const POPULAR_SEARCHES = ['Design Systems', 'Sci-Fi', 'Psychology', 'Minimalism', 'React Native'];
const MOCK_HISTORY = ['The Three-Body Problem', 'Atomic Habits'];
const TRENDING_BOOKS = [
    { rank: 1, title: 'Elon Musk', author: 'Walter Isaacson', category: 'Biography' },
    { rank: 2, title: 'Deep Work', author: 'Cal Newport', category: 'Productivity' },
    { rank: 3, title: 'Project Hail Mary', author: 'Andy Weir', category: 'Sci-Fi' },
];

const SearchScreen: React.FC = () => {
    const theme = useTheme<Theme>();
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
            <Box
                flex={1}
                flexDirection="row"
                alignItems="center"
                backgroundColor="card"
                borderRadius="l"
                paddingHorizontal="m"
                height={48}
                borderWidth={1}
                borderColor="border"
            >
                <Ionicons name="search" size={20} color={theme.colors.textTertiary} />
                <TextInput
                    style={{
                        flex: 1,
                        marginLeft: 10,
                        fontSize: 16,
                        color: theme.colors.text,
                        height: '100%'
                    }}
                    placeholder="Search local books..."
                    placeholderTextColor={theme.colors.textTertiary}
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                )}
            </Box>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 16 }}>
                <Text color="text" fontSize={16}>Cancel</Text>
            </TouchableOpacity>
        </Box>
    );

    const renderDefaultView = () => (
        <Box flex={1} paddingHorizontal="m">
            {/* History Section */}
            {history.length > 0 && (
                <Box marginTop="l">
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                        <Text variant="subheader">History</Text>
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

            {/* Popular Section */}
            <Box marginTop="l">
                <Text variant="subheader" marginBottom="m">Popular in Library</Text>
                <Box flexDirection="row" flexWrap="wrap">
                    {POPULAR_SEARCHES.map((item, index) => (
                        <SearchHistoryTag
                            key={index}
                            label={item}
                            onPress={() => setQuery(item)}
                            isTrending={index === 0} // Just for demo
                        />
                    ))}
                </Box>
            </Box>

            {/* Trending Visual List (Mock) */}
            <Box marginTop="xl">
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
                    <Text variant="subheader">Trending Now</Text>
                    <TouchableOpacity>
                        <Text color="primary" fontSize={12} fontWeight="bold">VIEW ALL</Text>
                    </TouchableOpacity>
                </Box>
                <Box backgroundColor="card" borderRadius="l" overflow="hidden">
                    {TRENDING_BOOKS.map((book, index) => (
                        <Box
                            key={index}
                            flexDirection="row"
                            padding="m"
                            borderBottomWidth={index < TRENDING_BOOKS.length - 1 ? 1 : 0}
                            borderColor="borderLight"
                            alignItems="center"
                        >
                            <Text
                                fontSize={18}
                                fontWeight="bold"
                                color={index < 3 ? "primary" : "text"}
                                width={30}
                                textAlign="center"
                            >
                                {book.rank}
                            </Text>
                            <Box flex={1}>
                                <Text fontWeight="bold" fontSize={16} marginBottom="xs">{book.title}</Text>
                                <Text color="textSecondary" fontSize={12}>{book.category} · {book.author}</Text>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
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
                            {filteredBooks.length} RESULTS FOUND
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
                                        width={80}
                                        height={80}
                                        borderRadius="full"
                                        backgroundColor="background"
                                        alignItems="center"
                                        justifyContent="center"
                                        marginBottom="l"
                                    >
                                        <Ionicons name="search" size={40} color={theme.colors.textTertiary} />
                                    </Box>
                                    <Text variant="header" marginBottom="s">No results found</Text>
                                    <Text variant="body" color="textSecondary" textAlign="center">
                                        We couldn't find any matches for "{query}"
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
