import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import Text from '../../../components/Text';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';

interface SearchHistoryTagProps {
    label: string;
    onPress: () => void;
    isTrending?: boolean;
}

const SearchHistoryTag: React.FC<SearchHistoryTagProps> = ({ label, onPress, isTrending }) => {
    const theme = useTheme<Theme>();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                backgroundColor: theme.colors.cardSecondary, // Corrected color
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999, // Pill shape
                marginRight: 8,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
            }}
        >
            <Text variant="body" fontSize={13} fontWeight="500" color="textSecondary">
                {label}
            </Text>
            {isTrending && (
                <Ionicons
                    name="trending-up"
                    size={14}
                    color={theme.colors.primary}
                    style={{ marginLeft: 6 }}
                />
            )}
        </TouchableOpacity>
    );
};

export default SearchHistoryTag;
