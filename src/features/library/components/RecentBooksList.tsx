import React from 'react';
import { FlatList, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { Book } from '../../../services/database';
import { getSafePath } from '../../../utils/PathUtils';

interface RecentBooksListProps {
    books: Book[];
    onBookPress: (bookId: string) => void;
    onMorePress?: () => void;
}

import { useTranslation } from 'react-i18next';

// ... (imports)

const RecentBooksList: React.FC<RecentBooksListProps> = ({ books, onBookPress, onMorePress }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const renderItem = ({ item }: { item: Book }) => {
        // ... (renderItem content skipped for brevity unless changed)
        const safeCover = getSafePath(item.cover);

        return (
            <TouchableOpacity onPress={() => onBookPress(item.id)} activeOpacity={0.7}>
                <Box marginRight="m" width={100}>
                    <Box
                        height={140}
                        width={100}
                        borderRadius="m"
                        backgroundColor="cardSecondary"
                        overflow="hidden"
                        marginBottom="s"
                        style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                    >
                        {safeCover ? (
                            <Image
                                source={{ uri: safeCover }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Box flex={1} alignItems="center" justifyContent="center">
                                <Ionicons name="book" size={32} color={theme.colors.textTertiary} />
                            </Box>
                        )}
                        {item.progress > 0 && (
                            <Box position="absolute" bottom={0} left={0} right={0} height={3} backgroundColor="border">
                                <Box height="100%" width={`${item.progress}%`} backgroundColor="primary" />
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
                {/* <TouchableOpacity onPress={onMorePress}>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity> */}
            </Box>
            <FlatList
                horizontal
                data={books}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </Box>
    );
};

export default RecentBooksList;
