import React from 'react';
import Input from '../../../components/Input';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear }) => {
    return (
        <Input
            value={value}
            onChangeText={onChangeText}
            placeholder="搜索书名或作者..."
            leftIcon="search"
            rightIcon={value.length > 0 ? "close-circle" : undefined}
            onRightIconPress={onClear}
            className="border-none bg-transparent"
            containerClassName="shadow-sm"
        />
    );
};

export default SearchBar;
