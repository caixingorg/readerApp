import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import WiFiTransferScreen from '@/features/library/screens/WiFiTransferScreen';
import ImportScanner from '../components/ImportScanner';
import ImportMainView from '../components/ImportMainView';
import { useImportLogic } from '../hooks/useImportLogic';

const ImportScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const logic = useImportLogic();

    const getHeaderTitle = () => {
        switch (logic.currentView) {
            case 'wifi':
                return t('import.wifi.title');
            case 'scan':
                return t('import.scan.title');
            default:
                return t('import.header_title');
        }
    };

    return (
        <ScreenLayout>
            {/* Header */}
            <Box paddingHorizontal="l" paddingTop="m" paddingBottom="m">
                <Box flexDirection="row" alignItems="center">
                    <TouchableOpacity onPress={logic.handleBackPress} activeOpacity={0.7}>
                        <Box marginRight="m" paddingVertical="s">
                            <ChevronLeft
                                size={28}
                                color={theme.colors.textPrimary}
                                strokeWidth={2.5}
                            />
                        </Box>
                    </TouchableOpacity>

                    <Box flex={1}>
                        <Animated.View entering={FadeInUp.duration(400)} key={logic.currentView}>
                            <Text
                                variant="header"
                                fontSize={30}
                                fontWeight="900"
                                color="textPrimary"
                            >
                                {getHeaderTitle()}
                            </Text>
                        </Animated.View>
                    </Box>
                </Box>

                {logic.currentView === 'main' && (
                    <Animated.View entering={FadeInUp.delay(100)}>
                        <Box marginLeft="none" marginTop="xs" marginBottom="s">
                            <Text variant="body" color="textSecondary">
                                {t('import.subtitle')}
                            </Text>
                        </Box>
                    </Animated.View>
                )}
            </Box>

            <Box flex={1} paddingHorizontal="l">
                {logic.currentView === 'main' && (
                    <ImportMainView
                        onPickDocument={() => logic.pickDocument()}
                        onWiFiPress={() => logic.setCurrentView('wifi')}
                        onScanPress={() => logic.setCurrentView('scan')}
                    />
                )}

                {logic.currentView === 'wifi' && (
                    <Box flex={1}>
                        <WiFiTransferScreen />
                    </Box>
                )}

                {logic.currentView === 'scan' && (
                    <ImportScanner
                        files={logic.scannedFiles}
                        isScanning={logic.isScanning}
                        isImporting={logic.isImporting}
                        onRefresh={logic.scanFiles}
                        onImport={logic.importFile}
                    />
                )}
            </Box>

            {/* Loading Overlay */}
            {logic.isImporting && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="overlay"
                    justifyContent="center"
                    alignItems="center"
                >
                    <Box
                        backgroundColor="modalBackground"
                        padding="xl"
                        borderRadius="l"
                        alignItems="center"
                        style={{
                            shadowColor: '#000',
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text
                            variant="subheader"
                            marginTop="m"
                            fontWeight="600"
                            color="textPrimary"
                        >
                            {t('import.scan.importing')}
                        </Text>
                        <Text variant="caption" color="textSecondary" marginTop="s">
                            {t('import.scan.wait_msg')}
                        </Text>
                    </Box>
                </Box>
            )}
        </ScreenLayout>
    );
};

export default ImportScreen;
