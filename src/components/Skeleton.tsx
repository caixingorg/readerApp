import React, { useEffect } from 'react';
import { View, ViewProps, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence
} from 'react-native-reanimated';
import clsx from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);
const { width } = Dimensions.get('window');

interface SkeletonProps extends ViewProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    className?: string;
    variant?: 'rect' | 'circle' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius,
    className,
    variant = 'rect',
    style,
    ...props
}) => {
    const finalWidth = typeof width === 'number' ? width : 300;
    const translateX = useSharedValue(-finalWidth);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(finalWidth, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const baseClasses = "bg-gray-200 dark:bg-gray-700 overflow-hidden relative";

    const variantClasses = {
        rect: "rounded-md",
        circle: "rounded-full",
        text: "rounded-sm h-4 my-1",
    };

    const computedStyle: any = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'circle' ? 40 : undefined),
        borderRadius: borderRadius,
    };

    return (
        <View
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={[computedStyle, style]}
            {...props}
        >
            <AnimatedGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[{ width: '100%', height: '100%', position: 'absolute' }, animatedStyle]}
            />
        </View>
    );
};

export default Skeleton;
