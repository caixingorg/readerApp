
import React from 'react';
import { Modal, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Theme } from '@/theme/theme';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface SharePreviewModalProps {
    visible: boolean;
    imageUri: string | null;
    onClose: () => void;
    onShare: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({
    visible,
    imageUri,
    onClose,
    onShare
}) => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();

    if (!imageUri) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={25} style={StyleSheet.absoluteFill}>
                <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    padding="m"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} // Darker full screen overlay
                >
                    {/* Header with Title and Close Button */}
                    <Box
                        width={SCREEN_WIDTH * 0.85} // Match Card Width
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        marginBottom="l"
                        style={{ marginTop: 20 }} // Add some safe spacing
                    >
                        <Text variant="subheader" color="white" fontWeight="bold" style={styles.textShadow}>
                            {t('common.share_preview') || "Preview"}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={20} color="white" />
                        </TouchableOpacity>
                    </Box>

                    {/* Preview Container - Card Style */}
                    <Box
                        style={styles.cardContainer}
                        width={SCREEN_WIDTH * 0.85}
                        alignItems="center"
                        justifyContent="center"
                    >
                        {/* The Image Itself - Wrapper adds Shadow */}
                        <Box
                            style={styles.imageShadow}
                            backgroundColor="cardPrimary"
                            borderRadius="l" // Match Card Radius
                            overflow="hidden"
                        >
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                        </Box>
                    </Box>

                    {/* Actions - Floating Bottom */}
                    <Box
                        position="absolute"
                        bottom={SCREEN_HEIGHT * 0.08} // Relative bottom
                        width="100%"
                        paddingHorizontal="xl"
                        alignItems="center"
                    >
                        <TouchableOpacity
                            onPress={onShare}
                            activeOpacity={0.8}
                            style={{ width: '100%', alignItems: 'center' }}
                        >
                            <Box
                                borderRadius="full"
                                backgroundColor="white" // Contrast button
                                paddingVertical="m"
                                paddingHorizontal="xl"
                                flexDirection="row"
                                justifyContent="center"
                                alignItems="center"
                                width="100%"
                                maxWidth={300}
                                style={styles.actionShadow}
                            >
                                <Ionicons name="share-outline" size={20} color="black" style={{ marginRight: 8 }} />
                                <Text variant="body" fontWeight="bold" color="black">
                                    {t('common.share_now')}
                                </Text>
                            </Box>
                        </TouchableOpacity>
                    </Box>
                </Box>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        // No background
    },
    imageShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 20,
        },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 20,
        backgroundColor: '#1c1917', // Match card bg to avoid white abstract lines
    },
    previewImage: {
        width: SCREEN_WIDTH * 0.85,
        height: (SCREEN_WIDTH * 0.85) * (500 / 375) // Preserve Aspect Ratio
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    textShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    actionShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    }
});

export default SharePreviewModal;
