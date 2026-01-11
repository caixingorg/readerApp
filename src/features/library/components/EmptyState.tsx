import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@shopify/restyle';
import { ArrowDownRight } from 'lucide-react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

const { width } = Dimensions.get('window');

interface EmptyStateProps {
    onImport: () => void;
    onWiFi: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImport, onWiFi }) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    return (
        <Box flex={1} justifyContent="center" alignItems="center" paddingHorizontal="l">
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.container}>
                <Text
                    fontSize={18}
                    fontWeight="500"
                    color="textPrimary"
                    textAlign="center"
                    marginBottom="s"
                >
                    {t('library.empty.title')}
                </Text>

                <Text
                    variant="body"
                    color="textSecondary"
                    textAlign="center"
                    marginBottom="m"
                    lineHeight={18}
                    style={styles.messageText}
                >
                    {t('library.empty.message')}
                </Text>

                {/* Directional Cue */}
                <Box
                    marginTop="xl"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="center"
                    style={styles.cueContainer}
                >
                    <Text variant="caption" color="textSecondary" marginRight="s">
                        {t('library.empty.tap_plus_to_add')}
                    </Text>
                    <ArrowDownRight size={20} color={theme.colors.textSecondary} />
                </Box>
            </Animated.View>
        </Box>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
    },
    messageText: {
        maxWidth: width * 0.7,
    },
    cueContainer: {
        opacity: 0.6,
    },
});

export default EmptyState;
