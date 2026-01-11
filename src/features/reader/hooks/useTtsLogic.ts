import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { EpubStructure } from '@/features/reader/utils/EpubService';

export const useTtsLogic = (
    bookId: string,
    content: string,
    currentChapterScrollRef: React.MutableRefObject<number>,
    epubStructure: EpubStructure | null
) => {
    const [isTTSPlaying, setIsTTSPlaying] = useState(false);
    const [isTTSPaused, setIsTTSPaused] = useState(false);
    const [ttsStatusText, setTtsStatusText] = useState('Ready');
    const ttsCleanTextRef = useRef('');

    const {
        ttsRate, setTtsRate,
        ttsPitch,
        ttsVoice
    } = useReaderSettings();

    // Prepare text when content changes
    useEffect(() => {
        if (content) {
            let clean = content
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            ttsCleanTextRef.current = clean;
        }
    }, [content]);

    // Cleanup TTS on unmount or book change
    useEffect(() => {
        if (isTTSPlaying) {
            Speech.stop();
            setIsTTSPlaying(false);
            setIsTTSPaused(false);
        }
        return () => {
            Speech.stop();
        };
    }, [bookId]);

    const handleTTSStart = () => {
        const text = ttsCleanTextRef.current;
        if (!text) {
            setTtsStatusText('No text content');
            return;
        }
        setTtsStatusText('Reading...');
        setIsTTSPlaying(true);
        setIsTTSPaused(false);

        // Calculate offset (Progress Sync)
        let textToRead = text;
        const offsetPercentage = currentChapterScrollRef.current > 0 ? currentChapterScrollRef.current : 0;

        if (offsetPercentage > 0 && offsetPercentage < 1) {
            const charIndex = Math.floor(text.length * offsetPercentage);
            const safeIndex = text.indexOf(' ', charIndex);
            if (safeIndex !== -1) {
                textToRead = text.substring(safeIndex + 1);
            }
        }

        Speech.speak(textToRead, {
            rate: ttsRate,
            pitch: ttsPitch,
            voice: ttsVoice || undefined,
            language: epubStructure?.metadata?.language || 'en',
            onDone: () => {
                setIsTTSPlaying(false);
                setIsTTSPaused(false);
                setTtsStatusText('Finished');
            },
            onStopped: () => {
                setIsTTSPlaying(false);
                setIsTTSPaused(false);
                setTtsStatusText('Stopped');
            },
            onError: (e) => {
                setIsTTSPlaying(false);
                setTtsStatusText('Error: ' + e.message);
            }
        });
    };

    const handleTTSStop = () => {
        Speech.stop();
        setIsTTSPlaying(false);
        setIsTTSPaused(false);
    };

    const handleTTSPlayPause = async () => {
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
        handleTTSRateChange
    };
};
