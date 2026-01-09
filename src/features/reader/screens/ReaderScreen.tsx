
import React, { useEffect, useState, useRef } from 'react';
import Toast from 'react-native-toast-message';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions, StatusBar, ActivityIndicator, ScrollView, Platform, Alert, NativeSyntheticEvent, NativeScrollEvent, TextLayoutLine, TextInput, Vibration } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { NotebookPen } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
import * as Haptics from 'expo-haptics';
import { epubService, EpubStructure } from '../utils/EpubService';
import { useReaderSettings } from '../stores/useReaderSettings';
import { ReadingSessionRepository } from '../../../services/database/ReadingSessionRepository';
import { txtService } from '../utils/TxtService'; // Import TxtService
import EpubReader from '../components/EpubReader';
import PdfReader from '../components/PdfReader';
import ReaderControls from '../components/ReaderControls';
import TOCDrawer from '../components/TOCDrawer';
import ContentsModal from '../components/ContentsModal';
import TTSModal from '../components/TTSModal';
import NoteInputModal from '../components/NoteInputModal';
import FontSettingsPanel from '../components/FontSettingsPanel';
import ThemeSettingsPanel, { ReaderThemeMode } from '../components/ThemeSettingsPanel';
import PageTurnButtons from '../components/PageTurnButtons'; // NEW
import { BookmarkRepository } from '../../../services/database/BookmarkRepository';
import { Bookmark, Note } from '../../../services/database/types';
import { NoteRepository } from '../../../services/database/NoteRepository';
import * as Crypto from 'expo-crypto';
import * as Brightness from 'expo-brightness';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const READER_THEMES = {
    light: { bg: '#FFFFFF', text: '#000000' },
    dark: { bg: '#121212', text: '#E0E0E0' },
    warm: { bg: '#F5E6D3', text: '#5D4037' },
    'eye-care': { bg: '#CBE5D3', text: '#1B5E20' },
};

