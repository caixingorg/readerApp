import React from 'react';
import { TouchableOpacity, View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../../theme/theme';
import clsx from 'clsx';

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
    description
}) => {
    const theme = useTheme<Theme>();

    const content = (
        <View className={clsx(
            "flex-row items-center py-4 px-4 bg-white dark:bg-gray-900",
            !isLast && "border-b border-gray-100 dark:border-gray-800"
        )}>
            {icon && (
                <View className={clsx(
                    "w-8 h-8 rounded-lg items-center justify-center mr-3",
                    isDestructive ? "bg-red-50 dark:bg-red-900/20" : "bg-primary-50 dark:bg-primary-900/20"
                )}>
                    <Ionicons
                        name={icon}
                        size={18}
                        color={isDestructive ? theme.colors.error : theme.colors.primary}
                    />
                </View>
            )}

            <View className="flex-1">
                <Text className={clsx(
                    "text-base font-medium",
                    isDestructive ? "text-red-500" : "text-gray-900 dark:text-gray-100"
                )}>
                    {label}
                </Text>
                {description && (
                    <Text className="text-xs text-gray-400 mt-0.5">{description}</Text>
                )}
            </View>

            {type === 'toggle' && (
                <Switch
                    value={value as boolean}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#767577', true: theme.colors.primary }}
                    thumbColor={'#f4f3f4'}
                />
            )}

            {type === 'link' && (
                <View className="flex-row items-center">
                    {value && (
                        <Text className="text-sm text-gray-500 mr-2">{value as string}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </View>
            )}

            {type === 'info' && value && (
                <Text className="text-sm text-gray-500">{value as string}</Text>
            )}
        </View>
    );

    if (type === 'toggle' || type === 'info') {
        return (
            <View className="active:bg-gray-50 dark:active:bg-gray-800">
                {content}
            </View>
        );
    }

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            {content}
        </TouchableOpacity>
    );
};

export default SettingsItem;
