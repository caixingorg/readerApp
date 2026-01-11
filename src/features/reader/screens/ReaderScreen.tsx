import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';
import { useTranslation } from 'react-i18next';

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
import ThemeSettingsPanel, {
    ReaderThemeMode,
} from '@/features/reader/components/ThemeSettingsPanel';
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
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<ReaderScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const { mode, setMode } = useThemeStore();

    // Stable insets to prevent flicker
    const [stableInsets, setStableInsets] = useState(insets);
    useEffect(() => {
        if (insets.top > 0) setStableInsets(insets);
    }, [insets]);

    // 标记是否已执行初始恢复（防止重复执行）
    const hasRestoredRef = useRef(false);

    // --- Business Logic ---
    const {
        book,
        loading,
        content,
        epubStructure,
        currentChapterIndex,
        // Note: initialLocationHref removed - we now use currentChapterIndex (number) directly for navigation
        totalPdfPages,
        setTotalPdfPages,
        epubRef,
        scrollViewRef,
        currentChapterIndexRef, // Ref 用于解决 onReady 闭包问题
        bookLoadedRef, // 标记书籍是否加载完成
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
        handleAddBookmark,
    } = useReaderLogic();

    // --- TTS Logic ---
    const {
        isTTSPlaying,
        isTTSPaused,
        ttsStatusText,
        handleTTSPlayPause,
        handleTTSStop,
        handleTTSRateChange,
    } = useTtsLogic(book?.id || '', content, currentChapterScrollRef, epubStructure);

    // --- Settings ---
    const {
        theme: readerTheme,
        setTheme: setReaderTheme,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        lineHeight,
        setLineHeight,
        flow,
        setFlow,
        hapticFeedback,
        ttsRate,
    } = useReaderSettings();

    // --- Local State ---
    const [showControls, setShowControls] = useState(true);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [contentsModal, setContentsModal] = useState<{
        visible: boolean;
        tabs: ('contents' | 'bookmarks' | 'notes')[];
        initialTab: 'contents' | 'bookmarks' | 'notes';
    }>({
        visible: false,
        tabs: ['contents'],
        initialTab: 'contents',
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
            setShowControls((prev) => !prev);
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

    /**
     * 处理书签跳转
     *
     * 书签的 cfi 字段可能包含以下格式：
     * 1. "chapter:X" - 章节索引格式（我们的自定义格式）
     * 2. "epubcfi(...)" - 标准 EPUB CFI 格式
     * 3. "OEBPS/..." - HREF 路径格式（需要转换为索引）
     * 4. "scroll:X" - TXT 滚动位置
     */
    const handleSelectBookmark = (bookmark: Bookmark) => {
        // 关闭模态框
        setContentsModal((prev) => ({ ...prev, visible: false }));

        // 边界检查
        if (!book || !bookmark) {
            console.warn('[handleSelectBookmark] Invalid book or bookmark');
            return;
        }

        // ===== EPUB 处理 =====
        if (book.fileType === 'epub') {
            if (!bookmark.cfi) {
                console.warn('[handleSelectBookmark] EPUB bookmark missing cfi field');
                return;
            }

            // 检查 epubRef 是否可用
            if (!epubRef.current || !epubRef.current.goToLocation) {
                console.warn(
                    '[handleSelectBookmark] epubRef not available, falling back to handleSelectChapter',
                );
                handleSelectChapter(bookmark.cfi);
                return;
            }

            // 格式 1: "chapter:X" - 章节索引格式（最常见）
            if (bookmark.cfi.startsWith('chapter:')) {
                const indexStr = bookmark.cfi.replace('chapter:', '');
                const chapterIndex = parseInt(indexStr, 10);

                // 验证索引有效性
                if (isNaN(chapterIndex) || chapterIndex < 0) {
                    console.warn(`[handleSelectBookmark] Invalid chapter index: ${indexStr}`);
                    return;
                }

                // 验证索引范围
                const maxIndex = (epubStructure?.spine?.length || 1) - 1;
                if (chapterIndex > maxIndex) {
                    console.warn(
                        `[handleSelectBookmark] Chapter index ${chapterIndex} exceeds max ${maxIndex}`,
                    );
                    return;
                }

                console.log(`[handleSelectBookmark] Jumping to chapter index: ${chapterIndex}`);
                epubRef.current.goToLocation(chapterIndex);
                return;
            }

            // 格式 2: "epubcfi(...)" - 标准 CFI 格式
            if (bookmark.cfi.startsWith('epubcfi(')) {
                console.log(`[handleSelectBookmark] Jumping to CFI: ${bookmark.cfi}`);
                epubRef.current.goToLocation(bookmark.cfi);
                return;
            }

            // 格式 3: HREF 路径格式 - 需要转换为章节索引
            // 例如: "OEBPS/Text/chapter1.xhtml" 或 "Text/chapter1.xhtml"
            if (
                bookmark.cfi.includes('/') ||
                bookmark.cfi.includes('.xhtml') ||
                bookmark.cfi.includes('.html')
            ) {
                const targetHref = bookmark.cfi;
                const targetFilename = targetHref.split('/').pop()?.split('#')[0] || '';

                // 在 spine 中查找匹配的章节
                const chapterIndex =
                    epubStructure?.spine?.findIndex((c) => {
                        const cFilename = c.href.split('/').pop() || '';
                        return (
                            cFilename === targetFilename ||
                            c.href === targetHref ||
                            decodeURIComponent(c.href) === decodeURIComponent(targetHref)
                        );
                    }) ?? -1;

                if (chapterIndex !== -1) {
                    console.log(
                        `[handleSelectBookmark] Resolved HREF "${targetHref}" to chapter index: ${chapterIndex}`,
                    );
                    epubRef.current.goToLocation(chapterIndex);
                } else {
                    console.warn(
                        `[handleSelectBookmark] Cannot find chapter for HREF: ${targetHref}`,
                    );
                }
                return;
            }

            // 未知格式 - 尝试直接传递（可能是数字字符串）
            const numericValue = parseInt(bookmark.cfi, 10);
            if (!isNaN(numericValue)) {
                console.log(`[handleSelectBookmark] Treating as numeric index: ${numericValue}`);
                epubRef.current.goToLocation(numericValue);
            } else {
                console.warn(`[handleSelectBookmark] Unknown bookmark format: ${bookmark.cfi}`);
            }
            return;
        }

        // ===== PDF 处理 =====
        if (book.fileType === 'pdf' && bookmark.page) {
            // TODO: 需要暴露 setCurrentChapterIndex 来支持 PDF 页面跳转
            console.warn('[handleSelectBookmark] PDF page jump not yet implemented');
            return;
        }

        // ===== TXT 处理 =====
        if (book.fileType === 'txt') {
            // 格式: "scroll:X"
            if (bookmark.cfi?.startsWith('scroll:')) {
                const offset = parseInt(bookmark.cfi.replace('scroll:', ''), 10);
                if (!isNaN(offset) && scrollViewRef.current) {
                    console.log(`[handleSelectBookmark] Scrolling to offset: ${offset}`);
                    scrollViewRef.current.scrollTo({ y: offset, animated: true });
                }
                return;
            }
            // 也支持直接使用 offset 字段
            if (bookmark.offset !== undefined && scrollViewRef.current) {
                console.log(
                    `[handleSelectBookmark] Scrolling to bookmark.offset: ${bookmark.offset}`,
                );
                scrollViewRef.current.scrollTo({ y: bookmark.offset, animated: true });
            }
        }
    };

    const handleSaveNote = async (noteContent: string, color: string) => {
        if (!book) return;

        // Fallback CFI using current chapter index from state
        const cfiToSave = selectedCfi || `chapter:${currentChapterIndex}`;

        const type = noteContent && noteContent.trim().length > 0 ? 'note' : 'highlight';

        try {
            const newNote: Note = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                cfi: cfiToSave,
                fullText: selectedText || '',
                note: noteContent,
                color,
                type,
                createdAt: Date.now(),
            };

            await NoteRepository.create(newNote);
            Toast.show({
                type: 'success',
                text1: type === 'note' ? t('reader.note_saved') : t('reader.highlight_saved'),
            });

            setSelectedText('');
            setSelectedCfi('');
            setShowNoteInput(false);
        } catch (e) {
            console.error('Failed to save note', e);
            Toast.show({
                type: 'error',
                text1: t('reader.save_failed'),
            });
        }
    };

    // --- Render ---

    if (loading && !content && book?.fileType !== 'pdf') {
        return (
            <Box
                flex={1}
                justifyContent="center"
                alignItems="center"
                backgroundColor="mainBackground"
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="body" marginTop="m">
                    Loading...
                </Text>
            </Box>
        );
    }

    const currentThemeColors =
        READER_THEMES[readerTheme as keyof typeof READER_THEMES] || READER_THEMES.light;
    const isDark = mode === 'dark' || readerTheme === 'dark';

    return (
        <Box
            flex={1}
            backgroundColor="mainBackground"
            style={{ backgroundColor: currentThemeColors.bg }}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
                hidden={!showControls}
            />

            <Box
                flex={1}
                style={{ paddingTop: stableInsets.top, paddingBottom: stableInsets.bottom }}
            >
                {book?.fileType === 'epub' ? (
                    <>
                        {/* EPUB Reader - 恢复使用 imperative 方式（与 TOC 导航相同） */}
                        <EpubReader
                            ref={epubRef}
                            url={book.filePath}
                            location={undefined}
                            theme={theme}
                            themeMode={mode === 'dark' ? 'dark' : 'light'}
                            customTheme={
                                readerTheme === 'warm' || readerTheme === 'eye-care'
                                    ? currentThemeColors
                                    : undefined
                            }
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            flow={flow}
                            onPress={toggleControls}
                            onReady={() => {
                                console.log('[ReaderScreen] onReady triggered');
                                const savedIndex = currentChapterIndexRef.current;
                                console.log(
                                    `[ReaderScreen] onReady - savedIndex from ref: ${savedIndex}`,
                                );

                                // 使用 imperative 方式恢复（与 TOC 导航相同）
                                // 需要更长的延迟确保 rendition 完全就绪
                                if (savedIndex > 0) {
                                    console.log(
                                        `[ReaderScreen] 📌 Scheduling restoration to chapter ${savedIndex} in 1500ms`,
                                    );
                                    setTimeout(() => {
                                        if (epubRef.current?.goToLocation) {
                                            console.log(
                                                `[ReaderScreen] ⏱️ Now calling epubRef.current.goToLocation(${savedIndex})`,
                                            );
                                            epubRef.current.goToLocation(savedIndex);
                                        } else {
                                            console.warn(
                                                '[ReaderScreen] ❌ epubRef.current.goToLocation not available',
                                            );
                                        }
                                    }, 1500);
                                }
                            }}
                            onLocationChange={(cfi: string) => {
                                if (cfi) {
                                    handleLocationUpdate(cfi);
                                    handleEpubScroll(0);
                                }
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
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            padding: theme.spacing.l,
                            paddingBottom: theme.spacing.xxl * 2,
                        }}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <Text
                            variant="body"
                            style={{
                                fontSize,
                                lineHeight: fontSize * lineHeight,
                                color: currentThemeColors.text,
                                fontFamily,
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
                onTOC={() =>
                    setContentsModal({ visible: true, tabs: ['contents'], initialTab: 'contents' })
                }
                onNotes={() =>
                    setContentsModal({
                        visible: true,
                        tabs: ['notes', 'bookmarks'],
                        initialTab: 'notes',
                    })
                }
                onViewBookmarks={() => {
                    setShowControls(false);
                }}
                onTheme={() => {
                    setShowThemePanel(!showThemePanel);
                    setShowFontPanel(false);
                }}
                onFont={() => {
                    setShowFontPanel(!showFontPanel);
                    setShowThemePanel(false);
                }}
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
                onClose={() => setContentsModal((prev) => ({ ...prev, visible: false }))}
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
                fontSize={fontSize}
                setFontSize={setFontSize}
                lineHeight={lineHeight}
                setLineHeight={setLineHeight}
                margin={margin}
                setMargin={setMargin}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
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
                    style={{
                        position: 'absolute',
                        left: 24,
                        bottom: stableInsets.bottom + 100,
                        zIndex: 60,
                    }}
                >
                    <TouchableOpacity onPress={() => setShowNoteInput(true)}>
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
