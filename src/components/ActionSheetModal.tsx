import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
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
    const translateY = useSharedValue(500);
    const opacity = useSharedValue(0);

    const activeActions = actions.filter(a => !a.cancel);
    const cancelAction = actions.find(a => a.cancel);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, { damping: 15 });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withSpring(500, { damping: 15 });
        }
    }, [visible]);

    const handleClose = () => {
        onClose();
    };

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const animatedSheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!visible && opacity.value === 0) return null;

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={handleClose}>
                    <Animated.View
                        className="absolute inset-0 bg-black/40"
                        style={animatedBackdropStyle}
                    />
                </TouchableWithoutFeedback>

                {/* Sheet Content */}
                <Animated.View
                    style={animatedSheetStyle}
                    className="m-3 mb-8"
                >
                    <View className="bg-white/90 dark:bg-gray-800/90 rounded-xl overflow-hidden mb-3">
                        {/* Title/Message Header */}
                        {(title || message) && (
                            <View className="p-4 items-center border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
                                {title && <Text className="text-gray-500 font-semibold text-xs mb-1">{title}</Text>}
                                {message && <Text className="text-gray-400 text-xs text-center">{message}</Text>}
                            </View>
                        )}

                        {/* Actions */}
                        {activeActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    handleClose();
                                    requestAnimationFrame(action.onPress);
                                }}
                                className={clsx(
                                    "p-4 items-center justify-center bg-white/80 dark:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-700",
                                    index < activeActions.length - 1 && "border-b border-gray-200 dark:border-gray-700"
                                )}
                            >
                                <Text className={clsx(
                                    "text-base font-medium",
                                    action.destructive ? "text-red-500" : "text-blue-500",
                                )}>
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity
                        onPress={handleClose}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 items-center justify-center active:bg-gray-100 dark:active:bg-gray-700"
                    >
                        <Text className="text-blue-500 font-bold text-base">
                            {cancelAction?.label || '取消'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default ActionSheetModal;
