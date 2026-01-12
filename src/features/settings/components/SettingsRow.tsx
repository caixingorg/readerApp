import React, { useMemo } from 'react';
import { TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import Box from '@/components/Box';
import Text from '@/components/Text';
import { Theme } from '@/theme/theme';

export type SettingsRowType = 'link' | 'toggle' | 'value' | 'none';

interface SettingsRowProps {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBackgroundColor?: string;
    type?: SettingsRowType;
    value?: string | boolean;
    onPress?: () => void;
    onValueChange?: (val: boolean) => void;
    isDestructive?: boolean;
    showDivider?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
    label,
    icon,
    iconColor, // Let defaults handle this if undefined
    iconBackgroundColor,
    type = 'link',
    value,
    onPress,
    onValueChange,
    isDestructive = false,
    showDivider = true,
}) => {
    const theme = useTheme<Theme>();

    // Default to Minimalist / E-Ink Style
    const finalIconColor =
        iconColor || (isDestructive ? theme.colors.error : theme.colors.textPrimary);
    const finalIconBg = iconBackgroundColor || theme.colors.cardSecondary;

    const iconBoxStyle = useMemo(
        () => ({
            backgroundColor: finalIconBg,
        }),
        [finalIconBg],
    );

    const content = (
        <Box
            flexDirection="row"
            alignItems="center"
            paddingVertical="m"
            paddingHorizontal="m"
            backgroundColor="cardPrimary"
        >
            {/* Icon Box */}
            {icon && (
                <Box
                    width={36} // Slightly larger touch/visual target
                    height={36}
                    borderRadius="l" // Softer curve
                    style={iconBoxStyle}
                    alignItems="center"
                    justifyContent="center"
                    marginRight="m"
                >
                    <Ionicons name={icon} size={20} color={finalIconColor} />
                </Box>
            )}

            {/* Label */}
            <Box flex={1}>
                <Text
                    variant="body"
                    fontWeight="500"
                    color={isDestructive ? 'error' : 'textPrimary'}
                >
                    {label}
                </Text>
            </Box>

            {/* Right Side Actions */}
            <Box flexDirection="row" alignItems="center">
                {/* Value Text */}
                {type === 'value' && typeof value === 'string' && (
                    <Text variant="body" color="textSecondary" marginRight="s">
                        {value}
                    </Text>
                )}
                {type === 'link' && typeof value === 'string' && (
                    <Text variant="body" color="textSecondary" marginRight="s">
                        {value}
                    </Text>
                )}

                {/* Controls */}
                {type === 'toggle' && (
                    <Switch
                        value={value as boolean}
                        onValueChange={(val) => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onValueChange?.(val);
                        }}
                        trackColor={{
                            false: theme.colors.borderStrong,
                            true: theme.colors.primary,
                        }}
                        thumbColor={styles.switchThumb.color}
                        // IOS style
                        ios_backgroundColor={theme.colors.borderStrong}
                    />
                )}

                {/* Chevron */}
                {(type === 'link' || type === 'value') && (
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                )}
            </Box>
        </Box>
    );

    // If there's a divider, wrap content
    const rowWithDivider = (
        <>
            {content}
            {showDivider && (
                <Box paddingLeft={icon ? 'xl' : 'm'} backgroundColor="cardPrimary">
                    <Box height={1} backgroundColor="border" marginLeft="m" />
                </Box>
            )}
        </>
    );

    if (type === 'toggle') {
        return <Box>{rowWithDivider}</Box>;
    }

    return (
        <TouchableOpacity
            onPress={() => {
                if (onPress) {
                    Haptics.selectionAsync();
                    onPress();
                }
            }}
            activeOpacity={0.7}
        >
            {rowWithDivider}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    switchThumb: {
        color: 'white',
    },
});

export default SettingsRow;
