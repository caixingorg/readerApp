import React from 'react';
import { Modal, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
// Removed unused useTheme
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Removed unused Theme
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
    onShare,
}) => {
    const { t } = useTranslation();

    if (!imageUri) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <BlurView intensity={25} style={StyleSheet.absoluteFill}>
                <Box
                    flex={1}
                    justifyContent="center"
                    alignItems="center"
                    padding="m"
                    backgroundColor="overlay"
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
                        <Text variant="subheader" color="white" fontWeight="bold">
                            {t('common.share_preview') || 'Preview'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Box
                                padding="s"
                                backgroundColor="glass"
                                borderRadius="full"
                                borderWidth={1}
                                borderColor="glassStrong"
                            >
                                <Ionicons name="close" size={20} color="white" />
                            </Box>
                        </TouchableOpacity>
                    </Box>

                    {/* Preview Container - Card Style */}
                    <Box width={SCREEN_WIDTH * 0.85} alignItems="center" justifyContent="center">
                        {/* The Image Itself - Wrapper adds Shadow */}
                        <Box
                            backgroundColor="cardPrimary"
                            borderRadius="l" // Match Card Radius
                            overflow="hidden"
                            shadowColor="black"
                            shadowOffset={{ width: 0, height: 20 }}
                            shadowOpacity={0.5}
                            shadowRadius={24}
                            elevation={20}
                        >
                            <Image
                                source={{ uri: imageUri }}
                                style={{
                                    width: SCREEN_WIDTH * 0.85,
                                    height: SCREEN_WIDTH * 0.85 * (500 / 375), // Preserve Aspect Ratio
                                }}
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
                                shadowColor="black"
                                shadowOffset={{ width: 0, height: 4 }}
                                shadowOpacity={0.3}
                                shadowRadius={8}
                                elevation={8}
                            >
                                <Box marginRight="s">
                                    <Ionicons name="share-outline" size={20} color="black" />
                                </Box>
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

export default SharePreviewModal;
