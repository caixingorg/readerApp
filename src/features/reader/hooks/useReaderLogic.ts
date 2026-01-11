import { useState, useRef, useEffect, useCallback } from 'react';
import { TextLayoutLine, Vibration, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Brightness from 'expo-brightness';
import { useTranslation } from 'react-i18next';
import { BookRepository } from '@/services/database/BookRepository';
import { ReadingSessionRepository } from '@/services/database/ReadingSessionRepository';
import { NoteRepository } from '@/services/database/NoteRepository';
import { BookmarkRepository } from '@/services/database/BookmarkRepository'; // Added
import { Book, Note, Bookmark } from '@/services/database/types';
import { useThemeStore } from '@/stores/useThemeStore';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { epubService, EpubStructure } from '@/features/reader/utils/EpubService';
import { txtService } from '@/features/reader/utils/TxtService';
import { getSafePath } from '@/utils/PathUtils';
import { RootStackParamList } from '@/types/navigation';
import * as Crypto from 'expo-crypto';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

export const useReaderLogic = () => {
    const route = useRoute<ReaderScreenRouteProp>();
    const navigation = useNavigation();
    const { bookId } = route.params;
    const { setMode } = useThemeStore();
    const { t } = useTranslation();

    // Reader Settings
    const {
        fontSize,
        setFontSize,
        lineHeight,
        setLineHeight,
        fontFamily,
        setFontFamily,
        theme: readerTheme,
        setTheme: setReaderTheme,
        hapticFeedback,
        flow,
        setFlow,
    } = useReaderSettings();

    // Core State
    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [epubStructure, setEpubStructure] = useState<EpubStructure | null>(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    // Note: initialLocationHref removed - we now use currentChapterIndex (number) directly
    const [notes, setNotes] = useState<Note[]>([]);

    // PDF State
    const [totalPdfPages, setTotalPdfPages] = useState(0);

    // Refs
    const epubRef = useRef<any>(null);
    const scrollViewRef = useRef<any>(null);
    const currentChapterIndexRef = useRef(0);
    const currentChapterScrollRef = useRef(0);
    const lastSaveTimeRef = useRef<number>(0);
    const scrollPositionRef = useRef(0);
    const contentHeightRef = useRef(0);
    const pathPrefixRef = useRef<string>('');
    const currentCfiRef = useRef<string | undefined>(undefined);
    const textLinesRef = useRef<TextLayoutLine[]>([]);
    const bookRef = useRef<Book | null>(null);

    // 标记 loadBook 是否已完成（用于 onReady 判断时机）
    const bookLoadedRef = useRef(false);

    // Keep bookRef synced
    useEffect(() => {
        bookRef.current = book;
    }, [book]);

    // --- Loading Logic ---

    useEffect(() => {
        const startTime = Date.now();
        return () => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            if (duration > 5 && bookId) {
                ReadingSessionRepository.createSession(bookId, duration);
            }
        };
    }, [bookId]);

    useEffect(() => {
        loadBook();
        return () => {
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
            if (!bookData) throw new Error('Book not found');

            // Fix path for iOS Sandbox rotation
            const safePath = getSafePath(bookData.filePath);
            bookData = { ...bookData, filePath: safePath };
            setBook(bookData);

            if (bookData.fileType === 'epub') {
                await epubService.unzipBook(bookData.filePath, bookId);
                const structure = await epubService.parseBook(bookId);
                setEpubStructure(structure);

                const savedChapterIndex = bookData.currentChapterIndex || 0;
                console.warn('[🔍 Stage 1: Load] Loaded chapter index from DB:', savedChapterIndex);
                setCurrentChapterIndex(savedChapterIndex);
                currentChapterIndexRef.current = savedChapterIndex;
                currentChapterScrollRef.current = bookData.currentScrollPosition || 0;

                // Note: We no longer need to resolve HREF - currentChapterIndex (number) is used directly for navigation
                console.log(`[🔍 Stage 1: Load] Loaded chapter index: ${savedChapterIndex}`);

                // 标记书籍加载完成
                bookLoadedRef.current = true;
                // currentCfiRef.current = bookData.lastPositionCfi; // Restore CFI ref if needed in future
            } else if (bookData.fileType === 'pdf') {
                setCurrentChapterIndex(bookData.currentChapterIndex || 1);
                setLoading(false);
            } else {
                // TXT Loading
                const fileInfo = await FileSystem.getInfoAsync(bookData.filePath);
                if (!fileInfo.exists) throw new Error('File does not exist');
                const fileSize = fileInfo.size || 0;

                // 2MB Threshold
                if (fileSize > 2 * 1024 * 1024) {
                    const CHUNK_SIZE = 30 * 1024;
                    const virtualChapters = txtService.getVirtualChapters(fileSize, CHUNK_SIZE);
                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: virtualChapters,
                        toc: virtualChapters,
                    });
                    setCurrentChapterIndex(bookData.currentChapterIndex || 0);
                    currentChapterIndexRef.current = bookData.currentChapterIndex || 0;
                } else {
                    const fileContent = await FileSystem.readAsStringAsync(bookData.filePath);
                    setContent(fileContent);
                    const txtChapters = txtService.parseChapters(fileContent);
                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: [],
                        toc: txtChapters,
                    });
                    // Restore TXT scroll
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
            const loadedNotes = await NoteRepository.getByBookId(bookId);
            setNotes(loadedNotes);
        } catch (error) {
            console.error('[Reader] Error loading book:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load book',
                visibilityTime: 3000,
                position: 'top',
            });
            setLoading(false);
            navigation.goBack();
        }
    };

    const loadChapter = async (index: number) => {
        if (!epubStructure || (!epubStructure.spine[index] && book?.fileType === 'epub')) {
            return;
        }

        const chapter = epubStructure.spine[index];

        // Large TXT Chunk logic
        if (chapter && chapter.href && chapter.href.startsWith('txtchunk://')) {
            setLoading(true);
            try {
                const url = chapter.href;
                const startStr = url.split('txtchunk://')[1].split('?')[0];
                const lenStr = url.split('len=')[1];
                const position = parseInt(startStr, 10);
                const length = parseInt(lenStr, 10);

                if (book?.filePath) {
                    const chunk = await FileSystem.readAsStringAsync(book.filePath, {
                        length,
                        position,
                        encoding: FileSystem.EncodingType.UTF8,
                    });
                    setContent(chunk);
                    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
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
                const html = await epubService.getChapterContent(chapter.href, bookId);
                setContent(html);
            } catch (e) {
                console.error('[Reader] Chapter load failed', e);
            } finally {
                setLoading(false);
            }
        }
    };

    // --- Progress & Saving ---

    const saveProgress = async () => {
        if (!book) return;
        try {
            if (book.fileType === 'epub') {
                const totalChapters = epubStructure?.spine.length || 1;
                const progress =
                    ((currentChapterIndexRef.current + currentChapterScrollRef.current) /
                        totalChapters) *
                    100;

                const updateData: Partial<Book> = {
                    currentChapterIndex: currentChapterIndexRef.current,
                    currentScrollPosition: currentChapterScrollRef.current,
                    progress,
                    lastRead: Date.now(),
                };
                console.warn(
                    '[💾 Stage 1: Save] Saving chapter index:',
                    currentChapterIndexRef.current,
                );
                if (currentCfiRef.current) {
                    updateData.lastPositionCfi = currentCfiRef.current;
                }

                await BookRepository.update(bookId, updateData);
            } else if (book.fileType === 'pdf') {
                await BookRepository.update(bookId, {
                    currentChapterIndex: currentChapterIndexRef.current, // Current Page
                    totalChapters: totalPdfPages, // Total Pages
                    progress:
                        totalPdfPages > 0
                            ? (currentChapterIndexRef.current / totalPdfPages) * 100
                            : 0,
                    lastRead: Date.now(),
                });
            } else {
                const progress =
                    contentHeightRef.current > 0
                        ? (scrollPositionRef.current / contentHeightRef.current) * 100
                        : 0;
                await BookRepository.update(bookId, {
                    readingPosition: Math.round(scrollPositionRef.current),
                    progress,
                    lastRead: Date.now(),
                });
            }
        } catch (error) {
            console.error('[Reader] Failed to save progress:', error);
        }
    };

    // Internal Scroll Handlers
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        scrollPositionRef.current = contentOffset.y;
        contentHeightRef.current = contentSize.height - layoutMeasurement.height;

        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    // Handle Text Layout to map char offsets to Y positions
    const handleTextLayout = (e: { nativeEvent: { lines: TextLayoutLine[] } }) => {
        textLinesRef.current = e.nativeEvent.lines;
    };

    const handleEpubScroll = (percentage: number) => {
        currentChapterScrollRef.current = percentage;
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    // --- Navigation & Actions ---

    const handleNextChapter = () => {
        if (hapticFeedback) Vibration.vibrate(10);
        if (epubStructure && currentChapterIndex < epubStructure.spine.length - 1) {
            const next = currentChapterIndex + 1;
            setCurrentChapterIndex(next);
            currentChapterIndexRef.current = next;
            currentChapterScrollRef.current = 0;
            saveProgress();
        }
    };

    const handlePrevChapter = () => {
        if (hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentChapterIndex > 0) {
            const prev = currentChapterIndex - 1;
            setCurrentChapterIndex(prev);
            currentChapterIndexRef.current = prev;
            currentChapterScrollRef.current = 0;
            saveProgress();
        }
    };

    const handleSelectChapter = (href: string) => {
        if (!epubStructure) return;

        // TXT Handling
        if (href.startsWith('txt://')) {
            const offset = parseInt(href.replace('txt://', ''), 10);
            // We need getScrollYFromCharIndex which depends on layout.
            // For hook separation, we might need to expose a ref or a method that the component can call.
            // OR we move getScrollYFromCharIndex here but it depends on textLinesRef which is available.

            const targetY = getScrollYFromCharIndex(offset);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });

            const index = epubStructure.toc.findIndex((c) => c.href === href);
            if (index !== -1) setCurrentChapterIndex(index);
            return;
        }

        // EPUB Handling
        if (book?.fileType === 'epub' && epubRef.current) {
            let targetFilename = href.split('/').pop() || '';
            if (targetFilename.includes('#')) targetFilename = targetFilename.split('#')[0];

            const chapterIndex = epubStructure.spine.findIndex((c) => {
                const cFilename = c.href.split('/').pop() || '';
                const decodedCHref = decodeURIComponent(c.href);
                const decodedHref = decodeURIComponent(href);
                return (
                    cFilename === targetFilename || c.href === href || decodedCHref === decodedHref
                );
            });

            if (chapterIndex !== -1) {
                setCurrentChapterIndex(chapterIndex);
                currentChapterIndexRef.current = chapterIndex;
                currentChapterScrollRef.current = 0;
                saveProgress();

                const hasHash = href.includes('#');

                if (!hasHash) {
                    epubRef.current.goToLocation(chapterIndex);
                } else {
                    const spineHref = epubStructure.spine[chapterIndex].href;
                    const originalHash = hasHash ? '#' + href.split('#')[1] : '';
                    let targetJump = spineHref;
                    if (hasHash && !spineHref.includes('#')) {
                        targetJump = spineHref + originalHash;
                    }
                    if (pathPrefixRef.current && !targetJump.startsWith(pathPrefixRef.current)) {
                        targetJump = pathPrefixRef.current + targetJump;
                    }
                    const cleanHref = targetJump.replace(/^\//, '');
                    epubRef.current.goToLocation(cleanHref);
                }
            }
        }
    };

    const getScrollYFromCharIndex = (charIndex: number): number => {
        const lines = textLinesRef.current;
        if (!lines || lines.length === 0) return 0;
        let currentIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].text.length;
            if (charIndex >= currentIndex && charIndex < currentIndex + lineLength) {
                return lines[i].y;
            }
            currentIndex += lineLength;
        }
        return lines[lines.length - 1].y;
    };

    const handleSectionChange = (href: string) => {
        if (!epubStructure || book?.fileType !== 'epub') return;

        let targetFilename = href.split('/').pop() || '';
        if (targetFilename.includes('#')) targetFilename = targetFilename.split('#')[0];

        const chapterIndex = epubStructure.spine.findIndex((c) => {
            const cFilename = c.href.split('/').pop() || '';
            const decodedCHref = decodeURIComponent(c.href);
            const decodedHref = decodeURIComponent(href);
            return cFilename === targetFilename || c.href === href || decodedCHref === decodedHref;
        });

        if (chapterIndex !== -1 && chapterIndex !== currentChapterIndex) {
            console.log(`[useReaderLogic] Syncing chapter index to ${chapterIndex} (${href})`);
            setCurrentChapterIndex(chapterIndex);
            currentChapterIndexRef.current = chapterIndex;
            // setContent will be triggered by useEffect([currentChapterIndex])
            // saveProgress will be triggered by handleEpubScroll or eventually
        }
    };

    // Removed handleReaderReady

    const handleLocationUpdate = (cfi: string) => {
        currentCfiRef.current = cfi;
        const now = Date.now();
        // Throttle save (kept, but now unmount save works)
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    // Add Bookmark
    const handleAddBookmark = async () => {
        if (!book) return;
        try {
            const bookmark: Bookmark = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                percentage: book.progress || 0,
                createdAt: Date.now(),
                previewText: `Bookmark at ${new Date().toLocaleTimeString()}`,
            };

            if (book.fileType === 'epub') {
                const currentCfi = epubRef.current?.getCurrentLocation();
                if (currentCfi && typeof currentCfi === 'string') {
                    bookmark.cfi = currentCfi;
                } else {
                    bookmark.cfi = `chapter:${currentChapterIndex}`;
                }
            } else if (book.fileType === 'pdf') {
                // PDF logic placeholder
            } else {
                bookmark.cfi = `scroll:${Math.round(scrollPositionRef.current)}`;
            }

            await BookmarkRepository.create(bookmark);
            Toast.show({
                type: 'success',
                text1: t('reader.bookmark_added') || 'Bookmark Added',
                visibilityTime: 2000,
                position: 'top',
            });
        } catch (e) {
            console.error(e);
        }
    };

    return {
        // State
        book,
        loading,
        content,
        epubStructure,
        currentChapterIndex,
        // Note: initialLocationHref removed - not needed
        notes,
        totalPdfPages,
        setTotalPdfPages,

        // Refs (Exposed for components)
        epubRef,
        scrollViewRef,
        currentChapterIndexRef, // 暴露章节索引 Ref，用于解决闭包问题
        bookLoadedRef, // 暴露书籍加载完成标记
        currentChapterScrollRef,
        textLinesRef,

        // Handlers
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
    };
};
