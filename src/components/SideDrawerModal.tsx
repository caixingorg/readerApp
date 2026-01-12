import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Box from './Box';
import { Theme } from '../theme/theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8; // 80% screen width

interface SideDrawerModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    position?: 'left' | 'right';
}

const SideDrawerModal: React.FC<SideDrawerModalProps> = ({
    visible,
    onClose,
    children,
    position = 'left',
}) => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(
        new Animated.Value(position === 'left' ? -DRAWER_WIDTH : width),
    ).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [modalVisible, setModalVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: position === 'left' ? 0 : width - DRAWER_WIDTH,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: position === 'left' ? -DRAWER_WIDTH : width,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => setModalVisible(false));
        }
    }, [visible, position, fadeAnim, slideAnim]);

    if (!modalVisible) return null;

    return (
        <Modal
            transparent
            visible={modalVisible}
            onRequestClose={onClose}
            animationType="none" // We handle animation manually
        >
            <Box flex={1} flexDirection="row">
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        activeOpacity={1}
                    />
                </Animated.View>

                {/* Drawer Content */}
                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            transform: [{ translateX: slideAnim }],
                            backgroundColor: theme.colors.background,
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            width: DRAWER_WIDTH,
                            [position]: 0, // Align layout if needed, though translation handles position
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </Box>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default SideDrawerModal;
