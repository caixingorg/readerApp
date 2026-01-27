import React from 'react';
import { Modal, TouchableOpacity, StyleSheet, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { useDevStore } from '../stores/devStore';
import { X, Server, Database, Activity, Smartphone } from 'lucide-react-native';
import Text from '@/components/Text';
import Box from '@/components/Box';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EnvSwitcher from './EnvSwitcher';
import NetworkView from './NetworkView';
import DataWiper from './DataWiper';
import DeviceInfo from './DeviceInfo';

// Wrapper for Dev Cards
const DevCard = ({ title, icon: Icon, children }: any) => {
    const theme = useTheme<Theme>();
    return (
        <Box
            backgroundColor="cardPrimary"
            borderRadius="l"
            padding="m"
            marginBottom="m"
            borderWidth={1}
            borderColor="border"
        >
            <Box flexDirection="row" alignItems="center" marginBottom="m">
                <Box
                    width={32}
                    height={32}
                    borderRadius="s"
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor="cardSecondary"
                    marginRight="s"
                >
                    <Icon size={18} color={theme.colors.primary} />
                </Box>
                <Text variant="body" fontWeight="bold">
                    {title}
                </Text>
            </Box>
            {children}
        </Box>
    );
};

const DevMenuModal: React.FC = () => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const { isMenuVisible, toggleMenu } = useDevStore();

    if (!isMenuVisible) return null;

    return (
        <Modal
            visible={isMenuVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => toggleMenu(false)}
            statusBarTranslucent
        >
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                {/* Backdrop Click to Close */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={() => toggleMenu(false)}
                />

                <Box
                    backgroundColor="mainBackground"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    style={{
                        height: '85%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 10,
                    }}
                >
                    {/* Header */}
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        padding="m"
                        borderBottomWidth={1}
                        borderBottomColor="border"
                    >
                        <Box flexDirection="row" alignItems="center">
                            <Box
                                width={8}
                                height={8}
                                borderRadius="full"
                                backgroundColor="warning"
                                marginRight="s"
                            />
                            <Text variant="subheader" fontSize={18}>DevKit</Text>
                        </Box>
                        <TouchableOpacity onPress={() => toggleMenu(false)}>
                            <Box padding="s" backgroundColor="cardSecondary" borderRadius="full">
                                <X size={20} color={theme.colors.textPrimary} />
                            </Box>
                        </TouchableOpacity>
                    </Box>

                    {/* Content */}
                    <ScrollView contentContainerStyle={{ padding: theme.spacing.m, paddingBottom: insets.bottom + 20 }}>
                        <DevCard title="Environment" icon={Server}>
                            <EnvSwitcher />
                        </DevCard>

                        <DevCard title="Network" icon={Activity}>
                            <NetworkView />
                        </DevCard>

                        <DevCard title="Data" icon={Database}>
                            <DataWiper />
                        </DevCard>

                        <DevCard title="Device" icon={Smartphone}>
                            <DeviceInfo />
                        </DevCard>
                    </ScrollView>
                </Box>
            </View>
        </Modal>
    );
};

export default DevMenuModal;
