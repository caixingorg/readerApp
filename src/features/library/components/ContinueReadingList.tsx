import React from 'react';
import { FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database';

interface ContinueReadingListProps {
    books: Book[];
    onPress: (book: Book) => void;
}

const ContinueReadingList: React.FC<ContinueReadingListProps> = ({ books, onPress }) => {
    const theme = useTheme<Theme>();

    if (!books || books.length === 0) return null;

    const renderItem = ({ item }: { item: Book }) => {
        const progressPercent = Math.round(item.progress || 0);

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onPress(item)}
                style={styles.itemContainer}
            >
                <Box
                    width={280}
                    height={100}
                    backgroundColor="card"
                    borderRadius="m"
                    padding="m"
                    flexDirection="row"
                    gap="m"
                    shadowColor="black"
                    shadowOpacity={0.12}
                    shadowRadius={3}
                    shadowOffset={styles.cardShadowOffset}
                    elevation={3}
                >
                    {/* Cover */}
                    <Box
                        width={60}
                        height={76}
                        borderRadius="s"
                        backgroundColor="borderLight"
                        overflow="hidden"
                        shadowColor="black"
                        shadowOpacity={0.1}
                        shadowRadius={2}
                        shadowOffset={styles.coverShadowOffset}
                        elevation={1}
                    >
                        {item.cover ? (
                            <Image
                                source={{ uri: item.cover }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ) : (
                            <Box flex={1} justifyContent="center" alignItems="center">
                                <Text variant="small" color="textSecondary">No Cover</Text>
                            </Box>
                        )}
                    </Box>

                    {/* Info */}
                    <Box flex={1} justifyContent="space-between" paddingVertical="xs">
                        <Box>
                            <Text
                                variant="subheader"
                                fontSize={16}
                                numberOfLines={1}
                                marginBottom="xs"
                            >
                                {item.title}
                            </Text>
                            <Text
                                variant="body"
                                fontSize={14}
                                color="textSecondary"
                                numberOfLines={1}
                            >
                                {item.author}
                            </Text>
                        </Box>

                        {/* Progress Bar */}
                        <Box flexDirection="row" alignItems="center" gap="s">
                            <Box
                                flex={1}
                                height={4}
                                backgroundColor="borderLight"
                                borderRadius="full"
                                overflow="hidden"
                            >
                                <Box
                                    width={`${progressPercent}%` as any}
                                    height="100%"
                                    backgroundColor="primary"
                                    borderRadius="full"
                                />
                            </Box>
                            <Text variant="small" color="textSecondary" fontWeight="500">
                                {progressPercent}%
                            </Text>
                        </Box>
                    </Box>
                </Box>
            </TouchableOpacity>
        );
    };

    return (
        <Box marginTop="m">
            <Text
                variant="header"
                fontSize={18}
                paddingHorizontal="l"
                marginBottom="s"
            >
                继续阅读
            </Text>
            <FlatList
                horizontal
                data={books}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    {
                        paddingHorizontal: theme.spacing.m,
                        paddingBottom: theme.spacing.s
                    }
                ]}
            />
        </Box>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        marginRight: 12
    },
    cardShadowOffset: {
        width: 0,
        height: 1
    },
    coverShadowOffset: {
        width: 0,
        height: 1
    },
    image: {
        width: '100%',
        height: '100%'
    },
    listContent: {
        // dynamic padding applied in component
    }
});

export default ContinueReadingList;
