
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';

import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import { RootStackParamList } from '@/types/navigation';

import EpubReader from '@/features/reader/components/EpubReader';
import PdfReader from '@/features/reader/components/PdfReader';
import ReaderControls from '@/features/reader/components/ReaderControls';
import ContentsModal from '@/features/reader/components/ContentsModal';
import TTSModal from '@/features/reader/components/TTSModal';
import NoteInputModal from '@/features/reader/components/NoteInputModal';
import FontSettingsPanel from '@/features/reader/components/FontSettingsPanel';
import ThemeSettingsPanel, { ReaderThemeMode } from '@/features/reader/components/ThemeSettingsPanel';
import PageTurnButtons from '@/features/reader/components/PageTurnButtons';
import TTSMiniPlayer from '@/features/reader/components/TTSMiniPlayer';

import { useReaderLogic } from '@/features/reader/hooks/useReaderLogic';
import { useTtsLogic } from '@/features/reader/hooks/useTtsLogic';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { useThemeStore } from '@/stores/useThemeStore';

import { NoteRepository } from '@/services/database/NoteRepository';
import { Bookmark, Note } from '@/services/database/types';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const READER_THEMES = {
    light: { bg: '#FFFFFF', text: '#000000' },
    dark: { bg: '#121212', text: '#E0E0E0' },
    warm: { bg: '#F5E6D3', text: '#5D4037' },
    'eye-care': { bg: '#CBE5D3', text: '#1B5E20' },
};

const ReaderScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation();
    const route = useRoute<ReaderScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const { mode, setMode } = useThemeStore();

    // Stable insets to prevent flicker
    const [stableInsets, setStableInsets] = useState(insets);
    useEffect(() => {
        if (insets.top > 0) setStableInsets(insets);
    }, [insets]);

    // --- Business Logic ---
    const {
        book,
        loading,
        content,
        epubStructure,
        currentChapterIndex,
        initialLocationHref,
        totalPdfPages, setTotalPdfPages,
        epubRef,
        scrollViewRef,
        currentChapterScrollRef,
        handleScroll,
        handleEpubScroll,
        handleNextChapter,
        handlePrevChapter,
        handleSelectChapter,
        handleSectionChange,
        handleLocationUpdate,
        handleTextLayout,
        saveProgress,
        handleAddBookmark
    } = useReaderLogic();

    // --- TTS Logic ---
    const {
        isTTSPlaying,
        isTTSPaused,
        ttsStatusText,
        handleTTSPlayPause,
        handleTTSStop,
        handleTTSRateChange
    } = useTtsLogic(book?.id || '', content, currentChapterScrollRef, epubStructure);

    // --- Settings ---
    const {
        theme: readerTheme, setTheme: setReaderTheme,
        fontFamily, setFontFamily,
        fontSize, setFontSize,
        lineHeight, setLineHeight,
        flow, setFlow,
        hapticFeedback,
        ttsRate
    } = useReaderSettings();

    // --- Local State ---
    const [showControls, setShowControls] = useState(true);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [contentsModal, setContentsModal] = useState<{ visible: boolean; tabs: ('contents' | 'bookmarks' | 'notes')[]; initialTab: 'contents' | 'bookmarks' | 'notes' }>({
        visible: false,
        tabs: ['contents'],
        initialTab: 'contents'
    });

    const [showTTS, setShowTTS] = useState(false);
    const [showNoteInput, setShowNoteInput] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [selectedCfi, setSelectedCfi] = useState('');

    const [brightness, setBrightness] = useState(1);
    const [margin, setMargin] = useState(2); // Local margin state for now
    const [currentSectionHref, setCurrentSectionHref] = useState<string>(''); // For TOC highlighting

    // Init Brightness
    useEffect(() => {
        (async () => {
            const { status } = await Brightness.requestPermissionsAsync();
            if (status === 'granted') {
                const cur = await Brightness.getBrightnessAsync();
                setBrightness(cur);
            }
        })();
    }, []);

    const handleBrightnessChange = async (val: number) => {
        setBrightness(val);
        await Brightness.setBrightnessAsync(val);
    };

    // --- Handlers ---

    const toggleControls = () => {
        if (showFontPanel || showThemePanel) {
            setShowFontPanel(false);
            setShowThemePanel(false);
        } else {
            setShowControls(prev => !prev);
        }
    };

    const handleThemeChange = (newMode: ReaderThemeMode) => {
        setReaderTheme(newMode);
        if (newMode === 'dark') setMode('dark');
        else setMode('light');
    };

    const handleClose = () => {
        saveProgress();
        navigation.goBack();
    };

    const handleSelectBookmark = (bookmark: Bookmark) => {
        setContentsModal(prev => ({ ...prev, visible: false }));

        if (book?.fileType === 'epub' && bookmark.cfi) {
            let targetLocation = bookmark.cfi;

            // Parse `chapter:X` format and convert to HREF
            if (bookmark.cfi.startsWith('chapter:')) {
                const chapterIndex = parseInt(bookmark.cfi.replace('chapter:', ''), 10);
                if (epubStructure?.spine[chapterIndex]) {
                    targetLocation = epubStructure.spine[chapterIndex].href;
                    console.log(`[handleSelectBookmark] Resolved chapter:${chapterIndex} to href: ${targetLocation}`);
                } else {
                    console.warn(`[handleSelectBookmark] Cannot find spine item for chapter:${chapterIndex}`);
                    return;
                }
            }

            // Use imperative jump
            if (epubRef.current && epubRef.current.goToLocation) {
                console.log('[handleSelectBookmark] Jumping to:', targetLocation);
                epubRef.current.goToLocation(targetLocation);
            } else {
                // Fallback to handleSelectChapter if epubRef is not available
                handleSelectChapter(targetLocation);
            }
        } else if (book?.fileType === 'pdf' && bookmark.page) {
            console.warn('PDF Bookmark jump requires setCurrentChapterIndex');
        } else if (book?.fileType === 'txt' && bookmark.offset !== undefined) {
            scrollViewRef.current?.scrollTo({ y: bookmark.offset, animated: true });
        }
    };

    const handleSaveNote = async (noteContent: string, color: string) => {
        if (!book) return;

        // Fallback CFI using current chapter index from state
        const cfiToSave = selectedCfi || `chapter:${currentChapterIndex}`;

        const type = (noteContent && noteContent.trim().length > 0) ? 'note' : 'highlight';

        try {
            const newNote: Note = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                cfi: cfiToSave,
                fullText: selectedText || '',
                note: noteContent,
                color,
                type,
                createdAt: Date.now()
            };

            await NoteRepository.create(newNote);
            Toast.show({
                type: 'success',
                text1: type === 'note' ? 'Note saved' : 'Highlight saved'
            });

            setSelectedText('');
            setSelectedCfi('');
            setShowNoteInput(false);
        } catch (e) {
            console.error('Failed to save note', e);
            Toast.show({
                type: 'error',
                text1: 'Failed to save'
            });
        }
    };

    // --- Render ---

    if (loading && !content && book?.fileType !== 'pdf') {
        return (
            <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="mainBackground">
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="body" marginTop="m">Loading...</Text>
            </Box>
        );
    }

    const currentThemeColors = READER_THEMES[readerTheme as keyof typeof READER_THEMES] || READER_THEMES.light;
    const isDark = mode === 'dark' || readerTheme === 'dark';

    return (
        <Box flex={1} backgroundColor="mainBackground" style={{ backgroundColor: currentThemeColors.bg }}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
                hidden={!showControls}
            />

            <Box flex={1} style={{ paddingTop: stableInsets.top, paddingBottom: stableInsets.bottom }}>
                {book?.fileType === 'epub' ? (
                    <>
                        {console.warn('[🔗 Stage 2: Prop] Initial HREF available:', initialLocationHref)}
                        <EpubReader
                            ref={epubRef}
                            url={book.filePath}
                            location={undefined} // Don't rely on prop for initial jump; use onReady instead
                            theme={theme}
                            themeMode={mode === 'dark' ? 'dark' : 'light'}
                            customTheme={(readerTheme === 'warm' || readerTheme === 'eye-care') ? currentThemeColors : undefined}
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            flow={flow}
                            onPress={toggleControls}
                            onReady={() => {
                                // Imperative initial restoration when reader is fully ready
                                if (initialLocationHref && epubRef.current) {
                                    console.log('[🚀 ReaderScreen] onReady: Restoring to', initialLocationHref);
                                    // Small delay to ensure rendition is fully initialized
                                    setTimeout(() => {
                                        epubRef.current?.goToLocation(initialLocationHref);
                                    }, 100);
                                }
                            }}
                            onLocationChange={(cfi: string) => {
                                // Update CFI for persistence
                                handleLocationUpdate(cfi);
                                // Keep scroll percentage logic if needed (though CFI is more precise)
                                handleEpubScroll(0);
                            }}
                            onSectionChange={(section) => {
                                if (section && section.href) {
                                    handleSectionChange(section.href);
                                }
                            }}

                            insets={stableInsets}
                        />
                    </>
                ) : book?.fileType === 'pdf' ? (
                    <PdfReader
                        uri={book.filePath}
                        initialPage={currentChapterIndex > 0 ? currentChapterIndex : 1}
                        onPageChanged={(page, total) => {
                            setTotalPdfPages(total);
                            // We need to update chapter index for progress saving.
                            // Logic hook doesn't expose setter. 
                            // We should update useReaderLogic to expose setCurrentChapterIndex or a specific handler.
                        }}
                        onPress={toggleControls}
                        themeMode={isDark ? 'dark' : 'light'}
                    />
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.container}
                        contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <Text
                            variant="body"
                            style={{
                                fontSize,
                                lineHeight: fontSize * lineHeight,
                                color: currentThemeColors.text,
                                fontFamily
                            }}
                            selectable
                            onPress={toggleControls}
                            onTextLayout={handleTextLayout}

                        >
                            {content}
                        </Text>
                    </ScrollView>
                )}
            </Box>

            {/* Controls */}
            <ReaderControls
                visible={showControls}
                onClose={handleClose}
                onTTS={() => setShowTTS(true)}
                onAddBookmark={handleAddBookmark}
                onTOC={() => setContentsModal({ visible: true, tabs: ['contents'], initialTab: 'contents' })}
                onNotes={() => setContentsModal({ visible: true, tabs: ['notes', 'bookmarks'], initialTab: 'notes' })}
                onViewBookmarks={() => { setShowControls(false); }}
                onTheme={() => { setShowThemePanel(!showThemePanel); setShowFontPanel(false); }}
                onFont={() => { setShowFontPanel(!showFontPanel); setShowThemePanel(false); }}
                onToggleFlow={() => setFlow(flow === 'paginated' ? 'scrolled' : 'paginated')}
                flow={flow}
                insets={stableInsets}
                title={book?.title}
            />

            <PageTurnButtons
                visible={!showControls}
                flow={flow}
                onPrev={() => {
                    if (book?.fileType === 'epub') {
                        epubRef.current?.turnPage('prev');
                    } else if (book?.fileType === 'pdf') {
                        handlePrevChapter(); // PDF logic currently uses chapter index as page number
                    } else {
                        handlePrevChapter(); // PDF/TXT (scrolled)
                    }
                }}
                onNext={() => {
                    if (book?.fileType === 'epub') {
                        epubRef.current?.turnPage('next');
                    } else if (book?.fileType === 'pdf') {
                        handleNextChapter(); // PDF logic uses chapter index as page
                    } else {
                        handleNextChapter();
                    }
                }}
            />

            {/* Modals & Panels */}
            <ContentsModal
                visible={contentsModal.visible}
                onClose={() => setContentsModal(prev => ({ ...prev, visible: false }))}
                bookId={book?.id || ''}
                chapters={epubStructure?.toc || []}
                currentHref={currentSectionHref}
                initialTab={contentsModal.initialTab}
                availableTabs={contentsModal.tabs}
                onSelectChapter={handleSelectChapter}
                onSelectBookmark={handleSelectBookmark}
            />

            <FontSettingsPanel
                visible={showFontPanel}
                fontSize={fontSize} setFontSize={setFontSize}
                lineHeight={lineHeight} setLineHeight={setLineHeight}
                margin={margin} setMargin={setMargin}
                fontFamily={fontFamily} setFontFamily={setFontFamily}
                bottomOffset={80}
            />

            <ThemeSettingsPanel
                visible={showThemePanel}
                currentMode={readerTheme}
                onSelectMode={handleThemeChange}
                brightness={brightness}
                setBrightness={handleBrightnessChange}
                bottomOffset={80}
            />

            <TTSModal
                visible={showTTS}
                onClose={() => setShowTTS(false)}
                content={content} // For TXT, or current chapter text
                isPlaying={isTTSPlaying}
                isPaused={isTTSPaused}
                statusText={ttsStatusText}
                onPlayPause={handleTTSPlayPause}
                onStop={handleTTSStop}
                onRateChange={handleTTSRateChange}
                currentRate={ttsRate}
            />

            <TTSMiniPlayer
                visible={isTTSPlaying && !showTTS}
                isPlaying={isTTSPlaying}
                isPaused={isTTSPaused}
                onPlayPause={handleTTSPlayPause}
                onStop={handleTTSStop}
                onExpand={() => setShowTTS(true)}
                bottomOffset={showControls ? 80 : 20}
            />

            <NoteInputModal
                visible={showNoteInput}
                onClose={() => setShowNoteInput(false)}
                onSubmit={handleSaveNote}
                selectedText={selectedText}
            />

            {/* Floating Add Note Button (Fixed Left) */}
            {showControls && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={[styles.fab, { bottom: stableInsets.bottom + 100 }]}
                >
                    <TouchableOpacity
                        onPress={() => setShowNoteInput(true)}
                        style={[styles.fabButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)' }]}
                    >
                        <Ionicons name="add" size={28} color="#FFF" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Box>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    fab: {
        position: 'absolute',
        left: 24,
        zIndex: 60
    },
    fabButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3
    }
});

export default ReaderScreen;
