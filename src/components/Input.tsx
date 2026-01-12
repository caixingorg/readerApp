import React from 'react';
import { TextInput, TextInputProps, TouchableOpacity } from 'react-native';
import { useTheme, BoxProps } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme/theme';
import Box from './Box';
import Text from './Text';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerProps?: BoxProps<Theme>;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    style,
    containerProps,
    ...props
}) => {
    const theme = useTheme<Theme>();

    return (
        <Box width="100%">
            {label && (
                <Text variant="caption" color="textSecondary" marginBottom="s" fontWeight="bold">
                    {label}
                </Text>
            )}

            <Box
                flexDirection="row"
                alignItems="center"
                borderWidth={1}
                borderColor={error ? 'error' : 'border'}
                borderRadius="m"
                paddingHorizontal="m"
                backgroundColor="inputBackground"
                minHeight={48}
                {...containerProps}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={theme.colors.textSecondary}
                        style={{ marginRight: 8 }}
                    />
                )}

                <TextInput
                    style={[
                        {
                            flex: 1,
                            paddingVertical: theme.spacing.m,
                            fontSize: 16,
                            color: theme.colors.textPrimary,
                        },
                        props.multiline && {
                            minHeight: 80,
                            textAlignVertical: 'top',
                        },
                        style,
                    ]}
                    placeholderTextColor={theme.colors.textTertiary}
                    {...props}
                />

                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress}>
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={theme.colors.textSecondary}
                            style={{ marginLeft: 8 }}
                        />
                    </TouchableOpacity>
                )}
            </Box>

            {error && (
                <Text variant="caption" color="error" marginTop="xs">
                    {error}
                </Text>
            )}
        </Box>
    );
};

export default Input;
