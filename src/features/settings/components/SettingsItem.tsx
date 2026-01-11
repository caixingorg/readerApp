import React from 'react';
import { TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

export interface SettingsItemProps {
    label: string;
    icon?: keyof typeof Ionicons.glyphMap;
    value?: string | boolean;
    onPress?: () => void;
    onValueChange?: (value: boolean) => void;
    type?: 'link' | 'toggle' | 'info' | 'action';
    isDestructive?: boolean;
    isLast?: boolean;
    description?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
    label,
    icon,
    value,
    onPress,
    onValueChange,
    type = 'link',
    isDestructive = false,
    isLast = false,
    description,
}) => {
    const theme = useTheme<Theme>();

    const content = (
        <Box
            flexDirection="row"
            alignItems="center"
            paddingVertical="m"
            paddingHorizontal="m"
            backgroundColor="cardPrimary"
            borderBottomWidth={!isLast ? 1 : 0}
            borderBottomColor="border"
        >
            {icon && (
                <Box
                    width={32}
                    height={32}
                    borderRadius="s"
                    alignItems="center"
                    justifyContent="center"
                    marginRight="s"
                    backgroundColor="cardSecondary"
                >
                    <Ionicons
                        name={icon}
                        size={18}
                        color={isDestructive ? theme.colors.error : theme.colors.primary}
                    />
                </Box>
            )}

            <Box flex={1}>
                <Text
                    variant="body"
                    fontWeight="500"
                    color={isDestructive ? 'error' : 'textPrimary'}
                >
                    {label}
                </Text>
                {description && (
                    <Text variant="caption" color="textTertiary" marginTop="xs">
                        {description}
                    </Text>
                )}
            </Box>

            {type === 'toggle' && (
                <Switch
                    value={value as boolean}
                    onValueChange={onValueChange}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor={styles.switchThumb.color}
                />
            )}

            {type === 'link' && (
                <Box flexDirection="row" alignItems="center">
                    {value && (
                        <Text variant="body" color="textSecondary" marginRight="s">
                            {value as string}
                        </Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </Box>
            )}

            {type === 'info' && value && (
                <Text variant="body" color="textSecondary">
                    {value as string}
                </Text>
            )}
        </Box>
    );

    if (type === 'toggle' || type === 'info') {
        return <Box>{content}</Box>;
    }

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            {content}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    switchThumb: {
        color: '#f4f3f4',
    },
});

export default SettingsItem;
