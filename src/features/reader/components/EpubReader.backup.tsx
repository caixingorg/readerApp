import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Box from '../../../components/Box';
import { Theme } from '../../../theme/theme';

interface EpubReaderProps {
    content: string; // HTML content of the chapter
    theme: Theme;
    themeMode: 'light' | 'dark';
    customTheme?: { bg: string; text: string };
    fontSize: number;
    lineHeight?: number;
    margin?: number;
    fontFamily?: string;
    baseUrl?: string;
    onPress?: () => void;
    onPrevChapter?: () => void;
    onNextChapter?: () => void;
    onScroll?: (percentage: number) => void;
    onSelection?: (text: string, cfi: string, rect: any) => void;
    highlights?: Array<{ cfi: string; color: string; id: string }>;
    initialScrollPercentage?: number;
    insets?: { top: number; bottom: number; left?: number; right?: number };
    longPressSpeed?: 'fast' | 'normal' | 'slow';
    flow?: 'paginated' | 'scrolled'; // NEW
}

export interface EpubReaderRef {
    search: (text: string) => void;
    nextMatch: () => void;
    prevMatch: () => void;
    turnPage: (direction: 'next' | 'prev') => void; // NEW
}

const EpubReader = React.forwardRef<EpubReaderRef, EpubReaderProps>(({
    content,
    theme,
    themeMode,
    customTheme,
    fontSize,
    lineHeight = 1.5,
    margin = 2,
    fontFamily = 'system',
    baseUrl,
    onPress,
    onPrevChapter,
    onNextChapter,
    onScroll,
    onSelection,
    highlights = [],
    initialScrollPercentage = 0,
    insets = { top: 0, bottom: 0, left: 0, right: 0 },
    longPressSpeed = 'normal',
    flow = 'paginated', // Default to paginated
}, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    React.useImperativeHandle(ref, () => ({
        search: (text: string) => {
            webViewRef.current?.injectJavaScript(`window.performSearch(${JSON.stringify(text)}); true;`);
        },
        nextMatch: () => {
            webViewRef.current?.injectJavaScript(`if (window.findNext) window.findNext(); true;`);
        },
        prevMatch: () => {
            webViewRef.current?.injectJavaScript(`if (window.findPrev) window.findPrev(); true;`);
        },
        turnPage: (direction: 'next' | 'prev') => {
            console.log('[EpubReader] turnPage called:', direction, 'flow:', flow, 'webViewRef.current:', !!webViewRef.current);

            if (!webViewRef.current) {
                console.error('[EpubReader] No webViewRef!');
                return;
            }

            const isPaginated = flow === 'paginated';
            if (direction === 'next') {
                if (isPaginated) {
                    webViewRef.current.injectJavaScript(`
                        (function() {
                            console.log('[WebView] Attempting to scroll right');
                            const maxScroll = document.body.scrollWidth - window.innerWidth;
                            const currentScroll = window.scrollX;
                            const pageWidth = window.innerWidth;
                            
                            console.log('[WebView] maxScroll:', maxScroll, 'currentScroll:', currentScroll, 'pageWidth:', pageWidth);
                            
                            if (currentScroll < maxScroll - 5) {
                                const newScroll = Math.min(currentScroll + pageWidth, maxScroll);
                                console.log('[WebView] Scrolling to:', newScroll);
                                window.scrollTo({
                                    left: newScroll,
                                    behavior: 'auto'
                                });
                                setTimeout(() => {
                                    console.log('[WebView] After scroll, scrollX:', window.scrollX);
                                }, 100);
                            } else {
                                console.log('[WebView] At end, triggering NEXT_CHAPTER');
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NEXT_CHAPTER' }));
                            }
                        })();
                        true;
                    `);
                } else {
                    // Vertical Scroll Down
                    webViewRef.current.injectJavaScript(`
                        (function() {
                            const maxScroll = document.body.scrollHeight - window.innerHeight;
                            const currentScroll = window.scrollY;
                            
                            if (currentScroll < maxScroll - 5) {
                                window.scrollTo({
                                    top: Math.min(currentScroll + window.innerHeight * 0.9, maxScroll),
                                    behavior: 'smooth'
                                });
                            } else {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NEXT_CHAPTER' }));
                            }
                        })();
                        true;
                    `);
                }
            } else {
                if (isPaginated) {
                    webViewRef.current.injectJavaScript(`
                        (function() {
                            console.log('[WebView] Attempting to scroll left');
                            const currentScroll = window.scrollX;
                            const pageWidth = window.innerWidth;
                            
                            console.log('[WebView] currentScroll:', currentScroll, 'pageWidth:', pageWidth);
                            
                            if (currentScroll > 5) {
                                const newScroll = Math.max(currentScroll - pageWidth, 0);
                                console.log('[WebView] Scrolling to:', newScroll);
                                window.scrollTo({
                                    left: newScroll,
                                    behavior: 'auto'
                                });
                                setTimeout(() => {
                                    console.log('[WebView] After scroll, scrollX:', window.scrollX);
                                }, 100);
                            } else {
                                console.log('[WebView] At start, triggering PREV_CHAPTER');
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PREV_CHAPTER' }));
                            }
                        })();
                        true;
                    `);
                } else {
                    // Vertical Scroll Up
                    webViewRef.current.injectJavaScript(`
                        (function() {
                            const currentScroll = window.scrollY;
                            
                            if (currentScroll > 5) {
                                window.scrollTo({
                                    top: Math.max(currentScroll - window.innerHeight * 0.9, 0),
                                    behavior: 'smooth'
                                });
                            } else {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PREV_CHAPTER' }));
                            }
                        })();
                        true;
                    `);
                }
            }
        }
    }));

    // Inject highlights when they change
    useEffect(() => {
        if (isLoaded && highlights.length > 0) {
            const safeHighlights = JSON.stringify(highlights);
            webViewRef.current?.injectJavaScript(`
                window.applyHighlights(${safeHighlights});
            `);
        }
    }, [highlights, isLoaded]);

    // Restore Progress on Load
    useEffect(() => {
        if (isLoaded && initialScrollPercentage > 0) {
            console.log('[EpubReader] Restoring scroll:', initialScrollPercentage);
            const isPaginated = flow === 'paginated';
            webViewRef.current?.injectJavaScript(`
                setTimeout(() => {
                    const totalD = ${isPaginated ? 'document.body.scrollWidth' : 'document.body.scrollHeight'};
                    const viewD = ${isPaginated ? 'window.innerWidth' : 'window.innerHeight'};
                    const totalScrollable = totalD - viewD;
                    const target = totalScrollable * ${initialScrollPercentage};
                    
                    if (${isPaginated}) {
                        window.scrollTo(target, 0);
                    } else {
                        window.scrollTo(0, target);
                    }
                }, 100);
            `);
        }
    }, [isLoaded, initialScrollPercentage, flow]);

    const bg = customTheme?.bg || (themeMode === 'dark' ? '#121212' : '#F0F2F3');
    const text = customTheme?.text || (themeMode === 'dark' ? '#E0E0E0' : '#0B0B0B');

    // Generate Dynamic CSS & JS based on Flow
    const htmlContent = useMemo(() => {
        const isPaginated = flow === 'paginated';
        const basePaddingValue = margin === 1 ? 5 : margin === 3 ? 25 : 10;

        // Initial CSS - Core Layout
        const initialCss = `
          * { 
            box-sizing: border-box !important;
          }
          :root {
            --safe-top: ${insets.top}px;
            --safe-bottom: ${insets.bottom}px;
            --safe-left: ${insets.left || 0}px;
            --safe-right: ${insets.right || 0}px;
            --base-padding: ${basePaddingValue}px;
          }
          html {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          body {
            background-color: transparent;
            font-family: -apple-system, Roboto, sans-serif;
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            ${isPaginated ? `
                /* Paginated: CSS Columns */
                column-width: 100vw;
                column-gap: 0;
                column-fill: auto;
                overflow-x: scroll;
                overflow-y: hidden;
                -webkit-overflow-scrolling: touch;
            ` : `
                /* Scrolled: Normal flow */
                overflow-x: hidden;
                overflow-y: auto;
                height: auto;
                min-height: 100vh;
                padding-left: var(--base-padding);
                padding-right: var(--base-padding);
                padding-top: calc(var(--safe-top) + var(--base-padding));
                padding-bottom: calc(var(--safe-bottom) + var(--base-padding) + 50px);
            `}
          }
          
          ${isPaginated ? `
            /* Paginated mode: Apply padding to content elements, not body */
            p, h1, h2, h3, h4, h5, h6, div:not(#content), 
            section, article, blockquote, ul, ol, pre {
              padding-left: calc(var(--safe-left) + var(--base-padding)) !important;
              padding-right: calc(var(--safe-right) + var(--base-padding)) !important;
            }
            
            /* First element needs top padding */
            body > :first-child,
            #content > :first-child {
              padding-top: calc(var(--safe-top) + var(--base-padding)) !important;
            }
            
            /* Last element needs bottom padding */
            body > :last-child,
            #content > :last-child {
              padding-bottom: calc(var(--safe-bottom) + var(--base-padding)) !important;
            }
          ` : ''}

          img { 
            max-width: calc(100% - var(--safe-left) - var(--safe-right) - 2 * var(--base-padding));
            max-height: 90vh;
            height: auto;
            object-fit: contain;
            display: block;
            margin: 1em auto;
          }
          
          p { 
            margin: 0 0 0.5em 0;
            text-indent: 1em;
            line-height: 1.8;
          }
        `;

        // JS for Scroll & Interaction
        const injectedJs = `
          window.isScrolling = false;
          window.scrollDirection = '${isPaginated ? 'horizontal' : 'vertical'}'; 
          
          // --- Tap & Click Handling ---
          document.addEventListener('click', function(e) {
              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) return;

              if (e.target.closest('a')) return;

              const width = window.innerWidth;
              const x = e.clientX;
              const height = window.innerHeight;
              const y = e.clientY;
              
              const isPaginated = ${isPaginated};

              // Center Zone Logic (Toggle Controls)
              // In paginated: center 40% width
              // In scrolled: center 40% height and width?
              
              let leftZone, rightZone;

              if (isPaginated) {
                  leftZone = x < width * 0.3;
                  rightZone = x > width * 0.7;
              } else {
                  // For vertical scroll, clicking top/bottom to scroll might be annoying
                  // Usually standard is just Tap Center = Toggle.
                  // Tap Top/Bottom = Scroll page?
                  // Let's implement Page Up / Page Down logic for vertical too?
                  // Providing Tap Zones for Vertical Scroll:
                  // Top 25% -> Page Up
                  // Bottom 25% -> Page Down
                  // Center -> Toggle
                  
                  leftZone = y < height * 0.25; // "Left" message maps to Prev Page
                  rightZone = y > height * 0.75; // "Right" message maps to Next Page
              }

              if (leftZone) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_LEFT' }));
              } else if (rightZone) {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_RIGHT' }));
              } else {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_CENTER' }));
              }
          });

          // --- Selection Handling ---
          document.addEventListener('touchend', function() {
             setTimeout(function() {
                 const selection = window.getSelection();
                 if (selection && selection.toString().length > 0) {
                     const text = selection.toString();
                     const range = selection.getRangeAt(0);
                     const rect = range.getBoundingClientRect();
                     const payload = {
                         text: text,
                         cfi: JSON.stringify({ 
                             text: text, 
                             startOffset: range.startOffset,
                              endOffset: range.endOffset,
                             nodeName: range.startContainer.nodeName
                         }),
                         rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, windowWidth: window.innerWidth }
                     };
                     window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION', payload: payload }));
                 } else {
                     if (!window.currentQuery) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION_CLEARED' }));
                     }
                 }
             }, 100); 
          });

          // Scroll Reporting
          window.addEventListener('scroll', function() {
            if (!window.isScrolling) {
                window.requestAnimationFrame(function() {
                    const isPaginated = ${isPaginated};
                    let total, scrolled, percentage;
                    if (isPaginated) {
                        total = document.body.scrollWidth - window.innerWidth;
                        scrolled = window.scrollX;
                    } else {
                        total = document.body.scrollHeight - window.innerHeight;
                        scrolled = window.scrollY;
                    }
                    
                    percentage = total > 0 ? scrolled / total : 0;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCROLL', payload: percentage }));
                    window.isScrolling = false;
                });
                window.isScrolling = true;
            }
          });

          // Initial Scroll Position
          window.onload = function() {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
          };

          window.addHighlight = function(color) {
               document.designMode = "on";
               document.execCommand("BackColor", false, color);
               document.designMode = "off";
               window.getSelection().removeAllRanges();
          };

          // Search Logic
          window.currentQuery = '';
          window.performSearch = function(text) {
              window.currentQuery = text;
              if (!text) return false;
              const found = window.find(text, false, false, true);
              return found;
          };
          window.findNext = function() {
              if (!window.currentQuery) return;
              window.find(window.currentQuery, false, false, true);
          };
          window.findPrev = function() {
               if (!window.currentQuery) return;
               window.find(window.currentQuery, false, true, true);
          };
        `;

        if (content.trim().toLowerCase().includes('<html')) {
            const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, height=device-height">';
            let newContent = content;
            if (newContent.includes('</head>')) {
                newContent = newContent.replace('</head>', `<style>${initialCss}</style>${viewportMeta}</head>`);
            } else {
                newContent = newContent.replace('<body>', `<head><style>${initialCss}</style>${viewportMeta}</head><body>`);
            }
            if (newContent.includes('</body>')) {
                newContent = newContent.replace('</body>', `<script>${injectedJs}</script></body>`);
            } else {
                newContent += `<script>${injectedJs}</script>`;
            }
            return newContent;
        } else {
            return `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, height=device-height">
                  <style>${initialCss}</style>
                </head>
                <body>
                  <div id="content">${content}</div>
                  <script>${injectedJs}</script>
                </body>
              </html>
            `;
        }
    }, [content, flow, insets]); // Depend on flow and insets

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            switch (data.type) {
                case 'SCROLL':
                    if (onScroll) onScroll(data.payload);
                    break;
                case 'TAP_CENTER':
                    if (onPress) onPress();
                    break;
                case 'TAP_LEFT':
                    if (flow === 'paginated') {
                        webViewRef.current?.injectJavaScript(`
                            (function() {
                                const currentScroll = window.scrollX;
                                const pageWidth = window.innerWidth;
                                
                                if (currentScroll > 5) {
                                    window.scrollTo({
                                        left: Math.max(currentScroll - pageWidth, 0),
                                        behavior: 'auto'
                                    });
                                } else {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PREV_CHAPTER' }));
                                }
                            })();
                            true;
                        `);
                    } else {
                        // SCROLLED mode: "Page Up" or Scroll Up
                        webViewRef.current?.injectJavaScript(`
                            (function() {
                                const currentScroll = window.scrollY;
                                
                                if (currentScroll > 5) {
                                    window.scrollTo({
                                        top: Math.max(currentScroll - window.innerHeight * 0.9, 0),
                                        behavior: 'smooth'
                                    });
                                }
                            })();
                            true;
                        `);
                    }
                    break;
                case 'TAP_RIGHT':
                    if (flow === 'paginated') {
                        webViewRef.current?.injectJavaScript(`
                            (function() {
                                const maxScroll = document.body.scrollWidth - window.innerWidth;
                                const currentScroll = window.scrollX;
                                const pageWidth = window.innerWidth;
                                
                                if (currentScroll < maxScroll - 5) {
                                    window.scrollTo({
                                        left: Math.min(currentScroll + pageWidth, maxScroll),
                                        behavior: 'auto'
                                    });
                                } else {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NEXT_CHAPTER' }));
                                }
                            })();
                            true;
                        `);
                    } else {
                        // SCROLLED mode: "Page Down" or Scroll Down
                        webViewRef.current?.injectJavaScript(`
                            (function() {
                                const maxScroll = document.body.scrollHeight - window.innerHeight;
                                const currentScroll = window.scrollY;
                                
                                if (currentScroll < maxScroll - 5) {
                                    window.scrollTo({
                                        top: Math.min(currentScroll + window.innerHeight * 0.9, maxScroll),
                                        behavior: 'smooth'
                                    });
                                } else {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NEXT_CHAPTER' }));
                                }
                            })();
                            true;
                        `);
                    }
                    break;
                case 'PREV_CHAPTER':
                    if (onPrevChapter) onPrevChapter();
                    break;
                case 'NEXT_CHAPTER':
                    if (onNextChapter) onNextChapter();
                    break;
                case 'SELECTION':
                    if (onSelection && data.payload) {
                        onSelection(data.payload.text, data.payload.cfi, data.payload.rect);
                    }
                    break;
                case 'SELECTION_CLEARED':
                    if (onSelection) {
                        onSelection('', '', null);
                    }
                    break;
            }
        } catch (e) {
            console.warn('WebView Message Error:', e);
        }
    };

    const injectStyles = () => {
        if (webViewRef.current) {
            const js = `
                (function() {
                    try {
                        let style = document.getElementById('reader-custom-style');
                        if (!style) {
                            style = document.createElement('style');
                            style.id = 'reader-custom-style';
                            document.head.appendChild(style);
                        }
                        let fontStack = '-apple-system, Roboto, sans-serif';
                        if ('${fontFamily}' === 'serif') fontStack = 'Georgia, serif';
                        if ('${fontFamily}' === 'sans-serif') fontStack = 'Helvetica, Arial, sans-serif';

                        // Base Padding Logic
                        let basePadding = '10px';
                        if (${margin} === 1) basePadding = '5px';
                        if (${margin} === 3) basePadding = '25px';

                        // Safe Area Values
                        const safeTop = ${insets.top};
                        const safeBottom = ${insets.bottom};
                        const safeLeft = ${insets.left || 0};
                        const safeRight = ${insets.right || 0};
                        
                        const isPaginated = ${flow === 'paginated'};

                        style.innerHTML = \`
                            :root {
                                --reader-bg: ${bg};
                                --reader-text: ${text};
                                --reader-font-size: ${fontSize}px;
                                --reader-line-height: ${lineHeight};
                                --reader-font-family: \${fontStack};
                                --base-padding: \${basePadding};
                                --safe-top: \${safeTop}px;
                                --safe-bottom: \${safeBottom}px;
                                --safe-left: \${safeLeft}px;
                                --safe-right: \${safeRight}px;
                            }
                            html, body {
                                background-color: var(--reader-bg) !important;
                                color: var(--reader-text) !important;
                                font-size: var(--reader-font-size) !important;
                                line-height: var(--reader-line-height) !important;
                                font-family: var(--reader-font-family) !important;
                                
                                /* Box Model Fix */
                                padding-top: calc(var(--safe-top) + var(--base-padding)) !important;
                                padding-bottom: calc(var(--safe-bottom) + var(--base-padding)) !important;
                                
                                padding-left: \${isPaginated ? '0' : 'var(--base-padding)'} !important;
                                padding-right: \${isPaginated ? '0' : 'var(--base-padding)'} !important;
                            }
                            
                            #content {
                                padding-left: \${isPaginated ? 'calc(var(--safe-left) + var(--base-padding))' : '0'} !important;
                                padding-right: \${isPaginated ? 'calc(var(--safe-right) + var(--base-padding))' : '0'} !important;
                            }
                            p, span, div, li, blockquote, section, article, h1, h2, h3, h4, h5, h6 {
                                color: var(--reader-text) !important;
                                background-color: transparent !important; 
                            }
                            a { 
                                color: ${themeMode === 'dark' ? '#64B5F6' : '#2196F3'} !important; 
                                text-decoration: none;
                            }
                            img {
                                max-width: 100% !important;
                                height: auto !important;
                                background-color: transparent !important;
                            }
                        \`;
                    } catch(e) {}
                    true;
                })();
            `;
            webViewRef.current.injectJavaScript(js);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            injectStyles();
        }
    }, [fontSize, bg, text, themeMode, lineHeight, margin, fontFamily, isLoaded]);

    return (
        <Box flex={1} backgroundColor="background">
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent, baseUrl }}
                style={{ backgroundColor: bg, flex: 1 }}
                scrollEnabled={true}
                pagingEnabled={flow === 'paginated'} // Only true if Paginated
                bounces={flow === 'scrolled'} // Allow bounces in scroll mode
                onMessage={handleMessage}
                onLoadEnd={() => {
                    setLoading(false);
                    setIsLoaded(true);
                    injectStyles();
                }}
            />
            {loading && (
                <ActivityIndicator
                    style={StyleSheet.absoluteFill}
                    size="large"
                    color={theme.colors.text}
                />
            )}
        </Box>
    );
});

export default EpubReader;
