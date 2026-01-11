import React, { useMemo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Text from '@/components/Text';

interface SearchHistoryTagProps {
    label: string;
    onPress: () => void;
    isTrending?: boolean;
}

const SearchHistoryTag: React.FC<SearchHistoryTagProps> = ({ label, onPress, isTrending }) => {
    const theme = useTheme<Theme>();

    const containerStyle = useMemo(() => [
        styles.container,
        {
            backgroundColor: theme.colors.cardSecondary,
            borderColor: theme.colors.border,
        }
    ], [theme.colors.cardSecondary, theme.colors.border]);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={containerStyle}
        >
            <Text variant="body" fontSize={13} fontWeight="500" color="textSecondary">
                {label}
            </Text>
            {isTrending && (
                <Ionicons
                    name="trending-up"
                    size={14}
                    color={theme.colors.primary}
                    style={styles.icon}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999, // Pill shape
        marginRight: 8,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    icon: {
        marginLeft: 6
    }
});

export default SearchHistoryTag;
