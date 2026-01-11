import React from 'react';
import { useTranslation } from 'react-i18next';
import Input from '@/components/Input';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
    onSubmit?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear, onSubmit }) => {
    const { t } = useTranslation();

    return (
        <Input
            value={value}
            onChangeText={onChangeText}
            placeholder={t('search.placeholder')}
            leftIcon="search"
            rightIcon={value.length > 0 ? 'close-circle' : undefined}
            onRightIconPress={onClear}
            onSubmitEditing={onSubmit}
            containerProps={{
                borderWidth: 0,
                backgroundColor: 'cardSecondary',
                borderRadius: 'l',
            }}
        />
    );
};

export default SearchBar;
