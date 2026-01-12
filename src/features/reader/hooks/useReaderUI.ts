import { useState, useEffect } from 'react';
import * as Brightness from 'expo-brightness';
import { useThemeStore } from '@/stores/useThemeStore';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';

export const useReaderUI = () => {
    const { setMode } = useThemeStore();
    const { setTheme: setReaderTheme } = useReaderSettings();

    const [showControls, setShowControls] = useState(true);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showThemePanel, setShowThemePanel] = useState(false);
    const [showTTS, setShowTTS] = useState(false);
    const [showNoteInput, setShowNoteInput] = useState(false);

    const [contentsModal, setContentsModal] = useState<{
        visible: boolean;
        tabs: ('contents' | 'bookmarks' | 'notes')[];
        initialTab: 'contents' | 'bookmarks' | 'notes';
    }>({
        visible: false,
        tabs: ['contents'],
        initialTab: 'contents',
    });

    const [brightness, setBrightness] = useState(1);
    const [margin, setMargin] = useState(2); // 文本边距偏好
    const [selectedText, setSelectedText] = useState('');
    const [selectedCfi, setSelectedCfi] = useState('');

    useEffect(() => {
        (async () => {
            const { status } = await Brightness.requestPermissionsAsync();
            if (status === 'granted') {
                const cur = await Brightness.getBrightnessAsync();
                setBrightness(cur);
            }
        })();
    }, []);

    const handleBrightnessChange = async (val: number) => {
        setBrightness(val);
        await Brightness.setBrightnessAsync(val);
    };

    const toggleControls = () => {
        if (showFontPanel || showThemePanel) {
            setShowFontPanel(false);
            setShowThemePanel(false);
        } else {
            setShowControls((prev) => !prev);
        }
    };

    const handleThemeChange = (newMode: any) => {
        setReaderTheme(newMode);
        if (newMode === 'dark') setMode('dark');
        else setMode('light');
    };

    return {
        showControls,
        setShowControls,
        showFontPanel,
        setShowFontPanel,
        showThemePanel,
        setShowThemePanel,
        showTTS,
        setShowTTS,
        showNoteInput,
        setShowNoteInput,
        contentsModal,
        setContentsModal,
        brightness,
        handleBrightnessChange,
        margin,
        setMargin,
        selectedText,
        setSelectedText,
        selectedCfi,
        setSelectedCfi,
        toggleControls,
        handleThemeChange,
    };
};
