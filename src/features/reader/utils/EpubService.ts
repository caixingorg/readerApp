import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';
import { DOMParser } from '@xmldom/xmldom';

export interface EpubChapter {
    id: string;
    label: string;
    href: string;
    subitems?: EpubChapter[];
}

export interface EpubMetadata {
    title: string;
    author: string;
    cover?: string; // Base64 or URI
    language?: string;
}

export interface EpubStructure {
    metadata: EpubMetadata;
    spine: EpubChapter[]; // Flat list for easy navigation, or nested if TOC
    toc: EpubChapter[];
}

const CACHE_DIR = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + 'books/';

class EpubService {
    /**
     * Ensure the cache directory exists
     */
    private async ensureCacheDir() {
        const info = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }
    }

    /**
     * Unzip the EPUB file
     * @param sourceUri Source file URI (must be local)
     * @param bookId Unique Book ID
     * @returns Path to the unzipped folder
     */
    async unzipBook(sourceUri: string, bookId: string): Promise<string> {
        await this.ensureCacheDir();
        const targetPath = CACHE_DIR + bookId;

        // Check if already exists
        const info = await FileSystem.getInfoAsync(targetPath);
        if (info.exists) {
            return targetPath;
        }

        // Fix for react-native-zip-archive with Unicode paths:
        // Copy to a safe ASCII temp path first.
        const safeFileName = `temp_book_${Date.now()}.epub`;
        const safeEpubUri = `${FileSystem.cacheDirectory}${safeFileName}`;

        try {
            console.log('[EpubService] Starting unzip...', { sourceUri, safeEpubUri, targetPath });

            // Ensure target directory is clean
            if ((await FileSystem.getInfoAsync(targetPath)).exists) {
                await FileSystem.deleteAsync(targetPath, { idempotent: true });
            }
            await FileSystem.makeDirectoryAsync(targetPath, { intermediates: true });

            // Copy to safe temp location
            await FileSystem.copyAsync({
                from: sourceUri,
                to: safeEpubUri,
            });

            // Unzip from the safe ASCII path
            // Note: unzip expects file paths, not URIs, so we strip file://
            const sourcePath = decodeURIComponent(safeEpubUri.replace('file://', ''));
            const targetPathNative = decodeURIComponent(targetPath.replace('file://', ''));

            console.log('[EpubService] Executing native unzip command...', {
                sourcePath,
                targetPathNative,
            });
            await unzip(sourcePath, targetPathNative);
            console.log('[EpubService] Unzip successful');
            return targetPath;
        } catch (error) {
            console.error('[EpubService] Unzip failed:', error);
            throw error;
        } finally {
            // Cleanup temp file
            try {
                await FileSystem.deleteAsync(safeEpubUri, { idempotent: true });
            } catch (e) {
                console.warn('[EpubService] Failed to delete temp file:', e);
            }
        }
    }

    /**
     * Parse the EPUB structure (OPF, TOC)
     */
    async parseBook(bookId: string): Promise<EpubStructure> {
        const bookDir = CACHE_DIR + bookId;

        // Helper: Normalize path (handle .. and . segments)
        const normalizePath = (path: string): string => {
            const parts = path.split('/');
            const stack: string[] = [];
            for (const part of parts) {
                if (part === '' || part === '.') continue;
                if (part === '..') {
                    if (stack.length > 0) stack.pop();
                } else {
                    stack.push(part);
                }
            }
            return stack.join('/');
        };

        // Helper: Convert absolute path to relative path
        const makeRelativePath = (fullPath: string): string => {
            // 1. Remove file:// prefix
            let cleanPath = fullPath.replace(/^file:\/\//, '');
            const cleanBookDir = localBookDir.replace(/^file:\/\//, '');

            // 2. Normalize both paths to resolve .. and double slashes
            cleanPath = normalizePath(cleanPath);
            const normalizedBookDir = normalizePath(cleanBookDir);

            // 3. Remove book directory prefix
            // We use string replacement, but ensure we match directory structure
            if (cleanPath.startsWith(normalizedBookDir)) {
                cleanPath = cleanPath.substring(normalizedBookDir.length);
            } else if (cleanPath.includes(normalizedBookDir)) {
                // Fallback for cases where string replacement might be safer
                cleanPath = cleanPath.replace(normalizedBookDir, '');
            }

            // 4. Remove leading slashes
            cleanPath = cleanPath.replace(/^\/+/, '');

            return cleanPath;
        };

        // 1. Find container.xml to locate content.opf
        let localBookDir = bookDir;
        let containerPath = localBookDir + '/META-INF/container.xml';

        // Fix: Detect if EPUB has a nested root folder (e.g. MyBook/META-INF/...)
        const dirInfo = await FileSystem.getInfoAsync(localBookDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
            const contents = await FileSystem.readDirectoryAsync(localBookDir);
            const hasMetaInf = contents.includes('META-INF');

            if (!hasMetaInf && contents.length === 1) {
                // Potential nested root
                const nestedDir = localBookDir + '/' + contents[0];
                const nestedInfo = await FileSystem.getInfoAsync(nestedDir);
                if (nestedInfo.isDirectory) {
                    // Update working directory to nested one
                    // NOTE: We don't move files to avoid I/O overhead, just point to new root
                    localBookDir = nestedDir;
                    containerPath = localBookDir + '/META-INF/container.xml';
                    console.log('[EpubService] Detected nested root:', localBookDir);
                }
            } else if (!hasMetaInf && contents.length > 0) {
                // Try to find META-INF in subfolders?
                // For now, assume standard structure or single nested root.
                console.warn(
                    '[EpubService] META-INF not found in root or single nested root',
                    contents,
                );
            }
        }

        const containerXml = await FileSystem.readAsStringAsync(containerPath);
        const containerDoc = new DOMParser().parseFromString(containerXml, 'text/xml');
        const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
        const opfRelativePath = rootfile.getAttribute('full-path');

        if (!opfRelativePath) throw new Error('Invalid container.xml');

        const opfPath = localBookDir + '/' + opfRelativePath;
        const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));

        // 2. Parse content.opf
        const opfContent = await FileSystem.readAsStringAsync(opfPath);
        const opfDoc = new DOMParser().parseFromString(opfContent, 'text/xml');

        // Metadata
        const metadataNode = opfDoc.getElementsByTagName('metadata')[0];
        const title =
            metadataNode.getElementsByTagName('dc:title')[0]?.textContent || 'Unknown Title';
        const author =
            metadataNode.getElementsByTagName('dc:creator')[0]?.textContent || 'Unknown Author';
        const language = metadataNode.getElementsByTagName('dc:language')[0]?.textContent || 'en';

        // Manifest (files)
        const manifest = opfDoc.getElementsByTagName('manifest')[0];
        const items = Array.from(manifest.getElementsByTagName('item'));
        const manifestMap = new Map<
            string,
            { href: string; mediaType: string; properties?: string }
        >();
        items.forEach((item) => {
            manifestMap.set(item.getAttribute('id')!, {
                href: item.getAttribute('href')!,
                mediaType: item.getAttribute('media-type')!,
                properties: item.getAttribute('properties') || '',
            });
        });

        // Spine (reading order)
        const spine = opfDoc.getElementsByTagName('spine')[0];
        const itemrefs = Array.from(spine.getElementsByTagName('itemref'));

        const spineChapters: EpubChapter[] = [];
        itemrefs.forEach((itemref, index) => {
            const idref = itemref.getAttribute('idref');
            const item = manifestMap.get(idref!);
            if (item) {
                spineChapters.push({
                    id: idref!,
                    label: `Chapter ${index + 1}`,
                    href: makeRelativePath(`${opfDir}/${item.href}`), // Use helper function
                });
            }
        });

        // Cover
        let cover: string | undefined;
        const metaNodes = metadataNode.getElementsByTagName('meta');
        for (let i = 0; i < metaNodes.length; i++) {
            if (metaNodes[i].getAttribute('name') === 'cover') {
                const coverId = metaNodes[i].getAttribute('content');
                if (coverId && manifestMap.has(coverId)) {
                    cover = `${opfDir}/${manifestMap.get(coverId)!.href}`;
                }
            }
        }

        // 3. Parse TOC (Prioritize EPUB3 Nav -> EPUB2 NCX)
        let tocChapters: EpubChapter[] = [];

        // Strategy A: Check for properties="nav" (EPUB3 Standard)
        const navItem = items.find((item) => item.getAttribute('properties')?.includes('nav'));
        if (navItem) {
            const navHref = navItem.getAttribute('href');
            if (navHref) {
                const navPath = opfDir + '/' + navHref;
                try {
                    const navContent = await FileSystem.readAsStringAsync(navPath);
                    // nav.xhtml is XHTML/HTML
                    const navDoc = new DOMParser().parseFromString(navContent, 'text/xml'); // or text/html
                    // Look for <nav epub:type="toc"> or just <nav>
                    // Note: DOMParser XML mode might be strict about namespaces.
                    // We simple look for 'nav' tag.
                    const navNode =
                        Array.from(navDoc.getElementsByTagName('nav')).find(
                            (n) =>
                                n.getAttribute('epub:type') === 'toc' ||
                                !n.getAttribute('epub:type'),
                        ) || navDoc.getElementsByTagName('nav')[0];

                    if (navNode) {
                        // Parse <ol> list
                        const ol = navNode.getElementsByTagName('ol')[0];
                        if (ol) {
                            tocChapters = this.parseNavList(ol, opfDir, makeRelativePath);
                        }
                    }
                } catch (e) {
                    console.warn('[EpubService] Failed to parse EPUB3 Nav:', e);
                }
            }
        }

        // Strategy B: Check for NCX (EPUB2) if no result yet
        if (tocChapters.length === 0) {
            const ncxItem = items.find(
                (item) => item.getAttribute('media-type') === 'application/x-dtbncx+xml',
            );
            if (ncxItem) {
                const ncxHref = ncxItem.getAttribute('href');
                if (ncxHref) {
                    const ncxPath = opfDir + '/' + ncxHref;
                    try {
                        const ncxContent = await FileSystem.readAsStringAsync(ncxPath);
                        const ncxDoc = new DOMParser().parseFromString(ncxContent, 'text/xml');
                        const navMap = ncxDoc.getElementsByTagName('navMap')[0];
                        if (navMap) {
                            tocChapters = this.parseNavPoints(navMap, opfDir, makeRelativePath);
                        }
                    } catch (e) {
                        console.warn('[EpubService] Failed to parse NCX:', e);
                    }
                }
            }
        }

        // Fallback to spine if no TOC found
        if (tocChapters.length === 0) {
            tocChapters = spineChapters;
        }

        return {
            metadata: { title, author, cover, language },
            spine: spineChapters,
            toc: tocChapters,
        };
    }

    /**
     * Parse HTML list (EPUB3 Nav)
     */
    private parseNavList(
        node: Element,
        opfDir: string,
        makeRelativePath: (path: string) => string,
    ): EpubChapter[] {
        const chapters: EpubChapter[] = [];
        // Iterate direct LIs
        const lis = Array.from(node.childNodes).filter(
            (n) => n.nodeName === 'li' || n.nodeName === 'Li',
        );

        lis.forEach((li: any) => {
            // Find anchor
            const a = Array.from(li.childNodes).find(
                (n: any) => n.nodeName === 'a' || n.nodeName === 'A',
            ) as any;
            if (a) {
                const href = a.getAttribute('href');
                const label = a.textContent?.trim() || 'Untitled';

                if (href) {
                    const chapter: EpubChapter = {
                        id: href, // logic ID
                        label,
                        href: makeRelativePath(`${opfDir}/${href}`),
                        subitems: [],
                    };

                    // Check nested OL
                    const childOl = Array.from(li.childNodes).find(
                        (n: any) => n.nodeName === 'ol' || n.nodeName === 'Ol',
                    ) as Element;
                    if (childOl) {
                        chapter.subitems = this.parseNavList(childOl, opfDir, makeRelativePath);
                    }

                    chapters.push(chapter);
                }
            } else {
                // Might be a span + ol (header only)
                const span = Array.from(li.childNodes).find(
                    (n: any) => n.nodeName === 'span' || n.nodeName === 'Span',
                ) as any;
                const childOl = Array.from(li.childNodes).find(
                    (n: any) => n.nodeName === 'ol' || n.nodeName === 'Ol',
                ) as Element;
                if (span && childOl) {
                    // label and subitems were extracted but not used in current pass-through logic
                    this.parseNavList(childOl, opfDir, makeRelativePath);
                }
            }
        });
        return chapters;
    }

    /**
     * Recursive function to parse navPoints (NCX)
     */
    private parseNavPoints(
        node: Element,
        opfDir: string,
        makeRelativePath: (path: string) => string,
    ): EpubChapter[] {
        const chapters: EpubChapter[] = [];
        const navPoints = Array.from(node.childNodes).filter((n) => n.nodeName === 'navPoint'); // Direct children only

        navPoints.forEach((navPoint: any) => {
            const id = navPoint.getAttribute('id');
            const labelNode = navPoint.getElementsByTagName('navLabel')[0];
            const textNode = labelNode ? labelNode.getElementsByTagName('text')[0] : null;
            const label = textNode ? textNode.textContent : 'Untitled';

            const contentNode = navPoint.getElementsByTagName('content')[0];
            const src = contentNode ? contentNode.getAttribute('src') : '';

            if (id && src) {
                const chapter: EpubChapter = {
                    id,
                    label,
                    href: makeRelativePath(`${opfDir}/${src}`),
                    subitems: [],
                };

                // Check for nested navPoints
                const subNavPoints = this.parseNavPoints(navPoint, opfDir, makeRelativePath);
                if (subNavPoints.length > 0) {
                    chapter.subitems = subNavPoints;
                }

                chapters.push(chapter);
            }
        });

        return chapters;
    }

    async getChapterContent(href: string, bookId: string): Promise<string> {
        try {
            // Reconstruct absolute path
            // href is relative (e.g. EPUB/xhtml/chapter.xhtml)
            // Need to find the correct root base similarly to parseBook, but we don't want to re-scan every time.
            // Temporary fix: Try both direct and nested hypothesis if direct fails?
            // Better: Cache the root path for the bookId. But method is static-ish.
            // For now, let's just check if file exists, if not try one level deeper?
            // Simple heuristic: readDirectoryAsync is expensive.
            // Let's rely on the href being correct relative to the *OPF* directory, which is usually inside the book structure.
            // Actually, the previous logic assumed CACHE_DIR + bookId + href.
            // If we detected a nested root in parseBook, the href stored in Spine SHOULD be relative to that nested root?
            // Wait, makeRelativePath logic in parseBook removed the `localBookDir`.
            // So if we simply prepend `CACHE_DIR + bookId`, we might miss the intermediate folder if we stripped it out.

            // CORRECT FIX: We should rely on `getChapterContent` being robust or `parseBook` returning absolute paths?
            // No, we want relative paths for portability.

            // Let's dynamically find the file if it doesn't exist at first guess.
            let bookDir = CACHE_DIR + bookId;
            let fullPath = `${bookDir}/${href}`;

            if (!(await FileSystem.getInfoAsync(fullPath)).exists) {
                // Check if there is a single nested folder
                const contents = await FileSystem.readDirectoryAsync(bookDir);
                if (contents.length === 1) {
                    bookDir = bookDir + '/' + contents[0];
                    fullPath = `${bookDir}/${href}`;
                }
            }

            return await FileSystem.readAsStringAsync(fullPath);
        } catch (error) {
            console.error('[EpubService] Failed to read chapter:', href, error);
            throw error;
        }
    }
}

export const epubService = new EpubService();
