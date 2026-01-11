import React, { useMemo } from 'react';
import { TouchableOpacity, Platform } from 'react-native';
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
    ArrowLeftRight,
    ArrowUpDown,
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
    onViewBookmarks: () => void;
    onTheme: () => void;
    onFont: () => void;
    onToggleFlow: () => void;
    flow: 'paginated' | 'scrolled';
    insets: EdgeInsets;
    title?: string;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
    visible,
    onClose,
    onTTS,
    onAddBookmark,
    onTOC,
    onNotes,
    onTheme,
    onFont,
    onToggleFlow,
    flow,
    insets,
    title,
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
    }: {
        onPress: () => void;
        icon: any;
        label?: string;
    }) => (
        <TouchableOpacity
            onPress={onPress}
            style={{ alignItems: 'center', justifyContent: 'center' }}
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
        backgroundColor: isDark ? theme.colors.mainBackground : theme.colors.white,
        opacity: 0.9,
    };

    const footerStyle = {
        paddingTop: 16,
        paddingHorizontal: 32,
        paddingBottom: insets.bottom + 8,
        borderTopWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: isDark ? theme.colors.mainBackground : theme.colors.white,
        opacity: 0.9,
    };

    return (
        <Box
            position="absolute"
            top={0}
            bottom={0}
            left={0}
            right={0}
            zIndex={50}
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
                            <TouchableOpacity onPress={onToggleFlow}>
                                {flow === 'paginated' ? (
                                    <ArrowLeftRight
                                        size={ICON_SIZE}
                                        color={theme.colors.textPrimary}
                                    />
                                ) : (
                                    <ArrowUpDown
                                        size={ICON_SIZE}
                                        color={theme.colors.textPrimary}
                                    />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onAddBookmark}>
                                <Bookmark size={ICON_SIZE} color={theme.colors.textPrimary} />
                            </TouchableOpacity>
                        </Box>
                    </Box>
                </BlurView>
            </Box>

            {/* Footer Overlay */}
            <Box position="absolute" bottom={0} left={0} right={0}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 40 : 95}
                    tint={isDark ? 'systemThickMaterialDark' : 'systemMaterial'}
                    style={footerStyle}
                >
                    <Box flexDirection="row" justifyContent="space-between" alignItems="flex-end">
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
                            onPress={onTheme}
                            icon={Palette}
                            label={t('reader.controls.theme')}
                        />
                        <IconButton
                            onPress={onFont}
                            icon={Type}
                            label={t('reader.controls.style')}
                        />
                        <IconButton
                            onPress={onTTS}
                            icon={Headphones}
                            label={t('reader.controls.listen')}
                        />
                    </Box>
                </BlurView>
            </Box>
        </Box>
    );
};

export default ReaderControls;
