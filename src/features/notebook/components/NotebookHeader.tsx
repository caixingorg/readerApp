import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Input from '@/components/Input';
import Header from '@/components/Header';
import { Theme } from '@/theme/theme';

interface NotebookHeaderProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
}

const NotebookHeader: React.FC<NotebookHeaderProps> = ({ searchQuery, onSearchChange }) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    return (
        <Header title={t('notebook.title')}>
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
        </Header>
    );
};

export default NotebookHeader;
