import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

interface LibraryEditorialHeaderProps {
    streak: number;
    onSearchPress: () => void;
}

const LibraryEditorialHeader: React.FC<LibraryEditorialHeaderProps> = ({
    streak,
    onSearchPress,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    return (
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
                <Text
                    variant="header"
                    fontSize={32}
                    fontWeight="800"
                    letterSpacing={-0.5}
                    color="textPrimary"
                >
                    {t('library.title')}
                </Text>
                <Text
                    variant="caption"
                    color="textSecondary"
                    textTransform="uppercase"
                    letterSpacing={1}
                >
                    {new Date().toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>
            </Box>

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

                <TouchableOpacity onPress={onSearchPress}>
                    <Ionicons name="search" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
            </Box>
        </Box>
    );
};

export default LibraryEditorialHeader;
