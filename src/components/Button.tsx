import React from 'react';
import { Pressable, ActivityIndicator, View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Enable NativeWind for Ionicons if needed, or just wrap
cssInterop(Ionicons, {
    className: {
        target: "style",
    },
});

interface ButtonProps {
    title?: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    className?: string; // Allow custom overrides
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className,
    fullWidth = false,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!disabled && !loading) {
            scale.value = withSpring(0.95);
        }
    };

    const handlePressOut = () => {
        if (!disabled && !loading) {
            scale.value = withSpring(1);
        }
    };

    const baseStyles = "flex-row items-center justify-center rounded-lg shadow-sm";

    const variantStyles = {
        primary: "bg-primary-500 active:bg-primary-600",
        secondary: "bg-gray-100 active:bg-gray-200",
        outline: "bg-transparent border border-primary-500 active:bg-blue-50",
        ghost: "bg-transparent active:bg-gray-100 shadow-none",
        danger: "bg-red-500 active:bg-red-600",
    };

    const textStyles = {
        primary: "text-white font-semibold",
        secondary: "text-gray-900 font-medium",
        outline: "text-primary-500 font-medium",
        ghost: "text-gray-600 font-medium",
        danger: "text-white font-semibold",
    };

    const sizeStyles = {
        small: "px-3 py-1.5",
        medium: "px-4 py-3",
        large: "px-6 py-4",
    };

    const textSizeStyles = {
        small: "text-sm",
        medium: "text-base",
        large: "text-lg",
    };

    const iconSizes = {
        small: 16,
        medium: 20,
        large: 24,
    };

    const isDisabled = disabled || loading;

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isDisabled}
            style={animatedStyle}
            className={clsx(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                fullWidth ? 'w-full' : 'self-start',
                isDisabled && 'opacity-50',
                className
            )}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'outline' || variant === 'ghost' ? '#007AFF' : 'white'}
                />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={iconSizes[size]}
                            color={variant === 'outline' ? '#007AFF' : variant === 'ghost' ? '#4B5563' : 'white'}
                            style={{ marginRight: title ? 8 : 0 }}
                        />
                    )}

                    {title && (
                        <Text className={clsx(textStyles[variant], textSizeStyles[size])}>
                            {title}
                        </Text>
                    )}

                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={iconSizes[size]}
                            color={variant === 'outline' ? '#007AFF' : variant === 'ghost' ? '#4B5563' : 'white'}
                            style={{ marginLeft: title ? 8 : 0 }}
                        />
                    )}
                </>
            )}
        </AnimatedPressable>
    );
};

export default Button;
