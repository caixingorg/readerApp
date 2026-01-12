import React, { useEffect } from 'react';
import {} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Box from './Box';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonProps extends Omit<React.ComponentProps<typeof Box>, 'width' | 'height'> {
    width?: number | string;
    height?: number | string;
    variant?: 'rect' | 'circle' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    borderRadius,
    variant = 'rect',
    style,
    ...props
}) => {
    const theme = useTheme<Theme>();
    const finalWidth = typeof width === 'number' ? width : 300;
    const translateX = useSharedValue(-finalWidth);

    useEffect(() => {
        translateX.value = withRepeat(withTiming(finalWidth, { duration: 1500 }), -1, false);
    }, [finalWidth, translateX]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Resolve variants
    const getVariantProps = () => {
        switch (variant) {
            case 'circle':
                return {
                    borderRadius: 'full' as const,
                    height: (height || 40) as any,
                    width: (width || 40) as any,
                };
            case 'text':
                return {
                    borderRadius: 's' as const,
                    height: 16 as any,
                    marginVertical: 'xs' as const,
                    width: (width || '100%') as any,
                };
            case 'rect':
            default:
                return { borderRadius: 'm' as const, width: width as any, height: height as any };
        }
    };

    const variantProps = getVariantProps();

    // Override specific props if passed directly
    if (borderRadius) {
        (variantProps as any).borderRadius = undefined;
        // We will just let props override if spread after, but Restyle props handling needs strictness.
        // Actually, props spread last will override.
    }

    return (
        <Box
            backgroundColor="cardSecondary" // Was gray-200/gray-700
            overflow="hidden"
            position="relative"
            {...variantProps}
            {...props}
            style={style}
            borderRadius={borderRadius ? undefined : variantProps.borderRadius} // Handle manual override logic if needed, or rely on spread?
            // Better to spread variantProps, then props. But borderRadius prop on component might be number.
            // Restyle borderRadius prop expects theme key or number.
        >
            {/* If explicit borderRadius passed, apply it via style or prop override. 
                 Since Box accepts spread props, passing borderRadius={10} works. */}
            <AnimatedGradient
                colors={[
                    'transparent',
                    theme.colors.cardPrimary === '#FFFFFF'
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(255,255,255,0.1)',
                    'transparent',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[{ width: '100%', height: '100%', position: 'absolute' }, animatedStyle]}
            />
        </Box>
    );
};

export default Skeleton;
