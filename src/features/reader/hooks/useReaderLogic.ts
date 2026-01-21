import { useState, useRef, useEffect, useCallback } from 'react';
import { TextLayoutLine, Vibration, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { BookRepository } from '@/services/database/BookRepository';
import { ReadingSessionRepository } from '@/services/database/ReadingSessionRepository';
import { NoteRepository } from '@/services/database/NoteRepository';
import { BookmarkRepository } from '@/services/database/BookmarkRepository';
import { Book, Note, Bookmark } from '@/services/database/types';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { epubService, EpubStructure } from '@/features/reader/utils/EpubService';
import { txtService } from '@/features/reader/utils/TxtService';
import { getSafePath } from '@/utils/PathUtils';
import { RootStackParamList } from '@/types/navigation';
import * as Crypto from 'expo-crypto';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

/**
 * 阅读器核心逻辑自定义 Hook
 * 负责管理书籍加载、章节切换、阅读进度保存、笔记/书签管理等核心功能
 */
export const useReaderLogic = () => {
    const route = useRoute<ReaderScreenRouteProp>();
    const navigation = useNavigation();
    const { bookId } = route.params;
    const { t } = useTranslation();

    // --- 阅读器设置 (从状态库中获取) ---
    const { hapticFeedback } = useReaderSettings();

    // --- 核心状态声明 ---
    const [book, setBook] = useState<Book | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isRestoring, setIsRestoring] = useState(false);
    const [epubStructure, setEpubStructure] = useState<EpubStructure | null>(null);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [totalPdfPages, setTotalPdfPages] = useState(0);
    const [notes, setNotes] = useState<Note[]>([]);

    // --- Refs ---
    const epubRef = useRef<any>(null); // EpubReader ref
    const scrollViewRef = useRef<any>(null); // TXT ScrollView ref
    const currentChapterIndexRef = useRef(0);
    const currentChapterScrollRef = useRef(0);
    const bookLoadedRef = useRef(false);
    const currentCfiRef = useRef<string | null>(null);
    const scrollPositionRef = useRef(0);
    const contentHeightRef = useRef(0);
    const lastSaveTimeRef = useRef(0);
    const textLinesRef = useRef<TextLayoutLine[]>([]);
    const pathPrefixRef = useRef<string>('');

    /**
     * 加载书籍元数据与内容
     */
    const loadBook = useCallback(async () => {
        try {
            setLoading(true);
            const bookData = await BookRepository.getById(bookId);
            if (!bookData) {
                Toast.show({
                    type: 'error',
                    text1: t('reader.load_failed'),
                    text2: t('reader.book_not_found'),
                });
                navigation.goBack();
                return;
            }

            // 修复文件路径
            const safePath = await getSafePath(bookData.filePath);
            bookData.filePath = safePath;
            setBook(bookData);

            // 加载笔记
            // const existingNotes = await NoteRepository.getByBookId(bookId);
            // setNotes(existingNotes);

            if (bookData.fileType === 'epub') {
                const unzipPromise = epubService.unzipBook(bookData.filePath, bookId);
                const parsePromise = async () => {
                    await unzipPromise;
                    return epubService.parseBook(bookId);
                };

                const structure = await Promise.race([
                    parsePromise(),
                    new Promise<EpubStructure>((_, reject) =>
                        setTimeout(() => reject(new Error('EPUB load timeout')), 30000),
                    ),
                ]);

                setEpubStructure(structure);

                // Set path prefix if needed (e.g. OEBPS/)
                if (structure.spine.length > 0) {
                    const firstHref = structure.spine[0].href;
                    if (firstHref.includes('/')) {
                        pathPrefixRef.current = firstHref.substring(0, firstHref.lastIndexOf('/') + 1);
                    }
                }

                const savedChapterIndex = bookData.currentChapterIndex || 0;
                setCurrentChapterIndex(savedChapterIndex);
                currentChapterIndexRef.current = savedChapterIndex;
                currentChapterScrollRef.current = bookData.currentScrollPosition || 0;

                // IMPORTANT: Strict Restoration Logic
                if (bookData.lastPositionCfi) {
                    currentCfiRef.current = bookData.lastPositionCfi;
                    setIsRestoring(true);
                    console.log('[Reader] Strict Restoration Mode ENABLED. Waiting for onReady...');
                } else {
                    setIsRestoring(false);
                }

                bookLoadedRef.current = true;
                setLoading(false);

            } else if (bookData.fileType === 'pdf') {
                const savedPage = bookData.currentChapterIndex || 0;
                setCurrentChapterIndex(savedPage);
                currentChapterIndexRef.current = savedPage;
                bookLoadedRef.current = true;
                setLoading(false);
            } else if (bookData.fileType === 'txt') {
                const content = await FileSystem.readAsStringAsync(bookData.filePath);
                setContent(content);

                // Parse chapters for TOC support in TXT files
                const chapters = txtService.parseChapters(content);
                setEpubStructure({
                    toc: chapters,
                    spine: chapters,
                    metadata: { title: bookData.title || '' },
                } as any);

                // Restore TXT position requires text layout calculation
                scrollPositionRef.current = bookData.readingPosition || 0;
                if (bookData.readingPosition && bookData.readingPosition > 0) {
                    // Mild delay to allow render
                    setTimeout(() => {
                        scrollViewRef.current?.scrollTo({
                            y: bookData.readingPosition,
                            animated: false,
                        });
                    }, 500);
                }
                bookLoadedRef.current = true;
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to load book:', error);
            Toast.show({
                type: 'error',
                text1: t('reader.load_failed'),
            });
            setLoading(false);
        }
    }, [bookId, navigation, t]);

    /**
     * Handle Reader Ready Event (EPUB Strict Restoration)
     */
    const handleReaderReady = useCallback(() => {
        if (isRestoring && currentCfiRef.current && epubRef.current) {
            console.log('[Reader Logic] onReady triggered. Target CFI:', currentCfiRef.current);
            epubRef.current.goToLocation(currentCfiRef.current);

            // Wait for the engine to complete the render and jump
            setTimeout(() => {
                console.log(
                    '[Reader Logic] Restoration stabilization complete. Unlocking location updates.',
                );
                setIsRestoring(false);
            }, 1000); // Increased to 1s for better stability on heavy books
        } else {
            console.log(
                '[Reader Logic] onReady: No restoration needed or no CFI found.',
                isRestoring,
                !!currentCfiRef.current,
            );
            setIsRestoring(false);
        }
    }, [isRestoring]);

    /**
     * 保存进度
     */
    const saveProgress = useCallback(async () => {
        if (!book || !bookLoadedRef.current) return;
        if (isRestoring) {
            console.log('[Reader] Skip saveProgress: STRICT RESTORATION IN PROGRESS.');
            return;
        }

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
                    progress: Math.min(100, progress),
                    lastRead: Date.now(),
                };
                if (currentCfiRef.current) {
                    console.log('[Reader Logic] Saving progress with CFI:', currentCfiRef.current);
                    updateData.lastPositionCfi = currentCfiRef.current;
                }
                await BookRepository.update(bookId, updateData);

            } else if (book.fileType === 'pdf') {
                await BookRepository.update(bookId, {
                    currentChapterIndex: currentChapterIndexRef.current,
                    totalChapters: totalPdfPages,
                    progress: totalPdfPages > 0 ? (currentChapterIndexRef.current / totalPdfPages) * 100 : 0,
                    lastRead: Date.now(),
                });
            } else {
                // TXT
                const progress = contentHeightRef.current > 0 ? (scrollPositionRef.current / contentHeightRef.current) * 100 : 0;
                await BookRepository.update(bookId, {
                    readingPosition: Math.round(scrollPositionRef.current),
                    progress,
                    lastRead: Date.now(),
                });
            }
        } catch (error) {
            console.error('[Reader] Failed to save progress:', error);
        }
    }, [book, bookId, isRestoring, epubStructure, totalPdfPages]);

    /**
     * 加载特定章节的内容 (EPUB/TXT chunk)
     */
    const loadChapter = useCallback(
        async (index: number) => {
            if (!epubStructure || (!epubStructure.spine[index] && book?.fileType === 'epub')) {
                return;
            }

            const chapter = epubStructure.spine[index];

            // 处理大 TXT 文件的“虚构”章节请求
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
                        setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 0, animated: false });
                            scrollPositionRef.current = 0;
                        }, 50);
                    }
                } catch (e) {
                    console.error('[Reader] Chunk load failed', e);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // 处理正常的 EPUB 章节 HTML 读取
            if (book?.fileType === 'epub') {
                try {
                    const html = await epubService.getChapterContent(chapter.href, bookId);
                    setContent(html);
                } catch (e) {
                    console.error('[Reader] Chapter load failed', e);
                }
            }
        },
        [book?.fileType, book?.filePath, bookId, epubStructure],
    );

    // --- Init ---
    const hasInitialized = useRef(false);
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            loadBook();
        }
        return () => {
            saveProgress();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [saveProgress]);

    useEffect(() => {
        if (book?.fileType === 'epub' && epubStructure) {
            loadChapter(currentChapterIndex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book?.fileType, currentChapterIndex, epubStructure]);

    // --- Handlers (TXT) ---
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

    const handleTextLayout = (e: { nativeEvent: { lines: TextLayoutLine[] } }) => {
        textLinesRef.current = e.nativeEvent.lines;
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

    // --- Handlers (EPUB) ---
    const handleEpubScroll = (percentage: number) => {
        currentChapterScrollRef.current = percentage;
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    const handleNextChapter = () => {
        if (hapticFeedback) Vibration.vibrate(10);
        if (epubStructure && currentChapterIndex < epubStructure.spine.length - 1) {
            const next = currentChapterIndex + 1;
            setCurrentChapterIndex(next);
            currentChapterIndexRef.current = next;
            currentChapterScrollRef.current = 0;
            scrollPositionRef.current = 0;
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
            scrollPositionRef.current = 0;
            saveProgress();
        }
    };

    const handleSelectChapter = (href: string) => {
        if (!epubStructure) return;

        // TXT
        if (href.startsWith('txt://')) {
            const offset = parseInt(href.replace('txt://', ''), 10);
            const targetY = getScrollYFromCharIndex(offset);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });

            const index = epubStructure.toc.findIndex((c) => c.href === href);
            if (index !== -1) {
                setCurrentChapterIndex(index);
                currentChapterIndexRef.current = index;
                saveProgress();
            }
            return;
        }

        // EPUB
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
                scrollPositionRef.current = 0;
                saveProgress();

                const hasHash = href.includes('#');

                if (!hasHash) {
                    epubRef.current?.goToLocation(chapterIndex);
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
                    epubRef.current?.goToLocation(cleanHref);
                }
            }
        }
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
            setCurrentChapterIndex(chapterIndex);
            currentChapterIndexRef.current = chapterIndex;
        }
    };

    const handleLocationUpdate = (loc: string | { type: 'pdf'; page: number }) => {
        // Critical Fix: Do not update currentCfiRef while restoring.
        // The initial chapter load triggers a location change to the chapter start.
        // If we update the ref here, we lose the restored CFI before we can jump to it.
        if (isRestoring) {
            console.log('[useReaderLogic] Ignoring location update during restoration:', loc);
            return;
        }

        const now = Date.now();
        if (typeof loc === 'string' && book?.fileType === 'epub') {
            currentCfiRef.current = loc;
            if (now - lastSaveTimeRef.current > 5000) {
                lastSaveTimeRef.current = now;
                saveProgress();
            }
        } else if (typeof loc === 'object' && loc.type === 'pdf' && book?.fileType === 'pdf') {
            currentChapterIndexRef.current = loc.page;
            setCurrentChapterIndex(loc.page);
            saveProgress();
        }
    };

    const handleAddBookmark = async () => {
        if (!book) return;
        try {
            const bookmark: Bookmark = {
                id: Crypto.randomUUID(),
                bookId: book.id,
                percentage: book.progress || 0,
                createdAt: Date.now(),
                previewText: `${t('reader.bookmark_at')} ${new Date().toLocaleTimeString()}`,
            };

            if (book.fileType === 'epub') {
                const currentCfi = epubRef.current?.getCurrentLocation();
                bookmark.cfi = currentCfi || `chapter:${currentChapterIndex}`;
            } else if (book.fileType === 'pdf') {
                bookmark.cfi = `page:${currentChapterIndex}`;
            } else {
                bookmark.cfi = `scroll:${Math.round(scrollPositionRef.current)}`;
            }

            await BookmarkRepository.create(bookmark);
            Toast.show({
                type: 'success',
                text1: t('reader.bookmark_added'),
                visibilityTime: 2000,
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleClose = () => {
        saveProgress();
        navigation.goBack();
    };

    const handleSelectBookmark = (bookmark: Bookmark) => {
        if (!book || !bookmark) return;

        if (book.fileType === 'epub') {
            if (!epubRef.current?.goToLocation) return;
            if (bookmark.cfi?.startsWith('chapter:')) {
                const index = parseInt(bookmark.cfi.replace('chapter:', ''), 10);
                if (!isNaN(index)) epubRef.current.goToLocation(index);
                return;
            }
            if (bookmark.cfi?.startsWith('epubcfi(')) {
                epubRef.current.goToLocation(bookmark.cfi);
                return;
            }
            if (bookmark.cfi?.includes('/')) {
                handleSelectChapter(bookmark.cfi);
                return;
            }
        }

        if (book.fileType === 'txt') {
            if (bookmark.cfi?.startsWith('scroll:') && scrollViewRef.current) {
                const offset = parseInt(bookmark.cfi.replace('scroll:', ''), 10);
                scrollViewRef.current.scrollTo({ y: offset, animated: true });
            }
        }
    };

    const handleSaveNote = async (
        noteContent: string,
        color: string,
        selectedText: string,
        selectedCfi: string,
    ) => {
        if (!book) return;

        const cfiToSave = selectedCfi || `chapter:${currentChapterIndex}`;
        const type = 'note';

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
                text1: t('reader.note_saved'),
            });
            return true;
        } catch (e) {
            console.error('Failed to save note', e);
            return false;
        }
    };

    return {
        // --- 对外暴露的状态 ---
        book,
        loading,
        content,
        epubStructure,
        currentChapterIndex,
        notes,
        totalPdfPages,
        setTotalPdfPages,

        // --- 对外暴露的引用 ---
        epubRef,
        scrollViewRef,
        currentChapterIndexRef,
        bookLoadedRef,
        currentChapterScrollRef,
        textLinesRef,

        // --- 对外暴露的行为函数 ---
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
        handleClose,
        handleSelectBookmark,
        handleSaveNote,
        handleReaderReady,

        // --- Status ---
        isRestoring,
    };
};
