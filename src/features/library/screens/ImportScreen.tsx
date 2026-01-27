import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useTranslation } from 'react-i18next';

import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import ImportScanner from '../components/ImportScanner';
import ImportMainView from '../components/ImportMainView';
import { useImportLogic } from '../hooks/useImportLogic';
import WiFiTransferScreen from './WiFiTransferScreen';

const ImportScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const logic = useImportLogic();

    if (logic.currentView === 'wifi') {
        return <WiFiTransferScreen onGoBack={logic.handleBackPress} />;
    }

    if (logic.currentView === 'scan') {
        return (
            <ImportScanner
                files={logic.scannedFiles}
                isScanning={logic.isScanning}
                isImporting={logic.isImporting}
                onRefresh={logic.scanFiles}
                onImport={logic.importFile}
                onGoBack={logic.handleBackPress}
            />
        );
    }

    // Main Import View
    return (
        <ScreenLayout
            title={t('import.header_title')}
            subtitle={t('import.subtitle')}
            showBack={true}
            onGoBack={logic.handleBackPress}
        >
            <View style={{ flex: 1 }}>
                <ImportMainView
                    onPickDocument={() => logic.pickDocument()}
                    onWiFiPress={() => logic.setCurrentView('wifi')}
                    onScanPress={() => logic.setCurrentView('scan')}
                />
            </View>

            {/* Loading Overlay */}
            {logic.isImporting && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', // overlay
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <View
                        style={{
                            backgroundColor: theme.colors.modalBackground,
                            padding: theme.spacing.xl,
                            borderRadius: theme.borderRadii.l,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOpacity: 0.2,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text
                            style={{
                                marginTop: theme.spacing.m,
                                fontWeight: '600',
                                color: theme.colors.textPrimary,
                                fontSize: 18,
                            }}
                        >
                            {t('import.scan.importing')}
                        </Text>
                        <Text
                            style={{
                                color: theme.colors.textSecondary,
                                marginTop: theme.spacing.s,
                                fontSize: 12,
                            }}
                        >
                            {t('import.scan.wait_msg')}
                        </Text>
                    </View>
                </View>
            )}
        </ScreenLayout>
    );
};

export default ImportScreen;
