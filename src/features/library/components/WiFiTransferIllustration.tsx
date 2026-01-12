import React from 'react';
import { Smartphone, Laptop, Wifi } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Box from '@/components/Box';
import { Theme } from '@/theme/theme';

const WiFiTransferIllustration: React.FC = () => {
    const theme = useTheme<Theme>();

    return (
        <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Box flexDirection="row" alignItems="center" justifyContent="center" marginBottom="xl">
                <Box alignItems="center">
                    <Box
                        width={64}
                        height={64}
                        borderRadius="full"
                        backgroundColor="cardSecondary"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Smartphone
                            size={32}
                            color={theme.colors.textSecondary}
                            strokeWidth={1.5}
                        />
                    </Box>
                </Box>

                <Box paddingHorizontal="m" alignItems="center">
                    <Box flexDirection="row" gap="s" marginBottom="xs">
                        {[0.8, 0.6, 0.4].map((op, i) => (
                            <Box
                                key={i}
                                width={6}
                                height={6}
                                borderRadius="full"
                                backgroundColor="primary"
                                opacity={op}
                            />
                        ))}
                    </Box>
                    <Box
                        backgroundColor="primary"
                        padding="s"
                        borderRadius="full"
                        marginVertical="xs"
                    >
                        <Wifi size={20} color="white" />
                    </Box>
                    <Box flexDirection="row" gap="s" marginTop="xs">
                        {[0.4, 0.6, 0.8].map((op, i) => (
                            <Box
                                key={i}
                                width={6}
                                height={6}
                                borderRadius="full"
                                backgroundColor="primary"
                                opacity={op}
                            />
                        ))}
                    </Box>
                </Box>

                <Box alignItems="center">
                    <Box
                        width={64}
                        height={64}
                        borderRadius="full"
                        backgroundColor="cardSecondary"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Laptop size={32} color={theme.colors.textSecondary} strokeWidth={1.5} />
                    </Box>
                </Box>
            </Box>
        </Animated.View>
    );
};

export default WiFiTransferIllustration;
