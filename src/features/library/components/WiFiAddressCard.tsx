import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Copy } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

interface WiFiAddressCardProps {
    url: string;
    serverStatus: 'stopped' | 'running';
    onCopy: () => void;
}

const WiFiAddressCard: React.FC<WiFiAddressCardProps> = ({ url, serverStatus, onCopy }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const pulseOpacity = useSharedValue(0.4);
    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
            -1,
            true,
        );
    }, [pulseOpacity]);

    const animatedPulseStyle = useAnimatedStyle(() => ({
        opacity: serverStatus === 'running' ? pulseOpacity.value : 0.4,
    }));

    if (serverStatus !== 'running') return null;

    return (
        <Animated.View entering={FadeIn.delay(300)}>
            <TouchableOpacity onPress={onCopy} activeOpacity={0.9}>
                <Box
                    backgroundColor="cardPrimary"
                    borderRadius="xl"
                    paddingVertical="l"
                    paddingHorizontal="l"
                    alignItems="center"
                    width={300}
                    marginTop="xl"
                    borderWidth={1}
                    borderColor="border"
                    style={styles.cardShadow}
                >
                    <Box flexDirection="row" alignItems="center" marginBottom="s">
                        <Animated.View style={animatedPulseStyle}>
                            <Box
                                width={8}
                                height={8}
                                borderRadius="full"
                                backgroundColor="success"
                                marginRight="s"
                            />
                        </Animated.View>
                        <Text
                            variant="caption"
                            color="textTertiary"
                            fontWeight="600"
                            letterSpacing={1}
                        >
                            {t('import.wifi.server_running')}
                        </Text>
                    </Box>

                    <Text
                        variant="header"
                        fontSize={24}
                        fontWeight="bold"
                        color="primary"
                        marginBottom="m"
                        textAlign="center"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {url}
                    </Text>

                    <Box
                        flexDirection="row"
                        alignItems="center"
                        backgroundColor="cardSecondary"
                        paddingHorizontal="m"
                        paddingVertical="xs"
                        borderRadius="full"
                        gap="xs"
                    >
                        <Copy size={14} color={theme.colors.textSecondary} />
                        <Text variant="caption" color="textSecondary" fontWeight="600">
                            {t('import.wifi.tap_copy')}
                        </Text>
                    </Box>
                </Box>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
});

export default WiFiAddressCard;
