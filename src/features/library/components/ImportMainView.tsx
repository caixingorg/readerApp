import React from 'react';
import { TouchableOpacity } from 'react-native';
import { FolderOpen, Wifi, Search, ChevronRight, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { useTranslation } from 'react-i18next';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

interface ImportMainViewProps {
    onPickDocument: () => void;
    onWiFiPress: () => void;
    onScanPress: () => void;
}

const ImportMainView: React.FC<ImportMainViewProps> = ({
    onPickDocument,
    onWiFiPress,
    onScanPress,
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    const ActionCard = ({ title, subtitle, icon: Icon, delay, onPress }: any) => (
        <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
            <TouchableOpacity onPress={onPress}>
                <Box
                    flexDirection="row"
                    alignItems="center"
                    backgroundColor="cardPrimary"
                    padding="l"
                    borderRadius="xl"
                    marginBottom="m"
                    borderWidth={1}
                    borderColor="border"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 12,
                        elevation: 2,
                    }}
                >
                    <Box
                        width={56}
                        height={56}
                        borderRadius="l"
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor="mainBackground"
                        marginRight="m"
                    >
                        <Icon size={28} color={theme.colors.primary} strokeWidth={1.5} />
                    </Box>
                    <Box flex={1}>
                        <Text
                            variant="subheader"
                            fontSize={18}
                            marginBottom="xs"
                            color="textPrimary"
                        >
                            {title}
                        </Text>
                        <Text variant="body" color="textSecondary" fontSize={14}>
                            {subtitle}
                        </Text>
                    </Box>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                </Box>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <Box flex={1} paddingTop="m">
            <ActionCard
                title={t('import.methods.local')}
                subtitle={t('import.methods.local_sub')}
                icon={FolderOpen}
                onPress={onPickDocument}
                delay={100}
            />
            <ActionCard
                title={t('import.methods.wifi')}
                subtitle={t('import.methods.wifi_sub')}
                icon={Wifi}
                onPress={onWiFiPress}
                delay={200}
            />
            <ActionCard
                title={t('import.methods.scan')}
                subtitle={t('import.methods.scan_sub')}
                icon={Search}
                onPress={onScanPress}
                delay={300}
            />

            <Box flex={1} justifyContent="flex-end" paddingBottom="xl" alignItems="center">
                <Box flexDirection="row" alignItems="center" opacity={0.6}>
                    <HelpCircle size={16} color={theme.colors.textSecondary} />
                    <Text variant="caption" color="textSecondary" marginLeft="xs">
                        {t('import.supported_formats')}
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

export default ImportMainView;
