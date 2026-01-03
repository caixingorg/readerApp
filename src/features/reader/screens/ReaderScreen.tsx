import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Alert, StatusBar } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import hooks for insets
import ScreenLayout from '../../../components/ScreenLayout';
import Box from '../../../components/Box';
import Text from '../../../components/Text';
import { Theme } from '../../../theme/theme';
import { RootStackParamList } from '../../../types/navigation';
import { BookRepository } from '../../../services/database/BookRepository';
import { Book } from '../../../services/database/types';
import { useThemeStore } from '../../../stores/useThemeStore';
import { epubService, EpubStructure } from '../utils/EpubService';
import EpubReader from '../components/EpubReader';
import TOCDrawer from '../components/TOCDrawer';
import NotesModal from '../components/NotesModal';
import TTSModal from '../components/TTSModal';
import FontSettingsPanel from '../components/FontSettingsPanel';
import ThemeSettingsPanel, { ReaderThemeMode } from '../components/ThemeSettingsPanel';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const READER_THEMES = {
    light: { bg: '#FFFFFF', text: '#000000' },
    dark: { bg: '#121212', text: '#E0E0E0' },
    warm: { bg: '#F5E6D3', text: '#5D4037' },
    'eye-care': { bg: '#CBE5D3', text: '#1B5E20' },
};

// Helper to handle iOS Sandbox UUID changes
// The app container path changes on every fresh install (dev build), invalidating absolute paths stored in DB.
const getSafePath = (storedPath: string): string => {
    if (!storedPath) return '';

    // If it's already a file:// URI, proceed
    // We assume mostly relative paths would be better, but we have legacy absolute paths.
    // Strategy: If path contains '/Documents/books/', replace everything before it with current documentDirectory.
    // If path contains '/Library/Caches/books/', replace with cacheDirectory (or documentDirectory if that's where we put cache).

    // Our logic uses FileSystem.documentDirectory + 'books/' for "My Books" (TXT/Imported).
    // And Epubs are unzipped to cache or documents.

    // Check if it's potentially an internal file
    if (storedPath.includes('/books/')) {
        const fileName = storedPath.split('/books/').pop();
        if (fileName) {
            // Reconstruct path using CURRENT sandbox location
            return FileSystem.documentDirectory + 'books/' + fileName;
        }
    }

    return storedPath;
};

const ReaderScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation();
    const route = useRoute<ReaderScreenRouteProp>();
    const insets = useSafeAreaInsets();
    const [stableInsets, setStableInsets] = useState(insets);

    useEffect(() => {
        if (insets.top > 0) {
            setStableInsets(insets);
        }
    }, [insets]);

    const { bookId } = route.params;
    const { mode, setMode } = useThemeStore();

    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Reading Settings
    const [fontSize, setFontSize] = useState(18);
    const [readerTheme, setReaderTheme] = useState<ReaderThemeMode>(mode === 'dark' ? 'dark' : 'light');

    // EPUB State
    const [epubStructure, setEpubStructure] = useState<EpubStructure | null>(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

    // UI State
    const [showContents, setShowContents] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showTTS, setShowTTS] = useState(false);
    const [showControls, setShowControls] = useState(true);

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
        // Sync app theme if it's light/dark, otherwise keep app theme distinct or force light?
        // Usually reading theme is local, but let's sync basic light/dark
        if (newMode === 'dark') setMode('dark');
        else setMode('light'); // warm/eye-care are light-based app themes
    };

    const scrollViewRef = useRef<ScrollView>(null);
    const lastSaveTimeRef = useRef<number>(0);

    // Refs for tracking progress (mutable)
    const scrollPositionRef = useRef(0);
    const contentHeightRef = useRef(0);
    const currentChapterIndexRef = useRef(0);
    const currentChapterScrollRef = useRef(0);

    useEffect(() => {
        loadBook();
        return () => {
            // Save on unmount
            saveProgress();
        };
    }, [bookId]);

    // Load Chapter Content (EPUB)
    useEffect(() => {
        if (book?.fileType === 'epub' && epubStructure) {
            console.log('[Reader] Loading chapter:', currentChapterIndex);
            loadChapter(currentChapterIndex);
        }
    }, [currentChapterIndex, epubStructure]);

    const loadBook = async () => {
        try {
            console.log('[Reader] loadBook started for:', bookId);
            let bookData = await BookRepository.getById(bookId);
            if (!bookData) {
                throw new Error('Book not found');
            }

            // Fix path for iOS Sandbox rotation
            const safePath = getSafePath(bookData.filePath);
            console.log('[Reader] Path correction:', bookData.filePath, '->', safePath);

            // Create a mutable copy or just verify logic works with this
            // We need to update bookData object so that subsequent logic uses the safe path
            bookData = { ...bookData, filePath: safePath };

            setBook(bookData);
            console.log('[Reader] Book data loaded:', bookData.title, bookData.fileType);

            if (bookData.fileType === 'epub') {
                // Load EPUB Structure
                try {
                    console.log('[Reader] Unzipping/Checking EPUB:', bookData.filePath);
                    await epubService.unzipBook(bookData.filePath, bookId);

                    console.log('[Reader] Parsing EPUB structure...');
                    const structure = await epubService.parseBook(bookId);
                    console.log('[Reader] EPUB Structure parsed. Spine length:', structure.spine.length);
                    setEpubStructure(structure);

                    // Restore progress
                    setCurrentChapterIndex(bookData.currentChapterIndex || 0);
                    currentChapterIndexRef.current = bookData.currentChapterIndex || 0;
                    currentChapterScrollRef.current = bookData.currentScrollPosition || 0;
                } catch (e) {
                    console.error('[Reader] EPUB Load Error:', e);
                    Alert.alert('Error', 'Failed to load EPUB');
                }
                setLoading(false);

            } else {
                // TXT Loading
                const fileContent = await FileSystem.readAsStringAsync(bookData.filePath);
                setContent(fileContent);
                setLoading(false);

                // Restore TXT scroll
                setTimeout(() => {
                    if (scrollViewRef.current && bookData.readingPosition > 0) {
                        scrollViewRef.current.scrollTo({
                            y: bookData.readingPosition,
                            animated: false,
                        });
                    }
                }, 100);
            }

            // Update last read
            await BookRepository.update(bookId, { lastRead: Date.now() });

        } catch (error) {
            console.error('[Reader] Error loading book:', error);
            Alert.alert('Error', 'Failed to load book');
            setLoading(false);
            navigation.goBack();
        }
    };

    const loadChapter = async (index: number) => {
        if (!epubStructure || !epubStructure.spine[index]) {
            console.warn('[Reader] Invalid chapter index:', index);
            return;
        }
        setLoading(true);
        try {
            const chapter = epubStructure.spine[index];
            console.log('[Reader] Fetching chapter content from:', chapter.href); // Debugging
            const html = await epubService.getChapterContent(chapter.href);
            setContent(html);
        } catch (e) {
            console.error('[Reader] Chapter load failed', e);
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async () => {
        if (!book) return;
        try {
            if (book.fileType === 'epub') {
                // Calculate total progress
                const totalChapters = epubStructure?.spine.length || 1;
                const progress = ((currentChapterIndexRef.current + currentChapterScrollRef.current) / totalChapters) * 100;

                await BookRepository.update(bookId, {
                    currentChapterIndex: currentChapterIndexRef.current,
                    currentScrollPosition: currentChapterScrollRef.current,
                    progress,
                    lastRead: Date.now()
                });
            } else {
                // TXT Save
                const progress = contentHeightRef.current > 0 ? (scrollPositionRef.current / contentHeightRef.current) * 100 : 0;
                await BookRepository.update(bookId, {
                    readingPosition: Math.round(scrollPositionRef.current),
                    progress,
                    lastRead: Date.now()
                });
            }
        } catch (error) {
            console.error('[Reader] Failed to save progress:', error);
        }
    };

    // TXT Scroll Handler
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollPositionRef.current = contentOffset.y;
        contentHeightRef.current = contentSize.height - layoutMeasurement.height;

        // Auto-save throttling
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    // EPUB Handlers
    const handleEpubScroll = (percentage: number) => {
        currentChapterScrollRef.current = percentage;
        // Auto-save throttling
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    const handleNextChapter = () => {
        if (epubStructure && currentChapterIndex < epubStructure.spine.length - 1) {
            const next = currentChapterIndex + 1;
            setCurrentChapterIndex(next);
            currentChapterIndexRef.current = next;
            currentChapterScrollRef.current = 0;
            saveProgress();
        }
    };

    const handlePrevChapter = () => {
        if (currentChapterIndex > 0) {
            const prev = currentChapterIndex - 1;
            setCurrentChapterIndex(prev);
            currentChapterIndexRef.current = prev;
            currentChapterScrollRef.current = 0; // Or 1.0 if we want to go to bottom?
            saveProgress();
        }
    };

    const handleClose = async () => {
        saveProgress();
        navigation.goBack();
    };

    const handleSelectChapter = (href: string) => {
        if (!epubStructure) return;
        const index = epubStructure.spine.findIndex(c => href.includes(c.href) || c.href.includes(href));
        if (index !== -1) {
            console.log('[Reader] Jumping to chapter:', index, href);
            setCurrentChapterIndex(index);
            currentChapterIndexRef.current = index;
            currentChapterScrollRef.current = 0;
            saveProgress();
        } else {
            console.warn('[Reader] Chapter not found in spine for href:', href);
        }
    };



    if (loading && !content) {
        return (
            <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="background">
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </Box>
        );
    }

    return (
        <Box flex={1} backgroundColor="background">
            <StatusBar hidden={!showControls} showHideTransition="fade" />

            {/* 1. Content Layer (Constrained to Safe Area) */}
            <Box
                flex={1}
                style={{
                    marginTop: stableInsets.top,
                    marginBottom: stableInsets.bottom
                }}
            >
                {book?.fileType === 'epub' ? (
                    <EpubReader
                        content={content}
                        theme={theme}
                        themeMode={mode === 'dark' ? 'dark' : 'light'}
                        customTheme={READER_THEMES[readerTheme]} // Pass explicit colors
                        fontSize={fontSize}
                        baseUrl={
                            epubStructure?.spine[currentChapterIndex]?.href
                                ? epubStructure.spine[currentChapterIndex].href.substring(0, epubStructure.spine[currentChapterIndex].href.lastIndexOf('/') + 1)
                                : undefined
                        }
                        onScroll={handleEpubScroll}
                        onNextChapter={handleNextChapter}
                        onPrevChapter={handlePrevChapter}
                        onPress={toggleControls}
                        initialScrollPercentage={currentChapterScrollRef.current}
                        // We are now handling safe area via container margins, 
                        // so we might not need extra massive padding inside, 
                        // but a little bit of standard padding is good.
                        insets={{ top: 0, bottom: 0 }}
                    />
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.container}
                        contentContainerStyle={[
                            styles.contentContainer,
                            styles.contentContainer,
                            // Standard padding, no need for safe area addition here as parent has it
                            { paddingTop: 20, paddingBottom: 40 }
                        ]}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <Text
                            style={{
                                fontSize,
                                lineHeight: fontSize * 1.5,
                                color: theme.colors.text,
                            }}
                            onPress={toggleControls}
                        >
                            {content}
                        </Text>
                    </ScrollView>
                )}
            </Box>

            {/* 2. Controls Layers */}
            {showControls && (
                <>
                    {/* Header Overlay */}
                    <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        paddingHorizontal="m"
                        paddingBottom="s"
                        backgroundColor="background"
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ paddingTop: (stableInsets.top || 40) + 10 }} // Safe Area + 10px spacing
                    >
                        <Ionicons
                            name="chevron-back"
                            size={28}
                            color={theme.colors.text}
                            onPress={handleClose}
                        />
                        <Ionicons
                            name="headset-outline" // Voice
                            size={24}
                            color={theme.colors.text}
                            onPress={() => setShowTTS(true)}
                        />
                    </Box>

                    {/* Footer Overlay */}
                    <Box
                        position="absolute"
                        bottom={0}
                        left={0}
                        right={0}
                        paddingHorizontal="m"
                        paddingTop="m"
                        backgroundColor="background"
                        borderTopWidth={1}
                        borderTopColor="border"
                        style={{ paddingBottom: (stableInsets.bottom || 20) + 10 }} // Safe Area + 10px spacing
                    >
                        {/* Buttons Row */}
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" paddingHorizontal="l">
                            <Ionicons
                                name="list" // TOC
                                size={24}
                                color={theme.colors.text}
                                onPress={() => setShowContents(true)}
                            />

                            <Ionicons
                                name="create-outline" // Notes
                                size={24}
                                color={theme.colors.text}
                                onPress={() => setShowNotes(true)}
                            />

                            <Ionicons
                                name="sunny-outline" // Theme
                                size={24}
                                color={theme.colors.text}
                                onPress={() => {
                                    setShowThemePanel(!showThemePanel);
                                    setShowFontPanel(false); // Close other
                                }}
                            />

                            <Ionicons
                                name="text-outline" // Font
                                size={24}
                                color={theme.colors.text}
                                onPress={() => {
                                    setShowFontPanel(!showFontPanel);
                                    setShowThemePanel(false); // Close other
                                }}
                            />
                        </Box>
                    </Box>
                </>
            )}

            {book?.fileType === 'epub' && epubStructure && (
                <TOCDrawer
                    visible={showContents}
                    onClose={() => setShowContents(false)}
                    chapters={epubStructure.toc}
                    currentHref={epubStructure.spine[currentChapterIndex]?.href}
                    onSelectChapter={handleSelectChapter}
                />
            )}

            {/* Panels (No Overlay) */}
            {/* Footer approximate height calculation: paddingTop(m=16) + Icon(24) + paddingBottom(insets+10) */}
            <ThemeSettingsPanel
                visible={showThemePanel}
                currentMode={readerTheme}
                onSelectMode={handleThemeChange}
                bottomOffset={16 + 24 + (stableInsets.bottom || 20) + 10}
            />

            <FontSettingsPanel
                visible={showFontPanel}
                fontSize={fontSize}
                setFontSize={setFontSize}
                bottomOffset={16 + 24 + (stableInsets.bottom || 20) + 10}
            />

            <NotesModal
                visible={showNotes}
                onClose={() => setShowNotes(false)}
            />

            <TTSModal
                visible={showTTS}
                onClose={() => setShowTTS(false)}
                content={content}
            />
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
});

export default ReaderScreen;
