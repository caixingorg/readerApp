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

/**
 * 阅读器核心逻辑自定义 Hook
 * 负责管理书籍加载、章节切换、阅读进度保存、笔记/书签管理等核心功能
 */
export const useReaderLogic = () => {
    const route = useRoute<ReaderScreenRouteProp>();
    const navigation = useNavigation();
    const { bookId } = route.params;
    const { setMode } = useThemeStore();
    const { t } = useTranslation();

    // --- 阅读器设置 (从状态库中获取) ---
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

    // --- 核心状态声明 ---
    const [book, setBook] = useState<Book | null>(null); // 当前书籍元数据
    const [content, setContent] = useState<string>(''); // 当前显示的章节内容 (HTML 或纯文本)
    const [loading, setLoading] = useState(true); // 加载状态
    const [epubStructure, setEpubStructure] = useState<EpubStructure | null>(null); // EPUB 书籍结构 (目录、脊柱等)
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0); // 当前章节索引
    const [notes, setNotes] = useState<Note[]>([]); // 书籍关联的笔记列表

    // PDF 专有状态
    const [totalPdfPages, setTotalPdfPages] = useState(0); // PDF 总页数

    // --- 引用管理 (用于在渲染周期之间传递可变值，且不触发重新渲染) ---
    const epubRef = useRef<any>(null); // EPUB 组件引用
    const scrollViewRef = useRef<any>(null); // 滚动视图引用 (TXT 模式)
    const currentChapterIndexRef = useRef(0); // 实时章节索引引用 (解决闭包陷阱)
    const currentChapterScrollRef = useRef(0); // 当前章节内的滚动百分比
    const lastSaveTimeRef = useRef<number>(0); // 上次保存进度的时间戳 (用于节流)
    const scrollPositionRef = useRef(0); // TXT 模式下的精确滚动位移
    const contentHeightRef = useRef(0); // 可滚动内容的总高度
    const pathPrefixRef = useRef<string>(''); // 路径前缀
    const currentCfiRef = useRef<string | undefined>(undefined); // EPUB 专用的定位标识 (CFI)
    const textLinesRef = useRef<TextLayoutLine[]>([]); // TXT 模式下的行布局数据
    const bookRef = useRef<Book | null>(null); // 当前书籍数据的引用

    // 标记书籍加载工作流是否完全结束（用于同步阅读器状态）
    const bookLoadedRef = useRef(false);

    // 实时同步 book 引用的值
    useEffect(() => {
        bookRef.current = book;
    }, [book]);

    // --- 阅读会话记录 ---
    // 进入和离开页面时计算阅读时长并记录
    useEffect(() => {
        const startTime = Date.now();
        return () => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            // 只有超过 5 秒的有效阅读才记录，防止快速切入切出时产生脏数据
            if (duration > 5 && bookId) {
                ReadingSessionRepository.createSession(bookId, duration);
            }
        };
    }, [bookId]);

    // --- 初始化加载与卸载逻辑 ---
    useEffect(() => {
        loadBook();
        // 页面卸载前强制保存一次进度
        return () => {
            saveProgress();
        };
    }, [bookId]);

    // EPUB 模式下，章节切换时自动加载具体内容
    useEffect(() => {
        if (book?.fileType === 'epub' && epubStructure) {
            loadChapter(currentChapterIndex);
        }
    }, [currentChapterIndex, epubStructure]);

    /**
     * 加载书籍主函数
     * 处理不同文件类型 (EPUB, TXT, PDF) 的初始化逻辑
     */
    const loadBook = async () => {
        try {
            let bookData = await BookRepository.getById(bookId);
            if (!bookData) throw new Error('Book not found');

            // 针对 iOS 沙盒路径动态变化的特殊处理：获取当前的真实路径环境
            const safePath = getSafePath(bookData.filePath);
            bookData = { ...bookData, filePath: safePath };
            setBook(bookData);

            if (bookData.fileType === 'epub') {
                // EPUB 流程：解压 -> 解析目录结构 -> 恢复章节索引
                await epubService.unzipBook(bookData.filePath, bookId);
                const structure = await epubService.parseBook(bookId);
                setEpubStructure(structure);

                const savedChapterIndex = bookData.currentChapterIndex || 0;
                setCurrentChapterIndex(savedChapterIndex);
                currentChapterIndexRef.current = savedChapterIndex;
                currentChapterScrollRef.current = bookData.currentScrollPosition || 0;

                bookLoadedRef.current = true;
            } else if (bookData.fileType === 'pdf') {
                // PDF 流程：直接恢复页码
                setCurrentChapterIndex(bookData.currentChapterIndex || 1);
                setLoading(false);
            } else {
                // TXT 加载流程
                const fileInfo = await FileSystem.getInfoAsync(bookData.filePath);
                if (!fileInfo.exists) throw new Error('File does not exist');
                const fileSize = fileInfo.size || 0;

                // 大文件 TXT (超过 2MB) 采用虚拟分段加载技术
                if (fileSize > 2 * 1024 * 1024) {
                    const CHUNK_SIZE = 30 * 1024; // 每段加载 30KB
                    const virtualChapters = txtService.getVirtualChapters(fileSize, CHUNK_SIZE);
                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: virtualChapters,
                        toc: virtualChapters,
                    });
                    setCurrentChapterIndex(bookData.currentChapterIndex || 0);
                    currentChapterIndexRef.current = bookData.currentChapterIndex || 0;
                } else {
                    // 小文件 TXT 一次性读取
                    const fileContent = await FileSystem.readAsStringAsync(bookData.filePath);
                    setContent(fileContent);
                    const txtChapters = txtService.parseChapters(fileContent); // 解析包含可能的章节标题
                    setEpubStructure({
                        metadata: { title: bookData.title, author: bookData.author },
                        spine: [],
                        toc: txtChapters,
                    });
                    // 延迟执行滚动，确保内容已渲染
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

            // 更新最近阅读时间并加载关联笔记
            await BookRepository.update(bookId, { lastRead: Date.now() });
            const loadedNotes = await NoteRepository.getByBookId(bookId);
            setNotes(loadedNotes);
        } catch (error) {
            console.error('[Reader] Error loading book:', error);
            Toast.show({
                type: 'error',
                text1: t('reader.error_load'),
                text2: t('reader.error_load_msg'),
                visibilityTime: 3000,
            });
            setLoading(false);
            navigation.goBack();
        }
    };

    /**
     * 加载特定章节的内容
     * @param index 章节索引
     */
    const loadChapter = async (index: number) => {
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
                    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
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

    // --- 阅读进度持久化逻辑 ---

    /**
     * 保存当前阅读进度到数据库
     */
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
                    progress: Math.min(100, progress),
                    lastRead: Date.now(),
                };
                if (currentCfiRef.current) {
                    updateData.lastPositionCfi = currentCfiRef.current;
                }

                await BookRepository.update(bookId, updateData);
            } else if (book.fileType === 'pdf') {
                // PDF 进度按页数计算
                await BookRepository.update(bookId, {
                    currentChapterIndex: currentChapterIndexRef.current,
                    totalChapters: totalPdfPages,
                    progress:
                        totalPdfPages > 0
                            ? (currentChapterIndexRef.current / totalPdfPages) * 100
                            : 0,
                    lastRead: Date.now(),
                });
            } else {
                // TXT 进度按 Y 轴滚动距离计算
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

    /**
     * 处理 TXT 滚动事件 (包含节流保存)
     */
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

    /**
     * 捕获文本布局更改，用于定位字符索引在 Y 轴的位置 (TXT 模式)
     */
    const handleTextLayout = (e: { nativeEvent: { lines: TextLayoutLine[] } }) => {
        textLinesRef.current = e.nativeEvent.lines;
    };

    /**
     * 处理 EPUB 内部滚动百分比更新
     */
    const handleEpubScroll = (percentage: number) => {
        currentChapterScrollRef.current = percentage;
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    // --- 导航与交互操作 ---

    /**
     * 跳转下一章
     */
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

    /**
     * 跳转前一章
     */
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

    /**
     * 通过目录项跳转
     * 兼容处理 TXT 的偏移定位和 EPUB 的 HREF 跳转 (支持 Hash 锚点)
     */
    const handleSelectChapter = (href: string) => {
        if (!epubStructure) return;

        // 处理 TXT TOC 跳转 (通常带 txt:// 前缀)
        if (href.startsWith('txt://')) {
            const offset = parseInt(href.replace('txt://', ''), 10);
            const targetY = getScrollYFromCharIndex(offset);
            scrollViewRef.current?.scrollTo({ y: targetY, animated: true });

            const index = epubStructure.toc.findIndex((c) => c.href === href);
            if (index !== -1) setCurrentChapterIndex(index);
            return;
        }

        // 处理 EPUB TOC 跳转
        if (book?.fileType === 'epub' && epubRef.current) {
            let targetFilename = href.split('/').pop() || '';
            if (targetFilename.includes('#')) targetFilename = targetFilename.split('#')[0];

            // 匹配文件名以确定 Spine 中的章节索引
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
                    // 处理锚点跳转：拼接待锚点的路径并通知阅读核心
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

    /**
     * 工具函数：根据字符索引获取 TXT 模式下的滚动高度
     */
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

    /**
     * 当阅读器内核切换章节时触发 (用于同步外层状态)
     */
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

    /**
     * 当阅读位置更变时持续调用
     * @param cfi EPUB 定位字符串
     */
    const handleLocationUpdate = (cfi: string) => {
        currentCfiRef.current = cfi;
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            saveProgress();
        }
    };

    /**
     * 添加书签
     */
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

            // 不同模式记录不同的定位信息供以后恢复
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
    };
};
