import React from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text as RNText } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FileText, BookOpen, HardDrive } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import { ScannedFile } from '@/features/library/utils/FileScanService';

interface ImportScannerProps {
    files: ScannedFile[];
    isScanning: boolean;
    isImporting: boolean;
    onRefresh: () => void;
    onImport: (path: string, name: string) => void;
    onGoBack?: () => void;
}

const ImportScanner: React.FC<ImportScannerProps> = ({
    files,
    isScanning,
    isImporting,
    onRefresh,
    onImport,
    onGoBack,
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const RefreshButton = (
        <TouchableOpacity onPress={onRefresh} disabled={isScanning}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: theme.spacing.s,
                    paddingVertical: theme.spacing.xs,
                }}
            >
                {isScanning && (
                    <View style={{ marginRight: theme.spacing.s }}>
                        <ActivityIndicator
                            size="small"
                            color={theme.colors.primary}
                        />
                    </View>
                )}
                <RNText style={{
                    fontSize: 12, // Corresponds to caption variant
                    fontWeight: '600',
                    color: theme.colors.primary
                }}>
                    {t('import.scan.refresh')}
                </RNText>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenLayout
            title={t('import.scan.title')}
            showBack={!!onGoBack}
            onGoBack={onGoBack}
            headerRight={RefreshButton}
        >
            <Box flex={1} paddingHorizontal="l">
                {files.length === 0 && !isScanning ? (
                    <Box flex={1} justifyContent="center" alignItems="center" opacity={0.6}>
                        <HardDrive size={48} color={theme.colors.textTertiary} strokeWidth={1} />
                        <Text variant="body" color="textSecondary" marginTop="m">
                            {t('import.scan.no_files')}
                        </Text>
                        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 20 }}>
                            <Text color="primary" fontWeight="600">
                                {t('import.scan.refresh')}
                            </Text>
                        </TouchableOpacity>
                    </Box>
                ) : (
                    <>
                        <Box marginBottom="m" marginTop="s">
                            <Text variant="body" fontWeight="600" color="textSecondary">
                                {t('import.scan.available_files')}
                            </Text>
                        </Box>

                        <FlashList
                            data={files}
                            keyExtractor={(item: ScannedFile) => item.path}
                            estimatedItemSize={70}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item, index }: { item: ScannedFile; index: number }) => (
                                <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
                                    <Box
                                        flexDirection="row"
                                        alignItems="center"
                                        backgroundColor="cardPrimary"
                                        padding="m"
                                        marginBottom="s"
                                        borderRadius="l"
                                        borderBottomWidth={1}
                                        borderBottomColor="border"
                                    >
                                        <Box
                                            width={42}
                                            height={42}
                                            borderRadius="m"
                                            alignItems="center"
                                            justifyContent="center"
                                            backgroundColor="cardSecondary"
                                        >
                                            {item.name.endsWith('.epub') ? (
                                                <BookOpen size={22} color={theme.colors.primary} />
                                            ) : (
                                                <FileText size={22} color={theme.colors.textSecondary} />
                                            )}
                                        </Box>
                                        <Box flex={1} marginLeft="m">
                                            <Text
                                                variant="body"
                                                fontWeight="600"
                                                numberOfLines={1}
                                                color="textPrimary"
                                            >
                                                {item.name}
                                            </Text>
                                            <Text variant="caption" color="textSecondary">
                                                {(item.size / 1024 / 1024).toFixed(2)} MB
                                            </Text>
                                        </Box>
                                        <TouchableOpacity
                                            onPress={() => onImport(item.path, item.name)}
                                            disabled={isImporting}
                                        >
                                            <Box
                                                backgroundColor="primary"
                                                paddingHorizontal="m"
                                                paddingVertical="s"
                                                borderRadius="full"
                                            >
                                                <Text variant="caption" fontWeight="bold" color="onPrimary">
                                                    {t('import.scan.import_btn')}
                                                </Text>
                                            </Box>
                                        </TouchableOpacity>
                                    </Box>
                                </Animated.View>
                            )}
                        />
                    </>
                )}
            </Box>
        </ScreenLayout>
    );
};

export default ImportScanner;
