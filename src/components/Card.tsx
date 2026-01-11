import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Box from './Box';
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';

interface CardProps extends React.ComponentProps<typeof Box> {
    variant?: 'elevated' | 'outlined' | 'flat' | 'glass';
    children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, variant = 'elevated', style, ...props }) => {
    const theme = useTheme<Theme>();

    const getVariantProps = () => {
        switch (variant) {
            case 'outlined':
                return {
                    backgroundColor: 'transparent' as const,
                    borderWidth: 1,
                    borderColor: 'border' as const,
                };
            case 'flat':
                return {
                    backgroundColor: 'cardSecondary' as const,
                    borderWidth: 0,
                    borderColor: 'transparent' as const,
                };
            case 'glass':
                return {
                    backgroundColor: 'glass' as const,
                    borderWidth: 1,
                    borderColor: 'glassStrong' as const,
                    overflow: 'hidden' as const,
                };
            case 'elevated':
            default:
                return {
                    backgroundColor: 'cardPrimary' as const,
                    shadowColor: 'shadow' as const,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                };
        }
    };

    const variantProps = getVariantProps();

    if (variant === 'glass') {
        return (
            <Box
                borderRadius="l"
                overflow="hidden"
                borderColor="glassStrong"
                borderWidth={1}
                style={style}
                {...props}
            >
                <BlurView intensity={20} style={{ flex: 1 }}>
                    <Box padding="m">{children}</Box>
                </BlurView>
            </Box>
        );
    }

    return (
        <Box borderRadius="l" padding="m" style={style} {...variantProps} {...props}>
            {children}
        </Box>
    );
};

export default Card;
