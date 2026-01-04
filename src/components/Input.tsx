import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import clsx from 'clsx';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerClassName,
    className,
    ...props
}) => {
    return (
        <View className={clsx("w-full", containerClassName)}>
            {label && (
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </Text>
            )}

            <View className={clsx(
                "flex-row items-center bg-gray-50 dark:bg-gray-800 border rounded-xl px-3",
                error
                    ? "border-red-500"
                    : "border-gray-200 dark:border-gray-700 focus:border-primary-500"
            )}>
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color="#9CA3AF"
                        style={{ marginRight: 8 }}
                    />
                )}

                <TextInput
                    className={clsx(
                        "flex-1 py-3 text-base text-gray-900 dark:text-white",
                        className
                    )}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />

                {rightIcon && (
                    <Ionicons
                        name={rightIcon}
                        size={20}
                        color="#9CA3AF"
                        onPress={onRightIconPress}
                        style={{ marginLeft: 8 }}
                    />
                )}
            </View>

            {error && (
                <Text className="text-xs text-red-500 mt-1">
                    {error}
                </Text>
            )}
        </View>
    );
};

export default Input;
