import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Input from '@/components/Input';
import { Theme } from '@/theme/theme';

interface NotebookHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
}

const NotebookHeader: React.FC<NotebookHeaderProps> = ({ searchQuery, onSearchChange }) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    return (
        <Box paddingHorizontal="m" paddingTop="l" paddingBottom="m" marginBottom="s">
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="m"
            >
                <Text variant="header" fontSize={32} lineHeight={40} fontWeight="700">
                    {t('notebook.title')}
                </Text>
            </Box>

            <Box>
                <Input
                    value={searchQuery}
                    onChangeText={onSearchChange}
                    placeholder={t('notebook.search_placeholder')}
                    leftIcon="search-outline"
                    containerProps={{ borderWidth: 0 }}
                    style={{
                        borderRadius: 12,
                        paddingVertical: 12,
                        height: 44,
                        backgroundColor: theme.colors.cardSecondary,
                    }}
                />
            </Box>
        </Box>
    );
};

export default NotebookHeader;
