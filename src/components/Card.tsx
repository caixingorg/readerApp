import React from 'react';
import { View, ViewProps } from 'react-native';
import clsx from 'clsx';
import { BlurView } from 'expo-blur';

interface CardProps extends ViewProps {
    variant?: 'elevated' | 'outlined' | 'flat' | 'glass';
    className?: string;
}

const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    className,
    style,
    ...props
}) => {
    const baseStyles = "rounded-xl p-4";

    const variantStyles = {
        elevated: "bg-white shadow-sm dark:bg-gray-800",
        outlined: "bg-transparent border border-gray-200 dark:border-gray-700",
        flat: "bg-gray-50 dark:bg-gray-900",
        glass: "bg-white/70 dark:bg-gray-900/70 overflow-hidden", // requires BlurView wrapper effectively or backdrop-filter
    };

    if (variant === 'glass') {
        return (
            <View
                className={clsx("rounded-xl overflow-hidden border border-white/20", className)}
                style={style}
            >
                <BlurView intensity={20} className="p-4">
                    {children}
                </BlurView>
            </View>
        );
    }

    return (
        <View
            className={clsx(baseStyles, variantStyles[variant], className)}
            style={style}
            {...props}
        >
            {children}
        </View>
    );
};

export default Card;
