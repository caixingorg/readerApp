import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { Theme } from '../../../theme/theme';

interface EmptyStateProps {
    onImport: () => void;
    onWiFi: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImport, onWiFi }) => {
    const theme = useTheme<Theme>();

    return (
        <Box flex={1} justifyContent="center" alignItems="center" padding="xl">
            <Ionicons name="library-outline" size={80} color={theme.colors.textTertiary} />
            <Text variant="title" marginTop="l" marginBottom="s">
                No Books Yet
            </Text>
            <Text
                variant="body"
                color="textSecondary"
                textAlign="center"
                marginBottom="xl"
            >
                Start building your library by importing your first book
            </Text>
            <Button title="Import Book" onPress={onImport} variant="primary" />
            <Box height={16} />
            <Button title="WiFi Transfer" onPress={onWiFi} variant="outline" />
        </Box>
    );
};

export default EmptyState;
