import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Platform, Dimensions, PixelRatio } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import * as Device from 'expo-device';
import * as Clipboard from 'expo-clipboard';
import { Copy, Check, Smartphone, Cpu, Ruler } from 'lucide-react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const InfoRow = ({ label, value, copyValue = null }: { label: string; value: string; copyValue?: string | null }) => {
    const theme = useTheme<Theme>();

    const handleCopy = async () => {
        await Clipboard.setStringAsync(copyValue || value);
        Toast.show({
            type: 'success',
            text1: 'Copied!',
            text2: `${label} copied to clipboard`,
            position: 'bottom',
            visibilityTime: 1500,
        });
    };

    return (
        <TouchableOpacity
            onPress={handleCopy}
            disabled={!copyValue && value === '-'}
            activeOpacity={0.7}
        >
            <Box flexDirection="row" justifyContent="space-between" paddingVertical="s" borderBottomWidth={1} borderBottomColor="border">
                <Text variant="caption" color="textSecondary">{label}</Text>
                <Box flexDirection="row" alignItems="center">
                    <Text variant="caption" fontWeight="600" style={{ maxWidth: 200 }} numberOfLines={1}>
                        {value}
                    </Text>
                    <Copy size={12} color={theme.colors.textTertiary} style={{ marginLeft: 6 }} />
                </Box>
            </Box>
        </TouchableOpacity>
    );
};

const DeviceInfo: React.FC = () => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const { width, height, scale } = Dimensions.get('window');

    return (
        <Box backgroundColor="cardSecondary" borderRadius="m" padding="m">
            {/* Hardware */}
            <Box flexDirection="row" alignItems="center" marginBottom="s">
                <Smartphone size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text variant="small" fontWeight="bold" color="primary">HARDWARE</Text>
            </Box>
            <InfoRow label="Model" value={Device.modelName || 'Unknown'} />
            <InfoRow label="OS" value={`${Platform.OS} ${Platform.Version}`} />
            <InfoRow label="Architecture" value={Device.osBuildId || '-'} />

            {/* Display */}
            <Box flexDirection="row" alignItems="center" marginTop="m" marginBottom="s">
                <Ruler size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text variant="small" fontWeight="bold" color="primary">DISPLAY</Text>
            </Box>
            <InfoRow label="Resolution" value={`${Math.round(width)} x ${Math.round(height)}`} />
            <InfoRow label="Density" value={`${scale}x (Pixel Ratio)`} />
            <InfoRow
                label="Safe Area"
                value={`T:${Math.round(insets.top)} B:${Math.round(insets.bottom)} L:${Math.round(insets.left)} R:${Math.round(insets.right)}`}
            />

            {/* IDs */}
            <Box flexDirection="row" alignItems="center" marginTop="m" marginBottom="s">
                <Cpu size={14} color={theme.colors.primary} style={{ marginRight: 6 }} />
                <Text variant="small" fontWeight="bold" color="primary">IDENTIFIERS</Text>
            </Box>
            <InfoRow label="Device name" value={Device.deviceName || '-'} />
            <InfoRow label="App Version" value="1.0.0 (Build 1)" />
        </Box>
    );
};

export default DeviceInfo;
