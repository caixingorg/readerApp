import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

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
                        style={styles.optionWrapper}
                        activeOpacity={0.8}
                    >
                        <Box
                            alignItems="center"
                            justifyContent="center"
                            paddingVertical="m"
                            borderRadius="m"
                            style={[
                                styles.optionContainer,
                                isSelected && {
                                    backgroundColor: theme.colors.cardPrimary,
                                    borderColor: theme.colors.primary,
                                    borderWidth: 1.5,
                                    elevation: 1
                                }
                            ]}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={22}
                                color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                            />
                            <Text
                                variant="caption"
                                marginTop="xs"
                                style={[
                                    styles.optionLabel,
                                    {
                                        color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                                        fontWeight: isSelected ? '700' : '400'
                                    }
                                ]}
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

const styles = StyleSheet.create({
    optionWrapper: {
        flex: 1
    },
    optionContainer: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    optionLabel: {
        fontSize: 12
    }
});

export default ThemeSelector;
