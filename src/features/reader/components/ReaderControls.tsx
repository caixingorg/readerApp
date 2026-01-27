import React, { useMemo } from 'react';
import { Platform, TouchableOpacity } from 'react-native';
// import { TouchableOpacity } from 'react-native-gesture-handler'; // Revert to RN Core for reliability
import Toast from 'react-native-toast-message';
// import Animated from 'react-native-reanimated'; // Not strictly used in this visual pass? Kept if needed.
import { useTheme } from '@shopify/restyle';
import { Theme } from '@/theme/theme';
import { EdgeInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import {
    ChevronLeft,
    Headphones,
    Bookmark,
    NotebookPen,
    Palette,
    Type,
    AlignLeft,
    MessageSquareQuote,
} from 'lucide-react-native';
import Box from '@/components/Box';
import Text from '@/components/Text';

interface ReaderControlsProps {
    visible: boolean;
    onClose: () => void;
    onTTS: () => void;
    onAddBookmark: () => void;
    onTOC: () => void;
    onNotes: () => void;
    onAddNote: () => void;
    onViewBookmarks: () => void;
    onTheme: () => void;
    onFont: () => void;
    insets: EdgeInsets;
    title?: string;
    fileType?: string;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
    visible,
    onClose,
    onTTS,
    onAddBookmark,
    onTOC,
    onNotes,
    onAddNote,
    onTheme,
    onFont,
    insets,
    title,
    fileType,
}) => {
    const { t } = useTranslation();
    const theme = useTheme<Theme>();

    // Robust checks against "Pro Max" dark palette (Slate + Stone)
    const isDark = useMemo(
        () =>
            [
                '#020617',
                '#0F172A',
                '#121212', // Old Slate/Dark
                '#0C0A09',
                '#1C1917',
                '#292524', // New Stone Dark
            ].includes(theme.colors.mainBackground),
        [theme.colors.mainBackground],
    );

    const ICON_SIZE = 22;

    if (!visible) return null;

    // Common Button Style
    const IconButton = ({
        onPress,
        icon: Icon,
        label,
        disabled = false,
    }: {
        onPress: () => void;
        icon: any;
        label?: string;
        disabled?: boolean;
    }) => (
        <TouchableOpacity
            onPress={disabled ? undefined : onPress}
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                opacity: disabled ? 0.3 : 1,
            }}
            activeOpacity={disabled ? 1 : 0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Icon size={ICON_SIZE} color={theme.colors.textPrimary} strokeWidth={2} />
            {label && (
                <Text
                    variant="caption"
                    marginTop="xs"
                    style={{ color: theme.colors.textSecondary, fontSize: 10 }}
                >
                    {label}
                </Text>
            )}
        </TouchableOpacity>
    );

    const headerStyle = {
        paddingTop: insets.top,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: isDark ? theme.colors.mainBackground : theme.colors.cardPrimary,
        opacity: 0.9,
    };

    const footerStyle = {
        paddingTop: 16,
        paddingHorizontal: 32,
        paddingBottom: insets.bottom + 8,
        borderTopWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: isDark ? theme.colors.mainBackground : theme.colors.cardPrimary,
        opacity: 0.9,
    };

    return (
        <Box
            position="absolute"
            top={0}
            bottom={0}
            left={0}
            right={0}
            zIndex={100}
            pointerEvents="box-none"
        >
            {/* Header Overlay */}
            <Box position="absolute" top={0} left={0} right={0}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 95}
                    tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                    style={headerStyle}
                >
                    <Box
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        marginTop="s"
                    >
                        {/* Left: Back */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={{
                                width: 40,
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 20,
                                backgroundColor: isDark
                                    ? theme.colors.glassStrong
                                    : theme.colors.glass,
                            }}
                        >
                            <ChevronLeft size={24} color={theme.colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Center: Title (Truncated) */}
                        <Text
                            variant="body"
                            fontWeight="600"
                            numberOfLines={1}
                            flex={1}
                            textAlign="center"
                            marginHorizontal="m"
                            color="textPrimary"
                        >
                            {title || t('reader.title')}
                        </Text>

                        {/* Right: Quick Actions */}
                        <Box flexDirection="row" alignItems="center" gap="m">
                            <TouchableOpacity onPress={onAddNote}>
                                <NotebookPen size={ICON_SIZE} color={theme.colors.textPrimary} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onAddBookmark}>
                                <Bookmark size={ICON_SIZE} color={theme.colors.textPrimary} />
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </BlurView>
            </Box>

            {/* Footer Overlay */}
            <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                zIndex={101}
                pointerEvents="box-none"
            >
                <Box pointerEvents="auto">
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 40 : 95}
                        tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                        style={footerStyle}
                    >
                        <Box
                            flexDirection="row"
                            justifyContent="space-between"
                            alignItems="flex-end"
                        >
                            <IconButton
                                onPress={onTOC}
                                icon={AlignLeft}
                                label={t('reader.controls.contents')}
                            />
                            <IconButton
                                onPress={onNotes}
                                icon={MessageSquareQuote}
                                label={t('reader.controls.notes')}
                            />
                            <IconButton
                                onPress={() => {
                                    if (fileType === 'pdf') {
                                        Toast.show({ type: 'info', text1: 'PDF 不支持样式调整' });
                                        return;
                                    }
                                    onTheme();
                                }}
                                icon={Palette}
                                label={t('reader.controls.theme')}
                                disabled={fileType === 'pdf'}
                            />
                            <IconButton
                                onPress={() => {
                                    if (fileType === 'pdf') {
                                        Toast.show({ type: 'info', text1: 'PDF 不支持字体调整' });
                                        return;
                                    }
                                    onFont();
                                }}
                                icon={Type}
                                label={t('reader.controls.style')}
                                disabled={fileType === 'pdf'}
                            />
                            <IconButton
                                onPress={() => {
                                    console.log(
                                        '[ReaderControls] TTS Button Pressed, fileType:',
                                        fileType,
                                    );
                                    if (fileType === 'pdf') {
                                        Toast.show({ type: 'info', text1: 'PDF 暂不支持语音朗读' });
                                        return;
                                    }
                                    onTTS();
                                }}
                                icon={Headphones}
                                label={t('reader.controls.listen')}
                                disabled={fileType === 'pdf'}
                            />
                        </Box>
                    </BlurView>
                </Box>
            </Box>
        </Box>
    );
};

export default ReaderControls;
