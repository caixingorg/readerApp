import React, { useState } from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import NetworkLogger from 'react-native-network-logger';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { Activity, X } from 'lucide-react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';

const NetworkView: React.FC = () => {
    const theme = useTheme<Theme>();
    const [visible, setVisible] = useState(false);

    return (
        <>
            <TouchableOpacity onPress={() => setVisible(true)}>
                <Box
                    flexDirection="row"
                    alignItems="center"
                    backgroundColor="cardSecondary"
                    padding="m"
                    borderRadius="m"
                >
                    <Activity size={24} color={theme.colors.primary} style={{ marginRight: 16 }} />
                    <Box flex={1}>
                        <Text variant="body" fontWeight="600" marginBottom="xs">Open Network Logger</Text>
                        <Text variant="caption" color="textSecondary">Tap to inspect API requests</Text>
                    </Box>
                </Box>
            </TouchableOpacity>

            <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
                <Box flex={1} backgroundColor="mainBackground">
                    <Box
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        padding="m"
                        borderBottomWidth={1}
                        borderBottomColor="border"
                        style={{ paddingTop: 56 }} // Safe Area rough estimate for modal
                    >
                        <Text variant="subheader">Network Logs</Text>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <X size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>
                    </Box>
                    <NetworkLogger theme={theme.colors.mainBackground === '#0C0A09' ? 'dark' : 'light'} />
                </Box>
            </Modal>
        </>
    );
};

export default NetworkView;
