import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Wifi, WifiOff } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { useWiFiTransferLogic } from '@/features/library/hooks/useWiFiTransferLogic';
import WiFiAddressCard from '@/features/library/components/WiFiAddressCard';
import WiFiTransferIllustration from '@/features/library/components/WiFiTransferIllustration';

import ScreenLayout from '@/components/ScreenLayout';

interface WiFiTransferScreenProps {
    onGoBack?: () => void;
}

const WiFiTransferScreen: React.FC<WiFiTransferScreenProps> = ({ onGoBack }) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const { url, serverStatus, logs, startServer, stopServer, copyToClipboard } =
        useWiFiTransferLogic();

    return (
        <ScreenLayout
            title={t('import.wifi.title')}
            showBack={!!onGoBack}
            onGoBack={onGoBack}
        >
            <Box flex={1} backgroundColor="background" justifyContent="space-between" paddingBottom="l" paddingHorizontal="l">
                <Box flex={1} alignItems="center" justifyContent="center">
                    <WiFiTransferIllustration />

                    <Animated.View entering={FadeInUp.delay(200)}>
                        <Box maxWidth={280}>
                            <Text variant="body" textAlign="center" color="textSecondary">
                                {t('import.wifi.instruction_prefix')}
                                <Text fontWeight="bold" color="textPrimary">
                                    {t('import.wifi.instruction_bold')}
                                </Text>
                                {t('import.wifi.instruction_suffix')}
                            </Text>
                        </Box>
                    </Animated.View>

                    <WiFiAddressCard url={url} serverStatus={serverStatus} onCopy={copyToClipboard} />

                    {/* Optional Logs View */}
                    {logs.length > 0 && (
                        <Box
                            marginTop="xl"
                            padding="m"
                            backgroundColor="cardSecondary"
                            borderRadius="m"
                            width={300}
                            opacity={0.6}
                        >
                            {logs.map((log, i) => (
                                <Text key={i} variant="caption" color="textTertiary" numberOfLines={1}>
                                    • {log}
                                </Text>
                            ))}
                        </Box>
                    )}
                </Box>

                <Box>
                    {serverStatus === 'running' ? (
                        <TouchableOpacity onPress={stopServer} style={{ width: '100%' }}>
                            <Box
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="center"
                                paddingVertical="m"
                                borderRadius="l"
                                borderWidth={1}
                                borderColor="border"
                                backgroundColor="cardPrimary"
                                width="100%"
                                gap="m"
                            >
                                <WifiOff size={20} color={theme.colors.textSecondary} />
                                <Text variant="body" fontWeight="600" color="textSecondary">
                                    {t('import.wifi.stop')}
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    ) : (
                        <Button
                            variant="primary"
                            title={t('import.wifi.start')}
                            onPress={startServer}
                            fullWidth
                            size="large"
                            iconElement={
                                <Box marginRight="s">
                                    <Wifi size={20} color="white" />
                                </Box>
                            }
                        />
                    )}
                </Box>
            </Box>
        </ScreenLayout>
    );
};

export default WiFiTransferScreen;
