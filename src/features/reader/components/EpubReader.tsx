import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import Box from '../../../components/Box';
import { Theme } from '../../../theme/theme';

interface EpubReaderProps {
    content: string; // HTML content of the chapter
    theme: Theme;
    themeMode: 'light' | 'dark'; // kept for backward compat or structure
    customTheme?: { bg: string; text: string }; // NEW: Explicit colors
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
    highlights?: Array<{ cfi: string; color: string; id: string }>; // New prop
    initialScrollPercentage?: number;
    insets?: { top: number; bottom: number };
    longPressSpeed?: 'fast' | 'normal' | 'slow';
}

// Define Ref Interface
export interface EpubReaderRef {
    search: (text: string) => void;
    nextMatch: () => void;
    prevMatch: () => void;
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
    insets = { top: 0, bottom: 0 },
    longPressSpeed = 'normal',
}, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    React.useImperativeHandle(ref, () => ({
        search: (text: string) => {
            // Better: just pass JSON.stringify
            webViewRef.current?.injectJavaScript(`window.performSearch(${JSON.stringify(text)}); true;`);
        },
        nextMatch: () => {
            webViewRef.current?.injectJavaScript(`if (window.findNext) window.findNext(); true;`);
        },
        prevMatch: () => {
            webViewRef.current?.injectJavaScript(`if (window.findPrev) window.findPrev(); true;`);
        }
    }));

    // Inject highlights when they change
    useEffect(() => {
        if (isLoaded && highlights.length > 0) {
            // Serialize highlights and inject
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
            webViewRef.current?.injectJavaScript(`
                setTimeout(() => {
                    const totalWidth = document.body.scrollWidth - window.innerWidth;
                    const targetX = totalWidth * ${initialScrollPercentage};
                    window.scrollTo(targetX, 0);
                }, 100);
            `);
        }
    }, [isLoaded, initialScrollPercentage]);

    // Colors: Use custom theme if provided, else fallback to mode
    const bg = customTheme?.bg || (themeMode === 'dark' ? '#121212' : '#F0F2F3');
    const text = customTheme?.text || (themeMode === 'dark' ? '#E0E0E0' : '#0B0B0B');

    // Memoize HTML content to prevent reload on style changes
    const htmlContent = useMemo(() => {
        // Initial CSS - Minimal basics, specific styling happens via JS
        const initialCss = `
          * { box-sizing: border-box; }
          html {
            height: 100vh;
            width: 100vw;
            overflow-y: hidden; /* Hide vertical scroll */
            overflow-x: scroll; /* Enable horizontal scroll */
          }
          body {
            background-color: transparent;
            font-family: -apple-system, Roboto, sans-serif;
            margin: 0;
            padding: 0; /* Important for columns */
            height: 100vh;
            width: 100vw;
            /* Horizontal Pagination Layout */
            column-width: 100vw;
            column-gap: 0;
            column-fill: auto;
            word-wrap: break-word;
            text-align: justify;
          }
          img { 
              max-width: 100%; 
              max-height: 98vh; /* Ensure fits in page */
              height: auto; 
              object-fit: contain;
              display: block;
              margin: 0 auto;
          }
          p { margin-bottom: 0.5em; text-indent: 1em; }
        `;

        // JS for Scroll & Interaction
        const injectedJs = `
          // Scroll State
          window.isScrolling = false;
          window.scrollDirection = 'horizontal'; // Flag
          
          // Tap Handling
          document.addEventListener('click', function(e) {
              // Prevent default to avoid weird highlighting or link behavior on tap
              // But we need links to work. 
              // Simple check: if target is A, let it be?
              if (e.target.tagName === 'A') return;

              const width = window.innerWidth;
              const x = e.clientX;
              
              // 30% zones
              if (x < width * 0.3) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_LEFT' }));
              } else if (x > width * 0.7) {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_RIGHT' }));
              } else {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_CENTER' }));
              }
          });

          // Scroll Reporting (Horizontal)
          window.addEventListener('scroll', function() {
            if (!window.isScrolling) {
                window.requestAnimationFrame(function() {
                    const totalWidth = document.body.scrollWidth - window.innerWidth;
                    const scrolled = window.scrollX; // Horizontal
                    // Careful with 0 div 0
                    const percentage = totalWidth > 0 ? scrolled / totalWidth : 0;
                    
                    // Also report exact page index if possible?
                    // Math.round(scrolled / window.innerWidth)
                    
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

          // --- Selection Logic ---
          document.addEventListener('selectionchange', function() {
              // Debounce?
          });
          

          // Map speed to ms (fast: 250, normal: 500, slow: 800)
          const speedMap = { fast: 250, normal: 500, slow: 800 };
          const selectionDelay = speedMap['${longPressSpeed}'] || 500;

          document.addEventListener('touchend', function() {
             setTimeout(function() {
                 const selection = window.getSelection();
                 if (selection && selection.toString().length > 0) {
                     const text = selection.toString();
                     // Serialize Code... (Same as before)
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
                     window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECTION_CLEARED' }));
                 }
             }, selectionDelay); 
          });

          // Highlight Helpers (Same as before)
          window.addHighlight = function(color) {
               document.designMode = "on";
               document.execCommand("BackColor", false, color);
               document.designMode = "off";
               window.getSelection().removeAllRanges();
          };

                   } catch(e) { console.log('Highlight error', e); }
               });
          };

          // --- Search Logic (Native window.find) ---
          window.currentQuery = '';
          
          window.performSearch = function(text) {
              window.currentQuery = text;
              // Reset selection to start?
              // window.getSelection().removeAllRanges(); // Don't remove if we want to search from current
              // But usually new search starts from top?
              if (!text) return false;
              
              // For new search, maybe start from top?
              // document.body.focus();
              // window.getSelection().collapse(document.body, 0);

              const found = window.find(text, false, false, true); // Case insensitive, forward, wrap
              if (found) {
                  // Report found?
                  // window.ReactNativeWebView.postMessage(...)
                  return true;
              }
              return false;
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
            // Inject into existing HTML
            // We need to inject styles into HEAD and script into BODY
            // And ensure viewport is correct
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
    }, [content]); // DEPENDENCY: Only content! Styles are effect-driven.

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
                    // Logic: Scroll LEFT (Horizontal). If at 0, PREV_CHAPTER
                    webViewRef.current?.injectJavaScript(`
                        if (window.scrollX > 10) {
                            window.scrollBy({ left: -window.innerWidth, behavior: 'smooth' });
                        } else {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PREV_CHAPTER' }));
                        }
                    `);
                    break;
                case 'TAP_RIGHT':
                    // Logic: Scroll RIGHT (Horizontal). If at end, NEXT_CHAPTER
                    webViewRef.current?.injectJavaScript(`
                        if ((window.innerWidth + window.scrollX) < document.body.scrollWidth - 10) {
                           window.scrollBy({ left: window.innerWidth, behavior: 'smooth' });
                        } else {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NEXT_CHAPTER' }));
                        }
                    `);
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
                        // Pass null to indicate clear
                        onSelection('', '', null);
                    }
                    break;
            }
        } catch (e) {
            console.warn('WebView Message Error:', e);
        }
    };

    // const [isLoaded, setIsLoaded] = useState(false); // Moved up


    // Style injection helper
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
                        // Map Font Family
                        let fontStack = '-apple-system, Roboto, sans-serif';
                        if ('${fontFamily}' === 'serif') fontStack = 'Georgia, serif';
                        if ('${fontFamily}' === 'sans-serif') fontStack = 'Helvetica, Arial, sans-serif';

                        // Map Margin (1=Narrow, 2=Normal, 3=Wide)
                        // In pagination mode, margin implies padding on the body content X-axis?
                        // Or just general indentation?
                        // Actually, 'padding' on body determines the text inset.
                        let bodyPadding = '10px';
                        if (${margin} === 1) bodyPadding = '5px';
                        if (${margin} === 3) bodyPadding = '25px';

                        // More robust CSS targeting
                        style.innerHTML = \`
                            :root {
                                --reader-bg: ${bg};
                                --reader-text: ${text};
                                --reader-font-size: ${fontSize}px;
                                --reader-line-height: ${lineHeight};
                                --reader-font-family: \${fontStack};
                                --reader-padding: \${bodyPadding};
                            }
                            html, body {
                                background-color: var(--reader-bg) !important;
                                color: var(--reader-text) !important;
                                font-size: var(--reader-font-size) !important;
                                line-height: var(--reader-line-height) !important;
                                font-family: var(--reader-font-family) !important;
                                padding: var(--reader-padding) !important;
                            }
                            /* Aggressive resets for common text containers */
                            p, span, div, li, blockquote, section, article, h1, h2, h3, h4, h5, h6 {
                                color: var(--reader-text) !important;
                                /* Only reset background if it's not transparent/inherited to avoid white boxes */
                                background-color: transparent !important; 
                            }
                            /* Special handling for links */
                            a { 
                                color: ${themeMode === 'dark' ? '#64B5F6' : '#2196F3'} !important; 
                                text-decoration: none;
                            }
                            /* Images should allow native constraints */
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

    // Apply styles when props change, BUT only if loaded
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
                onMessage={handleMessage}
                onLoadEnd={() => {
                    setLoading(false);
                    setIsLoaded(true);
                    // Inject immediately on load as well
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