// Helper to handle iOS Sandbox UUID changes
// The app container path changes on every fresh install (dev build), invalidating absolute paths stored in DB.
import { getSafePath } from '../../../utils/PathUtils';

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

    // Track Reading Session
    useEffect(() => {
        const startTime = Date.now();
        return () => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            if (duration > 5 && route.params.bookId) {
                ReadingSessionRepository.createSession(route.params.bookId, duration);
            }
        };
    }, [route.params.bookId]);

    const { bookId } = route.params;
    const { mode, setMode } = useThemeStore();

    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Reading Settings
    const {
        fontSize, setFontSize,
        lineHeight, setLineHeight,
        fontFamily, setFontFamily,
        theme: readerTheme, setTheme: setReaderTheme,
        hapticFeedback,
        flow, setFlow // NEW
    } = useReaderSettings();

    // Legacy local state supports (margin kept local for now or add to store?)
    const [margin, setMargin] = useState(2);
    const [brightness, setBrightness] = useState(1);

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

    // EPUB State
    const [epubStructure, setEpubStructure] = useState<EpubStructure | null>(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

    // UI State
    const [showContents, setShowContents] = useState(false);
    const [contentsTab, setContentsTab] = useState<'contents' | 'bookmarks' | 'notes'>('contents');
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    // showNotes and showBookmarks removed in favor of ContentsModal tabs
    const [showNoteInput, setShowNoteInput] = useState(false); // Add Note Modal
    const [notes, setNotes] = useState<Note[]>([]); // Store notes/highlights
    const [selectedText, setSelectedText] = useState('');
    const [selectedCfi, setSelectedCfi] = useState('');
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
    // PDF State
    const [totalPdfPages, setTotalPdfPages] = useState(0);


    // Refs for tracking progress (mutable)
    const epubRef = useRef<any>(null); // EpubReaderRef
    const scrollPositionRef = useRef(0);

    // ... (rest of refs)

    // ...

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#fff',
        },
        content: {
            flex: 1,
        },
        contentContainer: { // Add this back
            padding: 20,
            paddingBottom: 40
        }
    });
    const contentHeightRef = useRef(0);
    const currentChapterIndexRef = useRef(0);
    const currentChapterScrollRef = useRef(0);

    // TXT Layout Data
    const textLinesRef = useRef<TextLayoutLine[]>([]);


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

            loadChapter(currentChapterIndex);
        }
    }, [currentChapterIndex, epubStructure]);

    const loadBook = async () => {
        try {

            let bookData = await BookRepository.getById(bookId);
            if (!bookData) {
                throw new Error('Book not found');
            }

            // Fix path for iOS Sandbox rotation
            const safePath = getSafePath(bookData.filePath);

            // Create a mutable copy or just verify logic works with this
            // We need to update bookData object so that subsequent logic uses the safe path
            bookData = { ...bookData, filePath: safePath };

            setBook(bookData);

            if (bookData.fileType === 'epub') {
                // Load EPUB Structure
                try {
                    await epubService.unzipBook(bookData.filePath, bookId);

                    const structure = await epubService.parseBook(bookId);
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

            } else if (bookData.fileType === 'pdf') {
                // PDF Loading - handled by PdfReader component via URI
                // Just restore progress state
                setCurrentChapterIndex(bookData.currentChapterIndex || 1); // For PDF, repurpose currentChapterIndex as Page Number
                setLoading(false);
            } else {
                // TXT Loading
                const fileInfo = await FileSystem.getInfoAsync(bookData.filePath);
                if (!fileInfo.exists) throw new Error('File does not exist');

                const fileSize = fileInfo.size || 0;
                const LARGE_FILE_THRESHOLD = 2 * 1024 * 1024; // 2MB

                if (fileSize > LARGE_FILE_THRESHOLD) {
                    // Large File: Virtual Pagination
                    // Chunk size: 50KB to be safe? 100KB?
                    // Let's use 30KB for performance safety on old devices
                    const CHUNK_SIZE = 30 * 1024;
                    const virtualChapters = txtService.getVirtualChapters(fileSize, CHUNK_SIZE);

                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: virtualChapters, // Use fragments as spine
                        toc: virtualChapters
                    });

                    // Restore Progress (Chapter Index = Chunk Index)
                    setCurrentChapterIndex(bookData.currentChapterIndex || 0);
                    currentChapterIndexRef.current = bookData.currentChapterIndex || 0;

                    // Trigger load of first chunk
                    // loadChapter logic will need to handle txtchunk:// protocol
                    // We set loading false afterwards? 
                    // Wait, loadChapter is triggered by effect on currentChapterIndex change?
                    // Yes, but initial load might need manual trigger if index is 0 and effect runs? 
                    // Effect runs on mount, but we just set it. 

                } else {
                    // Small File: Load All
                    const fileContent = await FileSystem.readAsStringAsync(bookData.filePath);
                    setContent(fileContent);

                    const txtChapters = txtService.parseChapters(fileContent);
                    console.log('[Reader] TXT Chapters parsed:', txtChapters.length);

                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: [], // Use empty spine for "One Big Page" mode
                        toc: txtChapters
                    });

                    // Restore TXT scroll for single-page mode
                    setTimeout(() => {
                        if (scrollViewRef.current && (bookData?.readingPosition || 0) > 0) {
                            scrollViewRef.current.scrollTo({
                                y: bookData?.readingPosition || 0,
                                animated: false,
                            });
                        }
                    }, 100);
                }
                setLoading(false);
            }

            // Update last read
            await BookRepository.update(bookId, { lastRead: Date.now() });

            // Load Notes
            loadNotes();

        } catch (error) {
            console.error('[Reader] Error loading book:', error);
            Alert.alert('Error', 'Failed to load book');
            setLoading(false);
            navigation.goBack();
        }
    };

    const loadChapter = async (index: number) => {
        if (!epubStructure || (!epubStructure.spine[index] && book?.fileType === 'epub')) {
            // Only warn if it's EPUB and index is invalid. 
            // For TXT small files, spine is empty, so we ignore.
            // For TXT large files, we populated spine.
            if (book?.fileType === 'epub') console.warn('[Reader] Invalid chapter index:', index);
            return;
        }

        // Check if we are in Large TXT mode
        const chapter = epubStructure.spine[index];
        if (chapter && chapter.href && chapter.href.startsWith('txtchunk://')) {
            setLoading(true);
            try {
                // Parse txtchunk://START?len=LENGTH
                const url = chapter.href;
                const startStr = url.split('txtchunk://')[1].split('?')[0];
                const lenStr = url.split('len=')[1];

                const position = parseInt(startStr, 10);
                const length = parseInt(lenStr, 10);

                if (book?.filePath) {
                    // Read Partial
                    // readAsStringAsync supports options: { encoding, length, position }
                    const chunk = await FileSystem.readAsStringAsync(book.filePath, {
                        length,
                        position,
                        encoding: FileSystem.EncodingType.UTF8
                    });
                    setContent(chunk);

                    // Reset scroll to top for new chunk
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({ y: 0, animated: false });
                    }
                }
            } catch (e) {
                console.error('[Reader] Chunk load failed', e);
            } finally {
                setLoading(false);
            }
            return;
        }

        // EPUB Logic
        if (book?.fileType === 'epub') {
            setLoading(true);
            try {

                const html = await epubService.getChapterContent(chapter.href);
                setContent(html);
            } catch (e) {
                console.error('[Reader] Chapter load failed', e);
            } finally {
                setLoading(false);
            }
        }
    };



    const loadNotes = async () => {
        try {
            const data = await NoteRepository.getByBookId(bookId);
            setNotes(data);
        } catch (e) {
            console.error('Failed to load notes', e);
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
            } else if (book.fileType === 'pdf') {
                // PDF Save
                // Repurpose currentChapterIndex as Page Number
                await BookRepository.update(bookId, {
                    currentChapterIndex: currentChapterIndexRef.current, // Current Page
                    totalChapters: totalPdfPages, // Total Pages
                    progress: totalPdfPages > 0 ? (currentChapterIndexRef.current / totalPdfPages) * 100 : 0,
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

    // Handle Text Layout to map char offsets to Y positions
    const handleTextLayout = (e: { nativeEvent: { lines: TextLayoutLine[] } }) => {
        textLinesRef.current = e.nativeEvent.lines;
        console.log('[Reader] Text layout calculated, lines:', e.nativeEvent.lines.length);
    };

    /**
     * Convert character index to Scroll Y position
     */
    const getScrollYFromCharIndex = (charIndex: number): number => {
        const lines = textLinesRef.current;
        if (!lines || lines.length === 0) return 0;

        // Find line containing this char index
        // Since lines are ordered, we can do binary search or simpler find
        // Each line has 'text' property, we can accumulate lengths?
        // Actually TextLayoutLine usually has { text, x, y, width, height, capHeight, ascender, descender }
        // It does NOT explicitly give startCharIndex. We have to sum up lengths.

        // Optimize: Calculate line start indexes once if performance is bad.
        // For now, linear scan.
        let currentIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].text.length; // Approximate, might include newline?
            // React Native Text ensures lines match content.

            if (charIndex >= currentIndex && charIndex < currentIndex + lineLength) {
                return lines[i].y;
            }
            currentIndex += lineLength;
        }

        // If out of bounds (end), return last line y
        return lines[lines.length - 1].y;
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
        if (hapticFeedback) {
            Vibration.vibrate(10);
        }
        if (epubStructure && currentChapterIndex < epubStructure.spine.length - 1) {
            const next = currentChapterIndex + 1;
            setCurrentChapterIndex(next);
            currentChapterIndexRef.current = next;
            currentChapterScrollRef.current = 0;
            saveProgress();
        }
    };

    const handlePrevChapter = () => {
        if (hapticFeedback) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
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

        // TXT Handling
        if (href.startsWith('txt://')) {
            const offset = parseInt(href.replace('txt://', ''), 10);
            const targetY = getScrollYFromCharIndex(offset);
            console.log(`[Reader] Jumping to TXT offset ${offset} -> Y: ${targetY}`);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });

            // Auto update current chapter index logic could go here, 
            // but for now we rely on scroll position saving.
            // We could find which chapter index corresponds to this href and update state
            const index = epubStructure.toc.findIndex(c => c.href === href);
            if (index !== -1) setCurrentChapterIndex(index);

            return;
        }

        // EPUB Handling with react-reader
        if (book?.fileType === 'epub' && epubRef.current) {
            console.log('[Reader] Jumping to location:', href);
            // react-reader's goToLocation can accept href or CFI
            epubRef.current.goToLocation(href);
            setShowContents(false); // Close TOC
        }
    };



    /**
     * Save Bookmark
     */
    const handleAddBookmark = async () => {
        if (!book) return;

        try {
            const bookmark: Bookmark = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                percentage: book.progress || 0, // Fallback
                createdAt: Date.now(),
                previewText: `Bookmark at ${new Date().toLocaleTimeString()}`
            };

            if (book.fileType === 'epub') {
                bookmark.cfi = JSON.stringify({
                    chapterIndex: currentChapterIndexRef.current,
                    percentage: currentChapterScrollRef.current
                });
                bookmark.percentage = ((currentChapterIndexRef.current + currentChapterScrollRef.current) / (epubStructure?.spine.length || 1)) * 100;
                bookmark.previewText = epubStructure?.spine[currentChapterIndexRef.current]?.label || `Chapter ${currentChapterIndexRef.current + 1}`;
            } else if (book.fileType === 'pdf') {
                bookmark.page = currentChapterIndexRef.current; // Page Number
                bookmark.percentage = totalPdfPages > 0 ? (bookmark.page / totalPdfPages) * 100 : 0;
                bookmark.previewText = `Page ${bookmark.page}`;
            } else { // txt
                bookmark.offset = scrollPositionRef.current;
                bookmark.percentage = contentHeightRef.current > 0 ? (scrollPositionRef.current / contentHeightRef.current) * 100 : 0;
                bookmark.previewText = `Progress ${bookmark.percentage.toFixed(1)}%`;
            }

            await BookmarkRepository.create(bookmark);
            if (hapticFeedback) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Toast.show({
                type: 'success',
                text1: 'Bookmark saved'
            });
        } catch (e) {
            console.error('Failed to save bookmark', e);
            Toast.show({
                type: 'error',
                text1: 'Failed to save bookmark'
            });
        }
    };

    const handleSelectBookmark = (bookmark: Bookmark) => {
        setShowContents(false); // Close contents modal
        // Logic to jump
        if (book?.fileType === 'epub' && bookmark.cfi) {
            const data = JSON.parse(bookmark.cfi);
            // data.chapterIndex, data.percentage
            // We need to implement accurate jump logic for this
            setCurrentChapterIndex(data.chapterIndex);
            currentChapterIndexRef.current = data.chapterIndex;
            currentChapterScrollRef.current = data.percentage;
            // Ideally we trigger scroll after render... 
            // Currently loadChapter resets scroll to 0/initial. 
            // We might need to pass initialScrollPercentage to EpubReader
        } else if (book?.fileType === 'pdf' && bookmark.page) {
            setCurrentChapterIndex(bookmark.page); // It triggers re-render of PDF with new page
        } else if (book?.fileType === 'txt' && bookmark.offset !== undefined) {
            scrollViewRef.current?.scrollTo({ y: bookmark.offset, animated: true });
        }
    };

    /**
     * Handlers for Selection & Notes
     */
    const handleSelection = (text: string, cfi: string, rect: any) => {
        if (!text) return;
        console.log('[Reader] Selection:', text);
        setSelectedText(text);
        setSelectedCfi(cfi);
        // Automatically open Note Input for now
        setShowNoteInput(true);
    };

    const handleSaveNote = async (content: string, color: string) => {
        if (!book) return;

        // Determine if it's a free note or attached to selection
        const cfiToSave = selectedCfi || `chapter:${currentChapterIndexRef.current}`; // Fallback for free notes
        // Note: For EPUB, we might want a Better way to get current Cfi if not selected. 
        // But for now, ensuring it saves is priority.

        const type = (content && content.trim().length > 0) ? 'note' : 'highlight';

        try {
            const newNote: Note = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                cfi: cfiToSave,
                fullText: selectedText || '', // Selected text (quote)
                note: content, // User's thought
                color,
                type,
                createdAt: Date.now()
            };

            await NoteRepository.create(newNote);
            Toast.show({
                type: 'success',
                text1: type === 'note' ? 'Note saved' : 'Highlight saved'
            });

            // Cleanup
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

    if (loading && !content) {
        return (
            <Box flex={1} justifyContent="center" alignItems="center" backgroundColor="background">
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </Box>
        );
    }

    return (
        <Box flex={1} backgroundColor="mainBackground">
            <StatusBar hidden={!showControls} showHideTransition="fade" />

            <Box
                flex={1}
                width="100%"
                style={{
                    paddingTop: stableInsets.top,
                    paddingBottom: stableInsets.bottom,
                }}
            >
                {book?.fileType === 'epub' ? (
                    <EpubReader
                        ref={epubRef}
                        url={book.filePath}
                        theme={theme}
                        themeMode={mode === 'dark' ? 'dark' : 'light'}
                        customTheme={
                            (readerTheme === 'warm' || readerTheme === 'eye-care')
                                ? READER_THEMES[readerTheme]
                                : undefined
                        }
                        fontSize={fontSize}
                        fontFamily={fontFamily}

                        // Pass highlights
                        // highlights={notes.map(n => ({ cfi: n.cfi, color: n.color, id: n.id }))} // TODO: Re-implement highlights with React Reader

                        // Location handling
                        location={undefined} // TODO: Load saved CFI from database
                        onLocationChange={(cfi: string) => {
                            console.log('Location Changed:', cfi);
                            // Save progress with CFI
                            if (book) {
                                const now = Date.now();
                                if (now - lastSaveTimeRef.current > 5000) {
                                    lastSaveTimeRef.current = now;
                                    // Save CFI to book progress
                                    // TODO: Add lastPositionCfi field to Book schema
                                    BookRepository.update(book.id, {
                                        lastRead: now,
                                        // lastPositionCfi: cfi,
                                    }).catch(e => console.error('[Reader] Failed to save progress:', e));
                                }
                            }
                        }}

                        onPress={toggleControls}
                        insets={{
                            top: stableInsets.top,
                            bottom: stableInsets.bottom,
                            left: stableInsets.left,
                            right: stableInsets.right
                        }}
                        flow={flow}
                    />
                ) : book?.fileType === 'pdf' ? (
                    <PdfReader
                        uri={book.filePath}
                        initialPage={currentChapterIndexRef.current > 0 ? currentChapterIndexRef.current : 1}
                        onPageChanged={(page, numberOfPages) => {
                            currentChapterIndexRef.current = page;
                            if (totalPdfPages !== numberOfPages) setTotalPdfPages(numberOfPages);

                            // Throttled Save
                            const now = Date.now();
                            if (now - lastSaveTimeRef.current > 5000) {
                                lastSaveTimeRef.current = now;
                                saveProgress();
                            }
                        }}
                        onLoadComplete={(numberOfPages) => {
                            setTotalPdfPages(numberOfPages);
                        }}
                        onPress={toggleControls}
                        themeMode={mode === 'dark' ? 'dark' : 'light'}
                    />
                ) : (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.container}
                        contentContainerStyle={[
                            styles.contentContainer,
                            // Standard padding, no need for safe area addition here as parent has it
                            { paddingTop: 20, paddingBottom: 40 }
                        ]}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                variant="body"
                                style={{ fontSize: fontSize, lineHeight: fontSize * lineHeight, color: theme.colors.textPrimary }}
                                selectable
                                onPress={toggleControls}
                                onTextLayout={handleTextLayout}
                            >
                                {content}
                            </Text>
                        </View>
                    </ScrollView>
                )}
            </Box>

            {/* 2. Controls Layers */}
            {/* Controls Overlay */}
            <ReaderControls
                visible={showControls}
                onClose={handleClose}
                onTTS={() => setShowTTS(true)}
                onAddBookmark={handleAddBookmark}
                onTOC={() => setShowContents(true)}
                onNotes={() => {
                    // Open Notes list? The user wants "Directory" drawer to NOT have notes.
                    // So we likely need a separate modal for Notes/Bookmarks or just hide it for now.
                    // I'll keep using ContentsModal logic for THIS button if it exists, or remove it?
                    // User didn't say remove Notes button.
                    // I'll temporarily map it to nothing or an alert, or leave it as is but it won't be in the Drawer.
                    Alert.alert("Todo", "Notes view separate from TOC");
                }}
                onViewBookmarks={() => {
                    setShowControls(false);
                }}
                onTheme={() => {
                    setShowThemePanel(prev => !prev);
                    setShowFontPanel(false);
                }}
                onFont={() => {
                    setShowFontPanel(prev => !prev);
                    setShowThemePanel(false);
                }}
                onToggleFlow={() => setFlow(flow === 'paginated' ? 'scrolled' : 'paginated')}
                flow={flow}
                insets={stableInsets}
                title={book?.title}
            />

            {/* Page Turn Buttons (Only visible when controls are hidden) */}
            <PageTurnButtons
                visible={!showControls}
                flow={flow}
                onPrev={() => epubRef.current?.turnPage('prev')}
                onNext={() => epubRef.current?.turnPage('next')}
            />

            {/* 3. Settings & Drawers */}
            <TOCDrawer
                visible={showContents}
                onClose={() => setShowContents(false)}
                chapters={epubStructure?.toc || []}
                currentHref={epubStructure?.spine[currentChapterIndex]?.href}
                onSelectChapter={handleSelectChapter}
            />

            {/* Panels */}
            {/* Font Settings Panel rendered based on showFontPanel */}
            <FontSettingsPanel
                visible={showFontPanel}
                fontSize={fontSize} setFontSize={setFontSize}
                lineHeight={lineHeight} setLineHeight={setLineHeight}
                margin={margin} setMargin={setMargin}
                fontFamily={fontFamily} setFontFamily={setFontFamily}
                bottomOffset={80} // Adjust based on footer height
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
            />

            {/* Fixed Left Note Button (Visible when controls are hidden or shown? Usually shown with controls to avoid distraction, but user said 'fixed'. Let's show with controls for now to keep reading clean, or if user implied 'always accessible'...) 
                Actually, 'fixed' often means 'docked'. I'll put it in the Controls layer context but outside the main bars.
            */}
            {showControls && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={{
                        position: 'absolute',
                        left: 24,
                        bottom: Platform.OS === 'ios' ? stableInsets.bottom + 100 : 100,
                        zIndex: 60
                    }}
                >
                    <TouchableOpacity
                        onPress={() => setShowNoteInput(true)}
                        style={{
                            width: 44,
                            height: 44,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
                            borderRadius: 22,
                            // Minimal shadow
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 3
                        }}
                    >
                        <Ionicons name="add" size={28} color="#FFF" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            <NoteInputModal
                visible={showNoteInput}
                onClose={() => setShowNoteInput(false)}
                onSubmit={handleSaveNote}
                selectedText={selectedText}
            />
        </Box>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    }
});

export default ReaderScreen;
