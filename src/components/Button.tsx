import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Box from './Box';
import Text from './Text';
import { Theme } from '../theme/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
}

const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    disabled,
    ...props
}) => {
    const theme = useTheme<Theme>();

    const paddingMap = {
        small: { paddingVertical: 's', paddingHorizontal: 'm' },
        medium: { paddingVertical: 'm', paddingHorizontal: 'l' },
        large: { paddingVertical: 'l', paddingHorizontal: 'xl' },
    };

    const variantStyles = {
        primary: {
            backgroundColor: disabled ? 'textTertiary' : 'primary',
            borderColor: 'transparent',
        },
        secondary: {
            backgroundColor: disabled ? 'borderLight' : 'foreground',
            borderColor: 'transparent',
        },
        outline: {
            backgroundColor: 'transparent',
            borderColor: disabled ? 'borderLight' : 'primary',
            borderWidth: 1,
        },
    };

    const textColor = variant === 'primary' ? 'white' : disabled ? 'textTertiary' : 'primary';

    return (
        <TouchableOpacity disabled={disabled} {...props}>
            <Box
                {...paddingMap[size]}
                borderRadius="m"
                alignItems="center"
                justifyContent="center"
                {...variantStyles[variant]}
            >
                <Text variant="body" fontWeight="600" color={textColor as any}>
                    {title}
                </Text>
            </Box>
        </TouchableOpacity>
    );
};

export default Button;
