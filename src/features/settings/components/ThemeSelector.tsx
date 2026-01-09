import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../theme/theme';
import Box from '../../../components/Box';
import Text from '../../../components/Text';

interface ThemeSelectorProps {
    currentTheme: 'light' | 'dark' | 'system'; // Or expand to 'sepia' if supported
    onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
    const theme = useTheme<Theme>();

    const options = [
        { label: 'Light', value: 'light', icon: 'sunny' },
        { label: 'Dark', value: 'dark', icon: 'moon' },
        { label: 'Eye Care', value: 'system', icon: 'eye' },
    ];

    return (
        <Box
            flexDirection="row"
            backgroundColor="cardSecondary" // Light gray container
            borderRadius="l"
            padding="s"
            gap="s"
        >
            {options.map((option) => {
                const isSelected = currentTheme === option.value;
                return (
                    <TouchableOpacity
                        key={option.value}
                        onPress={() => onThemeChange(option.value as any)}
                        style={{ flex: 1 }}
                        activeOpacity={0.8}
                    >
                        <Box
                            alignItems="center"
                            justifyContent="center"
                            paddingVertical="m"
                            borderRadius="m"
                            style={{
                                backgroundColor: isSelected ? theme.colors.cardPrimary : 'transparent',
                                borderWidth: isSelected ? 1.5 : 0, // Thicker border
                                borderColor: isSelected ? theme.colors.primary : 'transparent',
                                shadowColor: isSelected ? '#000' : 'transparent',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: isSelected ? 0.05 : 0,
                                shadowRadius: 2,
                                elevation: isSelected ? 1 : 0,
                            }}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={22}
                                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                            />
                            <Text
                                variant="caption"
                                marginTop="xs"
                                style={{
                                    color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                                    fontWeight: isSelected ? '700' : '400'
                                }}
                            >
                                {option.label}
                            </Text>
                        </Box>
                    </TouchableOpacity>
                );
            })}
        </Box>
    );
};

export default ThemeSelector;
