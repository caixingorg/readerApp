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
    baseUrl?: string;
    onPress?: () => void;
    onPrevChapter?: () => void;
    onNextChapter?: () => void;
    onScroll?: (percentage: number) => void;
    initialScrollPercentage?: number;
    insets?: { top: number; bottom: number };
}

const EpubReader: React.FC<EpubReaderProps> = ({
    content,
    theme,
    themeMode,
    customTheme,
    fontSize,
    baseUrl,
    onPress,
    onPrevChapter,
    onNextChapter,
    onScroll,
    initialScrollPercentage = 0,
    insets = { top: 0, bottom: 0 },
}) => {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    // Colors: Use custom theme if provided, else fallback to mode
    const bg = customTheme?.bg || (themeMode === 'dark' ? '#121212' : '#F0F2F3');
    const text = customTheme?.text || (themeMode === 'dark' ? '#E0E0E0' : '#0B0B0B');

    // Memoize HTML content to prevent reload on style changes
    const htmlContent = useMemo(() => {
        // Initial CSS - Minimal basics, specific styling happens via JS
        const initialCss = `
          * { box-sizing: border-box; }
          body {
            /* Start transparent/neutral to avoid flash */
            background-color: transparent;
            font-family: -apple-system, Roboto, sans-serif;
            padding: 2px; /* reduced padding, we handle safe area in JS or container */
            line-height: 1.6;
            min-height: 100vh;
          }
          img { max-width: 100%; height: auto; }
          p { margin-bottom: 1em; }
        `;

        // JS for Scroll & Interaction
        const injectedJs = `
          // Scroll State
          window.isScrolling = false;
          
          // Tap Handling
          document.addEventListener('click', function(e) {
              const width = window.innerWidth;
              const x = e.clientX;
              if (x < width * 0.3) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_LEFT' }));
              } else if (x > width * 0.7) {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_RIGHT' }));
              } else {
                   window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TAP_CENTER' }));
              }
          });

          // Scroll Reporting
          window.addEventListener('scroll', function() {
            if (!window.isScrolling) {
                window.requestAnimationFrame(function() {
                    const scrollHeight = document.body.scrollHeight - window.innerHeight;
                    const scrolled = window.scrollY;
                    const percentage = scrollHeight > 0 ? scrolled / scrollHeight : 0;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCROLL', payload: percentage }));
                    window.isScrolling = false;
                });
                window.isScrolling = true;
            }
          });

          // Initial Scroll Position
          window.onload = function() {
               // Notify ready
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
          };
        `;

        if (content.trim().toLowerCase().includes('<html')) {
            if (content.includes('</head>')) {
                return content.replace('</head>', `<style>${initialCss}</style><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"></head>`)
                    .replace('</body>', `<script>${injectedJs}</script></body>`);
            } else {
                return content.replace('<body>', `<body><style>${initialCss}</style><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script>${injectedJs}</script>`);
            }
        } else {
            return `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
                    // Inject JS to handle logic inside WebView first?
                    // Logic: Scroll up, if top reached, PREV_CHAPTER
                    webViewRef.current?.injectJavaScript(`
                    if (window.scrollY > 10) {
                        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                    } else {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PREV_CHAPTER' }));
                    }
                `);
                    break;
                case 'TAP_RIGHT':
                    // Logic: Scroll down, if bottom reached, NEXT_CHAPTER
                    webViewRef.current?.injectJavaScript(`
                    if ((window.innerHeight + window.scrollY) < document.body.offsetHeight - 10) {
                       window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
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
            }
        } catch (e) {
            console.warn('WebView Message Error:', e);
        }
    };

    const [isLoaded, setIsLoaded] = useState(false);

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
                        // More robust CSS targeting
                        style.innerHTML = \`
                            :root {
                                --reader-bg: ${bg};
                                --reader-text: ${text};
                                --reader-font-size: ${fontSize}px;
                            }
                            html, body {
                                background-color: var(--reader-bg) !important;
                                color: var(--reader-text) !important;
                                font-size: var(--reader-font-size) !important;
                                line-height: 1.6 !important;
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
    }, [fontSize, bg, text, themeMode, isLoaded]);

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
};

export default EpubReader;
