import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { Theme } from '../theme/theme';
import { useTheme } from '@shopify/restyle';

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
    onClose
}) => {
    const theme = useTheme<Theme>();

    const activeActions = actions.filter(a => !a.cancel);
    const cancelAction = actions.find(a => a.cancel);

    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop - purely for closing, transparent to match FilterBottomSheet style/animation behavior or we would need custom anim */}
                <TouchableWithoutFeedback onPress={handleClose}>
                    <View className="absolute inset-0" />
                </TouchableWithoutFeedback>

                {/* Sheet Content */}
                <View
                    className="bg-white dark:bg-gray-900 rounded-t-[32px] p-6 pb-10"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    {/* Handle Bar */}
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </View>

                    {/* Title/Message Header */}
                    {(title || message) && (
                        <View className="mb-6 items-center">
                            {title && <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</Text>}
                            {message && <Text className="text-gray-500 text-sm text-center">{message}</Text>}
                        </View>
                    )}

                    {/* Actions */}
                    <View className="gap-3 mb-6">
                        {activeActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    if (!action.keepOpenOnPress) {
                                        handleClose();
                                    }
                                    // Use slight delay to allow press animation to show before potential state change
                                    requestAnimationFrame(action.onPress);
                                }}
                                className={clsx(
                                    "flex-row items-center justify-center p-4 rounded-xl",
                                    action.destructive
                                        ? "bg-red-50 dark:bg-red-900/20"
                                        : "bg-gray-50 dark:bg-gray-800"
                                )}
                            >
                                {action.icon && (
                                    <Ionicons
                                        name={action.icon}
                                        size={20}
                                        color={action.destructive ? theme.colors.error : theme.colors.text}
                                        style={{ marginRight: 8 }}
                                    />
                                )}
                                <Text className={clsx(
                                    "text-base font-semibold",
                                    action.destructive
                                        ? "text-red-500 dark:text-red-400"
                                        : "text-gray-900 dark:text-gray-100"
                                )}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        onPress={handleClose}
                        className="p-4 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800"
                    >
                        <Text className="text-base font-bold text-gray-600 dark:text-gray-300">
                            {cancelAction?.label || 'Cancel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ActionSheetModal;
