import React, { useState } from 'react';
import { TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import { Theme } from '../../../theme/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onClear }) => {
    const theme = useTheme<Theme>();

    return (
        <Box
            flexDirection="row"
            alignItems="center"
            backgroundColor="foreground"
            borderRadius="m"
            paddingHorizontal="m"
            paddingVertical="s"
            borderWidth={1}
            borderColor="border"
        >
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder="搜索书名或作者..."
                placeholderTextColor={theme.colors.textTertiary}
                style={{
                    flex: 1,
                    marginLeft: theme.spacing.s,
                    fontSize: 16,
                    color: theme.colors.text,
                    paddingVertical: theme.spacing.xs,
                }}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={onClear}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                </TouchableOpacity>
            )}
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        </Box>
    );
};

export default SearchBar;
