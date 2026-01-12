import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { ArrowDownRight } from 'lucide-react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

const { width } = Dimensions.get('window');

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyStateProps {}

const EmptyState: React.FC<EmptyStateProps> = () => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    return (
        <Box flex={1} justifyContent="center" alignItems="center" paddingHorizontal="xl">
            {/* Minimal Text Hint */}
            <Text
                variant="body"
                color="textTertiary"
                textAlign="center"
                fontSize={14}
                lineHeight={20}
                style={styles.messageText}
            >
                {t('library.empty.message')}
            </Text>

            {/* Subtle Directional Cue */}
            <Box
                marginTop="l"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                opacity={0.4}
            >
                <Text variant="caption" color="textSecondary" marginRight="xs">
                    {t('library.empty.tap_plus_to_add')}
                </Text>
                <ArrowDownRight size={14} color={theme.colors.textSecondary} />
            </Box>
        </Box>
    );
};

const styles = StyleSheet.create({
    messageText: {
        maxWidth: width * 0.7,
    },
});

export default EmptyState;
