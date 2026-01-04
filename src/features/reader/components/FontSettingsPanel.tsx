import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';

interface FontSettingsPanelProps {
    visible: boolean;
    fontSize: number;
    setFontSize: (size: number) => void;
    lineHeight: number;
    setLineHeight: (h: number) => void;
    margin: number;
    setMargin: (m: number) => void;
    fontFamily: string;
    setFontFamily: (f: string) => void;
    bottomOffset?: number;
}

const FontSettingsPanel: React.FC<FontSettingsPanelProps> = ({
    visible,
    fontSize, setFontSize,
    lineHeight, setLineHeight,
    margin, setMargin,
    fontFamily, setFontFamily,
    bottomOffset = 0,
}) => {
    const theme = useTheme<Theme>();

    if (!visible) return null;

    const renderOption = (label: string, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                borderRadius: 8,
                marginRight: 8,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            }}
        >
            <Text variant="small" style={{ color: isSelected ? 'white' : theme.colors.text }}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <Box
            position="absolute"
            bottom={bottomOffset}
            left={0}
            right={0}
            backgroundColor="background"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            paddingHorizontal="m"
            paddingTop="l"
            paddingBottom="l"
            borderTopWidth={1}
            borderTopColor="border"
            shadowOpacity={0.1}
            shadowRadius={4}
            elevation={4}
        >
            {/* 1. Font Size */}
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
                <Text variant="body" color="textSecondary">字号</Text>
                <Box flexDirection="row" alignItems="center">
                    <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 1))}>
                        <Ionicons name="remove-circle-outline" size={32} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <Box width={50} alignItems="center">
                        <Text variant="title">{fontSize}</Text>
                    </Box>
                    <TouchableOpacity onPress={() => setFontSize(Math.min(32, fontSize + 1))}>
                        <Ionicons name="add-circle-outline" size={32} color={theme.colors.primary} />
                    </TouchableOpacity>
                </Box>
            </Box>

            {/* 2. Line Height */}
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
                <Text variant="body" color="textSecondary">行间距</Text>
                <Box flexDirection="row">
                    {renderOption('紧凑', lineHeight === 1.2, () => setLineHeight(1.2))}
                    {renderOption('适中', lineHeight === 1.5, () => setLineHeight(1.5))}
                    {renderOption('宽松', lineHeight === 1.8, () => setLineHeight(1.8))}
                </Box>
            </Box>

            {/* 3. Margins */}
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" marginBottom="m">
                <Text variant="body" color="textSecondary">边距</Text>
                <Box flexDirection="row">
                    {renderOption('窄', margin === 1, () => setMargin(1))}
                    {renderOption('标准', margin === 2, () => setMargin(2))}
                    {renderOption('宽', margin === 3, () => setMargin(3))}
                </Box>
            </Box>

            {/* 4. Font Family */}
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Text variant="body" color="textSecondary">字体</Text>
                <Box flexDirection="row">
                    {renderOption('系统', fontFamily === 'system', () => setFontFamily('system'))}
                    {renderOption('宋体', fontFamily === 'serif', () => setFontFamily('serif'))}
                    {renderOption('黑体', fontFamily === 'sans-serif', () => setFontFamily('sans-serif'))}
                </Box>
            </Box>
        </Box>
    );
};

export default FontSettingsPanel;
