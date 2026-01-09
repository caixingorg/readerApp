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
            style={{
                backgroundColor: theme.colors.card,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                marginRight: 10,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}
        >
            <Text variant="body" fontSize={14} color="text">
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
