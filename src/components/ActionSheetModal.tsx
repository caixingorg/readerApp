import React from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme/theme';
import { useTheme } from '@shopify/restyle';
import Box from './Box';
import Text from './Text';

export interface ActionItem {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
    cancel?: boolean;
    keepOpenOnPress?: boolean;
}

interface ActionSheetModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    actions: ActionItem[];
    onClose: () => void;
}

const ActionSheetModal: React.FC<ActionSheetModalProps> = ({
    visible,
    title,
    message,
    actions,
    onClose,
}) => {
    const theme = useTheme<Theme>();

    const activeActions = actions.filter((a) => !a.cancel);
    const cancelAction = actions.find((a) => a.cancel);

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={handleClose}>
            <Box flex={1} justifyContent="flex-end">
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={handleClose}>
                    <Box style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                {/* Sheet Content */}
                <Box
                    backgroundColor="modalBackground"
                    borderTopLeftRadius="xl"
                    borderTopRightRadius="xl"
                    padding="l"
                    paddingBottom="xl"
                    shadowColor="shadow"
                    shadowOffset={{ width: 0, height: -2 }}
                    shadowOpacity={0.1}
                    shadowRadius={4}
                    elevation={5}
                >
                    {/* Handle Bar */}
                    <Box alignItems="center" marginBottom="l">
                        <Box width={48} height={6} backgroundColor="border" borderRadius="full" />
                    </Box>

                    {/* Title/Message Header */}
                    {(title || message) && (
                        <Box marginBottom="l" alignItems="center">
                            {title && (
                                <Text
                                    variant="title"
                                    fontWeight="bold"
                                    color="textPrimary"
                                    marginBottom="s"
                                >
                                    {title}
                                </Text>
                            )}
                            {message && (
                                <Text variant="body" color="textSecondary" textAlign="center">
                                    {message}
                                </Text>
                            )}
                        </Box>
                    )}

                    {/* Actions */}
                    <Box gap="s" marginBottom="l">
                        {activeActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    if (!action.keepOpenOnPress) {
                                        handleClose();
                                    }
                                    requestAnimationFrame(action.onPress);
                                }}
                            >
                                <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    padding="m"
                                    borderRadius="l"
                                    backgroundColor={action.destructive ? 'error' : 'cardSecondary'}
                                    opacity={action.destructive ? 0.1 : 1}
                                    position="absolute"
                                    width="100%"
                                    height="100%"
                                />
                                {/* Overlay content on top of background to avoid opacity affecting text if using opacity prop on container. 
                                    Wait, opacity on container affects children.
                                    If destructive, I want bg to be light red, not text.
                                    Theme doesn't have "lightError".
                                    I will use "cardSecondary" for normal, and distinct style for destructive?
                                    Actually I can just render the Box normally and use a specific background color if I had one.
                                    Since I don't have "errorLight", I will use "cardSecondary" for all, and "error" text for destructive?
                                    Or I can use `backgroundColor="error"` and opacity on a separate bg layer.
                                */}
                                <Box
                                    flexDirection="row"
                                    alignItems="center"
                                    justifyContent="center"
                                    padding="m"
                                    borderRadius="l"
                                    backgroundColor={
                                        action.destructive ? undefined : 'cardSecondary'
                                    }
                                    style={
                                        action.destructive
                                            ? { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
                                            : undefined
                                    } // Hardcoded light red if theme missing
                                >
                                    {action.icon && (
                                        <Ionicons
                                            name={action.icon}
                                            size={20}
                                            color={
                                                action.destructive
                                                    ? theme.colors.error
                                                    : theme.colors.textPrimary
                                            }
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Text
                                        variant="body"
                                        fontWeight="600"
                                        color={action.destructive ? 'error' : 'textPrimary'}
                                    >
                                        {action.label}
                                    </Text>
                                </Box>
                            </TouchableOpacity>
                        ))}
                    </Box>

                    {/* Cancel Button */}
                    <TouchableOpacity onPress={handleClose}>
                        <Box
                            padding="m"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="l"
                            backgroundColor="cardSecondary"
                        >
                            <Text variant="body" fontWeight="bold" color="textSecondary">
                                {cancelAction?.label || 'Cancel'}
                            </Text>
                        </Box>
                    </TouchableOpacity>
                </Box>
            </Box>
        </Modal>
    );
};

export default ActionSheetModal;
