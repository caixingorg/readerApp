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

/**
 * 阅读器主屏幕组件
 * 核心功能：
 * 1. 适配多种阅读模式 (EPUB, PDF, TXT)
 * 2. 管理阅读器 UI 交互 (控制栏、侧边面板、各类模态框)
 * 3. 协调业务逻辑 Hook (useReaderLogic, useTtsLogic)
 * 4. 视觉主题与安全区域适配
 */
const ReaderScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute<ReaderScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const { mode, setMode } = useThemeStore();

    // --- 适配处理 ---
    // 为了防止刘海屏区域在 UI 切换时产生闪烁，保存一份稳定的 SafeInsets
    const [stableInsets, setStableInsets] = useState(insets);
    useEffect(() => {
        if (insets.top > 0) setStableInsets(insets);
    }, [insets]);

    // 标记是否已执行初始恢复逻辑（防止重复触发导致页面回跳）
    const hasRestoredRef = useRef(false);

    // --- 核心业务逻辑 Hook (详见 useReaderLogic.ts) ---
    const {
        book,
        loading,
        content,
        epubStructure,
        currentChapterIndex,
        totalPdfPages,
        setTotalPdfPages,
        epubRef,
        scrollViewRef,
        currentChapterIndexRef, // 暴露出 Ref 用于在 onReady 回调中获取最新章节索引，绕过闭包
        bookLoadedRef, // 标记书籍背景加载是否真正完成
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

    // --- TTS 语音朗读逻辑 Hook (详见 useTtsLogic.ts) ---
    const {
        isTTSPlaying,
        isTTSPaused,
        ttsStatusText,
        handleTTSPlayPause,
        handleTTSStop,
        handleTTSRateChange,
    } = useTtsLogic(book?.id || '', content, currentChapterScrollRef, epubStructure);

    // --- 阅读偏好设置 (持久化状态) ---
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

    // --- 本地交互状态 ---
    const [showControls, setShowControls] = useState(true); // 控制栏显示状态
    const [showFontPanel, setShowFontPanel] = useState(false); // 字体设置面板
    const [showThemePanel, setShowThemePanel] = useState(false); // 主题设置面板
    const [contentsModal, setContentsModal] = useState<{
        visible: boolean;
        tabs: ('contents' | 'bookmarks' | 'notes')[];
        initialTab: 'contents' | 'bookmarks' | 'notes';
    }>({
        visible: false,
        tabs: ['contents'],
        initialTab: 'contents',
    });

    const [showTTS, setShowTTS] = useState(false); // 是否显示 TTS 控制模态框
    const [showNoteInput, setShowNoteInput] = useState(false); // 是否显示笔记输入框
    const [selectedText, setSelectedText] = useState(''); // 用户选中的文本
    const [selectedCfi, setSelectedCfi] = useState(''); // 选中文本对应的位置标识

    const [brightness, setBrightness] = useState(1); // 屏幕亮度控制
    const [margin, setMargin] = useState(2); // 文本边距偏好
    const [currentSectionHref, setCurrentSectionHref] = useState<string>(''); // 当前章节链接（用于目录高亮）

    // 初始化亮度权限与值
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

    // --- 事件处理函数 ---

    /**
     * 切换菜单层级的交互逻辑
     * 如果子面板开启，先关闭子面板；否则切换控制栏状态。
     */
    const toggleControls = () => {
        if (showFontPanel || showThemePanel) {
            setShowFontPanel(false);
            setShowThemePanel(false);
        } else {
            setShowControls((prev) => !prev);
        }
    };

    /**
     * 同步阅读器主题与全局 App 主题模式
     */
    const handleThemeChange = (newMode: ReaderThemeMode) => {
        setReaderTheme(newMode);
        // 如果阅读器主题是 dark，强制同步 App 主题为黑夜模式
        if (newMode === 'dark') setMode('dark');
        else setMode('light'); // 否则通常设为亮色
    };

    const handleClose = () => {
        saveProgress(); // 退出前保存进度
        navigation.goBack();
    };

    /**
     * 处理书签/笔记的精准跳转
     * 场景：用户从目录弹窗中点击了一个书签
     * 支持：EPUB (CFI/Index/Href), TXT (Offset), PDF (Page)
     */
    const handleSelectBookmark = (bookmark: Bookmark) => {
        setContentsModal((prev) => ({ ...prev, visible: false }));

        if (!book || !bookmark) return;

        // ===== EPUB 跳转分支 =====
        if (book.fileType === 'epub') {
            if (!epubRef.current?.goToLocation) return;

            // 1. 优先处理自定义的索引格式 "chapter:X"
            if (bookmark.cfi?.startsWith('chapter:')) {
                const index = parseInt(bookmark.cfi.replace('chapter:', ''), 10);
                if (!isNaN(index)) epubRef.current.goToLocation(index);
                return;
            }

            // 2. 处理原生的标准 EPUB CFI 格式
            if (bookmark.cfi?.startsWith('epubcfi(')) {
                epubRef.current.goToLocation(bookmark.cfi);
                return;
            }

            // 3. 处理可能记录为 Href 的情况
            if (bookmark.cfi?.includes('/')) {
                handleSelectChapter(bookmark.cfi);
                return;
            }
        }

        // ===== TXT 跳转分支 =====
        if (book.fileType === 'txt') {
            if (bookmark.cfi?.startsWith('scroll:') && scrollViewRef.current) {
                const offset = parseInt(bookmark.cfi.replace('scroll:', ''), 10);
                scrollViewRef.current.scrollTo({ y: offset, animated: true });
            }
        }
    };

    /**
     * 笔记/高亮保存逻辑
     */
    const handleSaveNote = async (noteContent: string, color: string) => {
        if (!book) return;

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
        }
    };

    // --- 视觉渲染 ---

    // 全局空状态加载
    if (loading && !content && book?.fileType !== 'pdf') {
        return (
            <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="mainBackground">
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </Box>
        );
    }

    const currentThemeColors = READER_THEMES[readerTheme as keyof typeof READER_THEMES] || READER_THEMES.light;
    const isDark = mode === 'dark' || readerTheme === 'dark';

    return (
        <Box flex={1} style={{ backgroundColor: currentThemeColors.bg }}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
                hidden={!showControls}
            />

            {/* 阅读器渲染核心区域 */}
            <Box flex={1} style={{ paddingTop: stableInsets.top, paddingBottom: stableInsets.bottom }}>
                {book?.fileType === 'epub' ? (
                    <EpubReader
                        ref={epubRef}
                        url={book.filePath}
                        theme={theme}
                        themeMode={mode === 'dark' ? 'dark' : 'light'}
                        customTheme={readerTheme === 'warm' || readerTheme === 'eye-care' ? currentThemeColors : undefined}
                        fontSize={fontSize}
                        fontFamily={fontFamily}
                        flow={flow}
                        onPress={toggleControls}
                        onReady={() => {
                            // 书籍内核就绪后，通过 Ref 获取持久化的进度并执行跳转
                            const savedIndex = currentChapterIndexRef.current;
                            if (savedIndex > 0) {
                                // 重要技巧：由于 Webview 初始化需要时间，设置适度延迟确保跳转成功
                                setTimeout(() => {
                                    epubRef.current?.goToLocation(savedIndex);
                                }, 1500);
                            }
                        }}
                        onLocationChange={(cfi) => {
                            if (cfi) {
                                handleLocationUpdate(cfi);
                                handleEpubScroll(0);
                            }
                        }}
                        onSectionChange={(section) => {
                            if (section?.href) handleSectionChange(section.href);
                        }}
                        insets={stableInsets}
                    />
                ) : book?.fileType === 'pdf' ? (
                    <PdfReader
                        uri={book.filePath}
                        initialPage={currentChapterIndex > 0 ? currentChapterIndex : 1}
                        onPageChanged={(page, total) => setTotalPdfPages(total)}
                        onPress={toggleControls}
                        themeMode={isDark ? 'dark' : 'light'}
                    />
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: theme.spacing.l, paddingBottom: 100 }}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <Text
                            variant="body"
                            style={{ fontSize, lineHeight: fontSize * lineHeight, color: currentThemeColors.text, fontFamily }}
                            selectable
                            onPress={toggleControls}
                            onTextLayout={handleTextLayout}
                        >
                            {content}
                        </Text>
                    </ScrollView>
                )}
            </Box>

            {/* 控制图层 - 这里采用了分层设计：控制栏、翻页键、各类浮窗 */}

            {/* 1. 主控制栏 (顶部后退/当前信息，底部设置入口) */}
            <ReaderControls
                visible={showControls}
                onClose={handleClose}
                onTTS={() => setShowTTS(true)}
                onAddBookmark={handleAddBookmark}
                onTOC={() => setContentsModal({ visible: true, tabs: ['contents'], initialTab: 'contents' })}
                onNotes={() => setContentsModal({ visible: true, tabs: ['notes', 'bookmarks'], initialTab: 'notes' })}
                onViewBookmarks={() => {
                    setShowControls(false);
                }}
                onTheme={() => { setShowThemePanel(!showThemePanel); setShowFontPanel(false); }}
                onFont={() => { setShowFontPanel(!showFontPanel); setShowThemePanel(false); }}
                onToggleFlow={() => setFlow(flow === 'paginated' ? 'scrolled' : 'paginated')}
                flow={flow}
                insets={stableInsets}
                title={book?.title}
            />

            {/* 2. 透明翻页触发区域 (仅在隐藏菜单时可用，增强沉浸感) */}
            <PageTurnButtons
                visible={!showControls}
                flow={flow}
                onPrev={() => {
                    if (book?.fileType === 'epub') epubRef.current?.turnPage('prev');
                    else handlePrevChapter();
                }}
                onNext={() => {
                    if (book?.fileType === 'epub') epubRef.current?.turnPage('next');
                    else handleNextChapter();
                }}
            />

            {/* 3. 模态框组 */}
            <ContentsModal
                visible={contentsModal.visible}
                onClose={() => setContentsModal((p) => ({ ...p, visible: false }))}
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
                content={content}
                isPlaying={isTTSPlaying}
                isPaused={isTTSPaused}
                statusText={ttsStatusText}
                onPlayPause={handleTTSPlayPause}
                onStop={handleTTSStop}
                onRateChange={handleTTSRateChange}
                currentRate={ttsRate}
            />

            {/* 小窗播放器 (支持 TTS 在后台运行时的快捷控制) */}
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

            {/* 快速添加笔记按钮 */}
            {showControls && (
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.fabContainer}>
                    <TouchableOpacity onPress={() => setShowNoteInput(true)}>
                        <Box
                            width={44}
                            height={44}
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="full"
                            backgroundColor={isDark ? 'glassStrong' : 'glass'}
                            style={styles.fabShadow}
                        >
                            <Ionicons name="add" size={28} color="#FFF" />
                        </Box>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </Box>
    );
};

const styles = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        left: 24,
        bottom: 120,
        zIndex: 60,
    },
    fabShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default ReaderScreen;
