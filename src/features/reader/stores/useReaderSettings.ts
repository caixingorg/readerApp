import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReaderThemeMode = 'light' | 'dark' | 'warm' | 'eye-care';

interface ReaderSettingsState {
    // Appearance
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
    theme: ReaderThemeMode;

    // Interactions
    volumeKeyFlip: boolean;
    hapticFeedback: boolean;
    longPressSpeed: 'fast' | 'normal' | 'slow';
    forceEncoding: string | null;

    // Actions
    setFontSize: (size: number) => void;
    setLineHeight: (height: number) => void;
    setFontFamily: (font: string) => void;
    setTheme: (theme: ReaderThemeMode) => void;
    setVolumeKeyFlip: (enabled: boolean) => void;
    setHapticFeedback: (enabled: boolean) => void;
    setLongPressSpeed: (speed: 'fast' | 'normal' | 'slow') => void;
    setForceEncoding: (encoding: string | null) => void;

    // Auto Backup
    autoBackupEnabled: boolean;
    lastBackupTime: number | null;
    setAutoBackupEnabled: (enabled: boolean) => void;
    setLastBackupTime: (time: number) => void;

    // TTS Settings
    ttsRate: number;
    ttsPitch: number;
    ttsVoice: string | null;
    setTtsRate: (rate: number) => void;
    setTtsPitch: (pitch: number) => void;
    setTtsVoice: (voice: string | null) => void;

    // App Lock
    appLockEnabled: boolean;
    setAppLockEnabled: (enabled: boolean) => void;
}

export const useReaderSettings = create<ReaderSettingsState>()(
    persist(
        (set) => ({
            fontSize: 18,
            lineHeight: 1.5,
            fontFamily: 'system',
            theme: 'light',

            volumeKeyFlip: true,
            hapticFeedback: false,
            longPressSpeed: 'normal',
            forceEncoding: null,

            setFontSize: (fontSize) => set({ fontSize }),
            setLineHeight: (lineHeight) => set({ lineHeight }),
            setFontFamily: (fontFamily) => set({ fontFamily }),
            setTheme: (theme) => set({ theme }),

            setVolumeKeyFlip: (volumeKeyFlip) => set({ volumeKeyFlip }),
            setHapticFeedback: (hapticFeedback) => set({ hapticFeedback }),
            setLongPressSpeed: (longPressSpeed) => set({ longPressSpeed }),
            setForceEncoding: (forceEncoding) => set({ forceEncoding }),

            // Auto Backup
            autoBackupEnabled: false,
            lastBackupTime: null,
            setAutoBackupEnabled: (enabled: boolean) => set({ autoBackupEnabled: enabled }),
            setLastBackupTime: (time: number) => set({ lastBackupTime: time }),

            // TTS Settings
            ttsRate: 1.0,
            ttsPitch: 1.0,
            ttsVoice: null,
            setTtsRate: (rate: number) => set({ ttsRate: rate }),
            setTtsPitch: (pitch: number) => set({ ttsPitch: pitch }),
            setTtsVoice: (voice: string | null) => set({ ttsVoice: voice }),

            // App Lock
            appLockEnabled: false,
            setAppLockEnabled: (enabled: boolean) => set({ appLockEnabled: enabled }),
        }),
        {
            name: 'reader-settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);
