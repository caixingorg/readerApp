import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from './Box';
import Text from './Text';

interface ButtonProps {
    title?: string;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'small' | 'medium' | 'large';
    icon?: keyof typeof Ionicons.glyphMap;
    iconElement?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    iconElement,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
}) => {
    const theme = useTheme<Theme>();

    // Variant Styles Mapping
    const getVariantProps = () => {
        switch (variant) {
            case 'secondary':
                return {
                    backgroundColor: 'cardSecondary',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    textColor: 'textPrimary',
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: 'primary',
                    textColor: 'primary',
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    textColor: 'textSecondary',
                };
            case 'danger':
                return {
                    backgroundColor: 'error',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    textColor: 'white',
                };
            case 'primary':
            default:
                return {
                    backgroundColor: 'primary',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    textColor: 'onPrimary',
                };
        }
    };

    const getSizeProps = () => {
        switch (size) {
            case 'small':
                return { paddingVertical: 's', paddingHorizontal: 'm', fontSize: 14 };
            case 'large':
                return { paddingVertical: 'l', paddingHorizontal: 'xl', fontSize: 18 };
            case 'medium':
            default:
                return { paddingVertical: 'm', paddingHorizontal: 'l', fontSize: 16 };
        }
    };

    const variantProps = getVariantProps();
    const sizeProps = getSizeProps();

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={{
                width: fullWidth ? '100%' : undefined,
                alignSelf: fullWidth ? 'auto' : 'flex-start',
            }}
        >
            <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                borderRadius="l"
                opacity={disabled ? 0.5 : 1}
                backgroundColor={variantProps.backgroundColor as any}
                borderWidth={variantProps.borderWidth}
                borderColor={variantProps.borderColor as any}
                paddingVertical={sizeProps.paddingVertical as any}
                paddingHorizontal={sizeProps.paddingHorizontal as any}
            >
                {loading ? (
                    <ActivityIndicator
                        size="small"
                        color={theme.colors[variantProps.textColor as keyof Theme['colors']]}
                    />
                ) : (
                    <>
                        {iconElement && iconPosition === 'left' && iconElement}
                        {icon && iconPosition === 'left' && (
                            <Ionicons
                                name={icon}
                                size={sizeProps.fontSize + 4}
                                color={
                                    theme.colors[variantProps.textColor as keyof Theme['colors']]
                                }
                                style={{ marginRight: title ? 8 : 0 }}
                            />
                        )}
                        {title && (
                            <Text
                                variant="body"
                                fontWeight="600"
                                fontSize={sizeProps.fontSize}
                                color={variantProps.textColor as any}
                            >
                                {title}
                            </Text>
                        )}
                        {icon && iconPosition === 'right' && (
                            <Ionicons
                                name={icon}
                                size={sizeProps.fontSize + 4}
                                color={
                                    theme.colors[variantProps.textColor as keyof Theme['colors']]
                                }
                                style={{ marginLeft: title ? 8 : 0 }}
                            />
                        )}
                        {iconElement && iconPosition === 'right' && iconElement}
                    </>
                )}
            </Box>
        </TouchableOpacity>
    );
};

export default Button;
