import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import Input from '@/components/Input';
import { Theme } from '@/theme/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    onSubmit?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear, onSubmit }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const inputStyle = useMemo(() => [
        styles.input,
        { backgroundColor: theme.colors.cardSecondary }
    ], [theme.colors.cardSecondary]);

    return (
        <Input
            value={value}
            onChangeText={onChangeText}
            placeholder={t('search.placeholder')}
            leftIcon="search"
            rightIcon={value.length > 0 ? "close-circle" : undefined}
            onRightIconPress={onClear}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            className="border-none bg-transparent"
            style={inputStyle}
            containerClassName=""
        />
    );
};

const styles = StyleSheet.create({
    input: {
        borderWidth: 0,
        borderRadius: 12
    }
});

export default SearchBar;
