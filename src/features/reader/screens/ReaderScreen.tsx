import React, { useState, useEffect } from 'react';
import { StatusBar, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shopify/restyle';

import Box from '@/components/Box';
import { Theme } from '@/theme/theme';

import ReaderControls from '@/features/reader/components/ReaderControls';
import ReaderRenderer from '@/features/reader/components/ReaderRenderer';
import ReaderModals from '@/features/reader/components/ReaderModals';
import PageTurnButtons from '@/features/reader/components/PageTurnButtons';

import { useReaderLogic } from '@/features/reader/hooks/useReaderLogic';
import { useTtsLogic } from '@/features/reader/hooks/useTtsLogic';
import { useReaderUI } from '@/features/reader/hooks/useReaderUI';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { useThemeStore } from '@/stores/useThemeStore';
import { useTranslation } from 'react-i18next'; // Added for restoration text

const READER_THEMES = {
    light: { bg: '#FFFFFF', text: '#000000' },
    dark: { bg: '#121212', text: '#E0E0E0' },
    warm: { bg: '#F5E6D3', text: '#5D4037' },
    'eye-care': { bg: '#CBE5D3', text: '#1B5E20' },
};

const ReaderScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const insets = useSafeAreaInsets();
    const { mode } = useThemeStore();
    const { t } = useTranslation(); // Hook for translations

    const [stableInsets, setStableInsets] = useState(insets);
    useEffect(() => {
        if (insets.top > 0) setStableInsets(insets);
    }, [insets]);

    const logic = useReaderLogic();
    const ui = useReaderUI();
    const settings = useReaderSettings();
    const tts = useTtsLogic(
        logic.book?.id || '',
        logic.content,
        logic.currentChapterScrollRef,
        logic.epubStructure,
    );

    const [currentSectionHref, setCurrentSectionHref] = useState<string>('');
    const handleSectionChange = (href: string) => {
        setCurrentSectionHref(href);
        logic.handleSectionChange(href);
    };

    // Fix: Strictly wait for data loading to complete before mounting renderer.
    // However, we MUST NOT block if logic.isRestoring.
    // logic.isRestoring requires the ReaderRenderer to be MOUNTED to trigger onReady.
    // If we block rendering during isRestoring, onReady never fires, causing infinite loading.
    const shouldBlockRender = logic.loading;

    if (shouldBlockRender) {
        return (
            <Box
                flex={1}
                justifyContent="center"
                alignItems="center"
                backgroundColor="mainBackground"
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </Box>
        );
    }

    const currentThemeColors =
        READER_THEMES[settings.theme as keyof typeof READER_THEMES] || READER_THEMES.light;
    const isDark = mode === 'dark' || settings.theme === 'dark';

    return (
        <Box flex={1} style={{ backgroundColor: currentThemeColors.bg }}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                translucent
                hidden={!ui.showControls}
            />

            <Box
                flex={1}
                style={{ paddingTop: stableInsets.top, paddingBottom: stableInsets.bottom }}
            >
                <ReaderRenderer
                    book={logic.book}
                    content={logic.content}
                    fontSize={settings.fontSize}
                    fontFamily={settings.fontFamily}
                    lineHeight={settings.lineHeight}
                    readerThemeColors={currentThemeColors}
                    stableInsets={stableInsets}
                    epubRef={logic.epubRef}
                    scrollViewRef={logic.scrollViewRef}
                    currentChapterIndex={logic.currentChapterIndex}
                    currentChapterIndexRef={logic.currentChapterIndexRef}
                    toggleControls={ui.toggleControls}
                    handleLocationUpdate={logic.handleLocationUpdate}
                    handleEpubScroll={logic.handleEpubScroll}
                    handleSectionChange={handleSectionChange}
                    initialScrollPosition={logic.book?.readingPosition || 0}
                    handleScroll={logic.handleScroll}
                    handleTextLayout={logic.handleTextLayout}
                    setTotalPdfPages={logic.setTotalPdfPages}
                    mode={(mode === 'system' ? 'light' : mode) as 'light' | 'dark'}
                    readerTheme={settings.theme}
                    onReady={logic.handleReaderReady}
                />
            </Box>

            {/* Restoration Overlay: Blocks interaction while recovering exact CFI position */}
            {logic.isRestoring && (
                <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="mainBackground"
                    justifyContent="center"
                    alignItems="center"
                    zIndex={999}
                >
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 16, color: theme.colors.secondaryText }}>
                        {t('reader.restoring_progress', 'Restoring progress...')}
                    </Text>
                </Box>
            )}

            <PageTurnButtons
                visible={!ui.showControls && !logic.isRestoring}
                onPrev={() => {
                    if (logic.book?.fileType === 'epub') logic.epubRef.current?.turnPage('prev');
                    else logic.handlePrevChapter();
                }}
                onNext={() => {
                    if (logic.book?.fileType === 'epub') logic.epubRef.current?.turnPage('next');
                    else logic.handleNextChapter();
                }}
            />

            <ReaderModals
                logic={logic}
                ui={ui}
                tts={tts}
                settings={settings}
                epubStructure={logic.epubStructure}
                handleSelectChapter={logic.handleSelectChapter}
                handleSelectBookmark={logic.handleSelectBookmark}
                handleSaveNote={logic.handleSaveNote}
                currentSectionHref={currentSectionHref}
                insets={stableInsets}
            />

            <ReaderControls
                visible={ui.showControls}
                onClose={logic.handleClose}
                onTTS={() => {
                    console.log('[ReaderScreen] Opening TTS Modal');
                    ui.setShowTTS(true);
                }}
                onAddBookmark={logic.handleAddBookmark}
                onTOC={() =>
                    ui.setContentsModal({
                        visible: true,
                        tabs: ['contents'],
                        initialTab: 'contents',
                    })
                }
                onNotes={() =>
                    ui.setContentsModal({
                        visible: true,
                        tabs: ['notes', 'bookmarks'],
                        initialTab: 'notes',
                    })
                }
                onAddNote={() => ui.setShowNoteInput(true)}
                onViewBookmarks={() => {
                    ui.setShowControls(false);
                    ui.setContentsModal({
                        visible: true,
                        tabs: ['bookmarks'],
                        initialTab: 'bookmarks',
                    });
                }}
                onTheme={() => {
                    ui.setShowThemePanel(!ui.showThemePanel);
                    ui.setShowFontPanel(false);
                }}
                onFont={() => {
                    ui.setShowFontPanel(!ui.showFontPanel);
                    ui.setShowThemePanel(false);
                }}
                insets={stableInsets}
                title={logic.book?.title}
                fileType={logic.book?.fileType}
            />

            {ui.showControls && (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    style={{ position: 'absolute', right: 24, bottom: 120, zIndex: 60 }}
                >
                    <TouchableOpacity onPress={() => ui.setShowNoteInput(true)}>
                        <Box
                            width={44}
                            height={44}
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="full"
                            backgroundColor={isDark ? 'glassStrong' : 'glass'}
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.15,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            <Ionicons name="add" size={28} color="#FFF" />
                        </Box>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Box>
    );
};

export default ReaderScreen;
