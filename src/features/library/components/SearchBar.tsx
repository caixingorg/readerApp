import React from 'react';
import Input from '../../../components/Input';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    return (
        <Input
            value={value}
            onChangeText={onChangeText}
            placeholder={t('search.placeholder')}
            leftIcon="search"
            rightIcon={value.length > 0 ? "close-circle" : undefined}
            onRightIconPress={onClear}
            className="border-none bg-transparent"
            // Use solid background to prevent fuzzy text/shadow issues.
            // Override border to 0 for a cleaner iOS-style search bar
            style={{
                backgroundColor: theme.colors.cardSecondary,
                borderWidth: 0,
                borderRadius: 12
            }}
            containerClassName="" // Remove shadow for sharpness
        />
    );
};

export default SearchBar;
