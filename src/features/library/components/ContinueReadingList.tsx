import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useTheme } from '@shopify/restyle';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';
import { Book } from '@/services/database/types';

interface ContinueReadingListProps {
    books: Book[];
    onPress: (book: Book) => void;
}

const ContinueReadingList: React.FC<ContinueReadingListProps> = ({ books, onPress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    if (!books || books.length === 0) return null;

    const renderItem = ({ item }: { item: Book }) => {
        const progressPercent = Math.round(item.progress || 0);

        return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(item)}>
                <Box
                    width={280}
                    height={100}
                    backgroundColor="card"
                    borderRadius="m"
                    padding="m"
                    flexDirection="row"
                    gap="m"
                    marginRight="m"
                    style={{
                        shadowColor: 'black',
                        shadowOpacity: 0.12,
                        shadowRadius: 3,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: 3,
                    }}
                >
                    {/* Cover */}
                    <Box
                        width={60}
                        height={76}
                        borderRadius="s"
                        backgroundColor="borderLight"
                        overflow="hidden"
                        style={{
                            shadowColor: 'black',
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            shadowOffset: { width: 0, height: 1 },
                            elevation: 1,
                        }}
                    >
                        {item.cover ? (
                            <Image
                                source={{ uri: item.cover }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <Box flex={1} justifyContent="center" alignItems="center">
                                <Text variant="small" color="textSecondary">
                                    No Cover
                                </Text>
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
            <Text variant="header" fontSize={18} paddingHorizontal="m" marginBottom="s">
                {t('common.continue_reading') || '继续阅读'}
            </Text>
            <Box height={110}>
                <FlashList<Book>
                    horizontal
                    data={books}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={280}
                    contentContainerStyle={{
                        paddingHorizontal: theme.spacing.m,
                        paddingBottom: theme.spacing.s,
                    }}
                />
            </Box>
        </Box>
    );
};

export default ContinueReadingList;
