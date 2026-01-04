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
    /**
     * Parse the EPUB structure (OPF, TOC)
     */
    async parseBook(bookId: string): Promise<EpubStructure> {
        const bookDir = CACHE_DIR + bookId;

        // 1. Find container.xml to locate content.opf
        const containerPath = bookDir + '/META-INF/container.xml';

        const containerXml = await FileSystem.readAsStringAsync(containerPath);
        const containerDoc = new DOMParser().parseFromString(containerXml, 'text/xml');
        const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
        const opfRelativePath = rootfile.getAttribute('full-path');

        if (!opfRelativePath) throw new Error('Invalid container.xml');

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
        const manifestMap = new Map<string, { href: string; mediaType: string; properties?: string }>();
        items.forEach(item => {
            manifestMap.set(item.getAttribute('id')!, {
                href: item.getAttribute('href')!,
                mediaType: item.getAttribute('media-type')!,
                properties: item.getAttribute('properties') || ''
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
        const navItem = items.find(item => item.getAttribute('properties')?.includes('nav'));
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
                    const navNode = Array.from(navDoc.getElementsByTagName('nav')).find(n => n.getAttribute('epub:type') === 'toc' || !n.getAttribute('epub:type')) || navDoc.getElementsByTagName('nav')[0];

                    if (navNode) {
                        // Parse <ol> list
                        const ol = navNode.getElementsByTagName('ol')[0];
                        if (ol) {
                            tocChapters = this.parseNavList(ol, opfDir);
                        }
                    }
                } catch (e) {
                    console.warn('[EpubService] Failed to parse EPUB3 Nav:', e);
                }
            }
        }

        // Strategy B: Check for NCX (EPUB2) if no result yet
        if (tocChapters.length === 0) {
            const ncxItem = items.find(item => item.getAttribute('media-type') === 'application/x-dtbncx+xml');
            if (ncxItem) {
                const ncxHref = ncxItem.getAttribute('href');
                if (ncxHref) {
                    const ncxPath = opfDir + '/' + ncxHref;
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
        }

        // Fallback to spine if no TOC found
        if (tocChapters.length === 0) {
            tocChapters = spineChapters;
        }



        return {
            metadata: { title, author, cover },
            spine: spineChapters,
            toc: tocChapters
        };
    }

    /**
     * Parse HTML list (EPUB3 Nav)
     */
    private parseNavList(node: Element, opfDir: string): EpubChapter[] {
        const chapters: EpubChapter[] = [];
        // Iterate direct LIs
        const lis = Array.from(node.childNodes).filter(n => n.nodeName === 'li' || n.nodeName === 'Li');

        lis.forEach((li: any) => {
            // Find anchor
            const a = Array.from(li.childNodes).find((n: any) => n.nodeName === 'a' || n.nodeName === 'A') as any;
            if (a) {
                const href = a.getAttribute('href');
                const label = a.textContent?.trim() || 'Untitled';

                if (href) {
                    const chapter: EpubChapter = {
                        id: href, // logic ID
                        label,
                        href: `${opfDir}/${href}`,
                        subitems: []
                    };

                    // Check nested OL
                    const childOl = Array.from(li.childNodes).find((n: any) => n.nodeName === 'ol' || n.nodeName === 'Ol') as Element;
                    if (childOl) {
                        chapter.subitems = this.parseNavList(childOl, opfDir);
                    }

                    chapters.push(chapter);
                }
            } else {
                // Might be a span + ol (header only)
                const span = Array.from(li.childNodes).find((n: any) => n.nodeName === 'span' || n.nodeName === 'Span') as any;
                const childOl = Array.from(li.childNodes).find((n: any) => n.nodeName === 'ol' || n.nodeName === 'Ol') as Element;
                if (span && childOl) {
                    const label = span.textContent?.trim() || 'Untitled group';
                    const subitems = this.parseNavList(childOl, opfDir);
                    // Add logic to handle group headers? or just flatten?
                    // For now, if no link, maybe we don't add it as clickable chapter, OR we assume it's just a folder.
                    // But our EpubChapter requires href.
                    // We can omit it or make it non-clickable.
                }
            }
        });
        return chapters;
    }

    /**
     * Recursive function to parse navPoints (NCX)
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
        try {
            return await FileSystem.readAsStringAsync(href);
        } catch (error) {
            console.error('[EpubService] Failed to read chapter:', href, error);
            throw error;
        }
    }
}

export const epubService = new EpubService();
