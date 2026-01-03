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
            // Copy to safe temp location
            await FileSystem.copyAsync({
                from: sourceUri,
                to: safeEpubUri
            });

            // Unzip from the safe ASCII path
            // Note: unzip expects file paths, not URIs, so we strip file://
            const sourcePath = safeEpubUri.replace('file://', '');
            const targetPathNative = targetPath.replace('file://', '');

            await unzip(sourcePath, targetPathNative);
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
        console.log('[EpubService] Parsing book from:', bookDir);

        // 1. Find container.xml to locate content.opf
        const containerPath = bookDir + '/META-INF/container.xml';
        console.log('[EpubService] Reading container:', containerPath);

        const containerXml = await FileSystem.readAsStringAsync(containerPath);
        const containerDoc = new DOMParser().parseFromString(containerXml, 'text/xml');
        const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
        const opfRelativePath = rootfile.getAttribute('full-path');

        if (!opfRelativePath) throw new Error('Invalid container.xml');
        console.log('[EpubService] OPF path found:', opfRelativePath);

        const opfPath = bookDir + '/' + opfRelativePath;
        const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/'));

        // 2. Parse content.opf
        const opfContent = await FileSystem.readAsStringAsync(opfPath);
        const opfDoc = new DOMParser().parseFromString(opfContent, 'text/xml');

        // Metadata
        const metadataNode = opfDoc.getElementsByTagName('metadata')[0];
        const title = metadataNode.getElementsByTagName('dc:title')[0]?.textContent || 'Unknown Title';
        const author = metadataNode.getElementsByTagName('dc:creator')[0]?.textContent || 'Unknown Author';

        // Manifest (files)
        const manifest = opfDoc.getElementsByTagName('manifest')[0];
        const items = Array.from(manifest.getElementsByTagName('item'));
        const manifestMap = new Map<string, { href: string; mediaType: string }>();
        items.forEach(item => {
            manifestMap.set(item.getAttribute('id')!, {
                href: item.getAttribute('href')!,
                mediaType: item.getAttribute('media-type')!
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
                    href: `${opfDir}/${item.href}` // Absolute path for easier loading
                });
            }
        });
        console.log('[EpubService] Spine parsed, chapters:', spineChapters.length);

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

        // 3. Parse TOC (NCX)
        let tocChapters: EpubChapter[] = [];
        const ncxItem = items.find(item => item.getAttribute('media-type') === 'application/x-dtbncx+xml');
        if (ncxItem) {
            const ncxHref = ncxItem.getAttribute('href');
            if (ncxHref) {
                const ncxPath = opfDir + '/' + ncxHref;
                console.log('[EpubService] Parsing NCX from:', ncxPath);
                try {
                    const ncxContent = await FileSystem.readAsStringAsync(ncxPath);
                    const ncxDoc = new DOMParser().parseFromString(ncxContent, 'text/xml');
                    const navMap = ncxDoc.getElementsByTagName('navMap')[0];
                    if (navMap) {
                        tocChapters = this.parseNavPoints(navMap, opfDir);
                    }
                } catch (e) {
                    console.warn('[EpubService] Failed to parse NCX:', e);
                }
            }
        }

        // Fallback to spine if no TOC found
        if (tocChapters.length === 0) {
            console.log('[EpubService] No NCX found, falling back to spine for TOC');
            tocChapters = spineChapters;
        }

        console.log('[EpubService] TOC parsed, items:', tocChapters.length);

        return {
            metadata: { title, author, cover },
            spine: spineChapters,
            toc: tocChapters
        };
    }

    /**
     * Recursive function to parse navPoints
     */
    private parseNavPoints(node: Element, opfDir: string): EpubChapter[] {
        const chapters: EpubChapter[] = [];
        const navPoints = Array.from(node.childNodes).filter(n => n.nodeName === 'navPoint'); // Direct children only

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
                    href: `${opfDir}/${src}`,
                    subitems: []
                };

                // Check for nested navPoints
                const subNavPoints = this.parseNavPoints(navPoint, opfDir);
                if (subNavPoints.length > 0) {
                    chapter.subitems = subNavPoints;
                }

                chapters.push(chapter);
            }
        });

        return chapters;
    }

    async getChapterContent(href: string): Promise<string> {
        console.log('[EpubService] Reading chapter from:', href);
        try {
            return await FileSystem.readAsStringAsync(href);
        } catch (error) {
            console.error('[EpubService] Failed to read chapter:', href, error);
            throw error;
        }
    }
}

export const epubService = new EpubService();
