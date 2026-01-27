import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { FolderOpen, Wifi, Search, ChevronRight, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { useTranslation } from 'react-i18next';
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
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.cardPrimary,
                        padding: theme.spacing.l,
                        borderRadius: theme.borderRadii.xl,
                        marginBottom: theme.spacing.m,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 12,
                        elevation: 2,
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: theme.borderRadii.l,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.colors.mainBackground,
                            marginRight: theme.spacing.m,
                        }}
                    >
                        <Icon size={28} color={theme.colors.primary} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 18,
                                marginBottom: theme.spacing.xs,
                                color: theme.colors.textPrimary,
                                fontWeight: '600',
                            }}
                        >
                            {title}
                        </Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
                            {subtitle}
                        </Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.textTertiary} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={{ flex: 1, paddingTop: theme.spacing.m, paddingHorizontal: theme.spacing.l }}>
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

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: theme.spacing.xl, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.6 }}>
                    <HelpCircle size={16} color={theme.colors.textSecondary} />
                    <Text style={{ color: theme.colors.textSecondary, marginLeft: theme.spacing.xs, fontSize: 12 }}>
                        {t('import.supported_formats')}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default ImportMainView;
