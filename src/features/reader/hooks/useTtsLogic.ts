import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { EpubStructure } from '@/features/reader/utils/EpubService';

export const useTtsLogic = (
    bookId: string,
    content: string,
    currentChapterScrollRef: React.MutableRefObject<number>,
    epubStructure: EpubStructure | null,
) => {
    const [isTTSPlaying, setIsTTSPlaying] = useState(false);
    const [isTTSPaused, setIsTTSPaused] = useState(false);
    const [ttsStatusText, setTtsStatusText] = useState('Ready');
    const ttsCleanTextRef = useRef('');

    const { ttsRate, setTtsRate, ttsPitch, ttsVoice } = useReaderSettings();

    // Prepare text when content changes
    useEffect(() => {
        if (content) {
            // Stop previous speech if any, as content has changed (new chapter)
            if (isTTSPlaying) {
                Speech.stop();
                setIsTTSPlaying(false);
                setIsTTSPaused(false);
                setTtsStatusText('Ready');
            }

            let clean = content
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            ttsCleanTextRef.current = clean;
        }
    }, [content]);

    // Cleanup TTS on unmount or book change
    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, [bookId]);

    const handleTTSStart = () => {
        const text = ttsCleanTextRef.current;
        console.log('[useTtsLogic] Starting TTS. Text length:', text?.length);
        if (!text) {
            console.log('[useTtsLogic] No text to read');
            setTtsStatusText('No text content');
            return;
        }
        setTtsStatusText('Reading...');
        setIsTTSPlaying(true);
        setIsTTSPaused(false);

        // Calculate offset (Progress Sync)
        let textToRead = text;
        const offsetPercentage =
            currentChapterScrollRef.current > 0 ? currentChapterScrollRef.current : 0;

        if (offsetPercentage > 0 && offsetPercentage < 1) {
            const charIndex = Math.floor(text.length * offsetPercentage);
            const safeIndex = text.indexOf(' ', charIndex);
            if (safeIndex !== -1) {
                textToRead = text.substring(safeIndex + 1);
            }
        }

        console.log('[useTtsLogic] calling Speech.speak');

        // Auto-detect language if text contains Chinese characters
        // This prevents the "instant done" issue when sending Chinese text to an English voice
        const hasChinese = /[\u4e00-\u9fa5]/.test(textToRead);
        const language = hasChinese ? 'zh-CN' : (epubStructure?.metadata?.language || 'en');

        const options = {
            rate: ttsRate,
            pitch: ttsPitch,
            voice: ttsVoice || undefined,
            language: language,
            onDone: () => {
                console.log('[useTtsLogic] Speech done');
                setIsTTSPlaying(false);
                setIsTTSPaused(false);
                setTtsStatusText('Finished');
            },
            onStopped: () => {
                console.log('[useTtsLogic] Speech stopped');
                setIsTTSPlaying(false);
                setIsTTSPaused(false);
                setTtsStatusText('Stopped');
            },
            onError: (e: any) => {
                console.error('[useTtsLogic] Speech error', e);
                setIsTTSPlaying(false);
                setTtsStatusText('Error: ' + e.message);
            },
        };

        console.log('[useTtsLogic] Speech options:', JSON.stringify({ ...options, textPreview: textToRead.substring(0, 50) }));

        Speech.speak(textToRead, options);
    };

    const handleTTSStop = () => {
        console.log('[useTtsLogic] Stopping TTS');
        Speech.stop();
        setIsTTSPlaying(false);
        setIsTTSPaused(false);
    };

    const handleTTSPlayPause = async () => {
        console.log('[useTtsLogic] Play/Pause clicked. Playing:', isTTSPlaying, 'Paused:', isTTSPaused);
        if (isTTSPlaying) {
            if (isTTSPaused) {
                Speech.resume();
                setIsTTSPaused(false);
                setTtsStatusText('Reading...');
            } else {
                Speech.pause();
                setIsTTSPaused(true);
                setTtsStatusText('Paused');
            }
        } else {
            handleTTSStart();
        }
    };

    const handleTTSRateChange = (newRate: number) => {
        setTtsRate(newRate);
        if (isTTSPlaying) {
            Speech.stop();
            setTimeout(() => {
                setTtsStatusText('Rate changed, restarting...');
                handleTTSStart();
            }, 200);
        }
    };

    return {
        isTTSPlaying,
        isTTSPaused,
        ttsStatusText,
        handleTTSPlayPause,
        handleTTSStop,
        handleTTSRateChange,
    };
};
