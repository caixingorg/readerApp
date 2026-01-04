import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ViewMode = 'grid' | 'list';
type SortMode = 'scan' | 'title' | 'recent';

interface LibrarySettingsState {
    viewMode: ViewMode;
    sortMode: SortMode;
    showFileSize: boolean;
    showFormatLabel: boolean;

    setViewMode: (mode: ViewMode) => void;
    setSortMode: (mode: SortMode) => void;
    setShowFileSize: (show: boolean) => void;
    setShowFormatLabel: (show: boolean) => void;
}

export const useLibrarySettings = create<LibrarySettingsState>()(
    persist(
        (set) => ({
            viewMode: 'grid',
            sortMode: 'recent',
            showFileSize: false,
            showFormatLabel: true,

            setViewMode: (viewMode) => set({ viewMode }),
            setSortMode: (sortMode) => set({ sortMode }),
            setShowFileSize: (showFileSize) => set({ showFileSize }),
            setShowFormatLabel: (showFormatLabel) => set({ showFormatLabel }),
        }),
        {
            name: 'library-settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
