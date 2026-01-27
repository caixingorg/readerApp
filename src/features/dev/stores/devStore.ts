import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevStoreState, EnvType } from '../config/types';

export const useDevStore = create<DevStoreState>()(
    persist(
        (set) => ({
            currentEnvId: 'prod', // Default to production for safety
            customApiUrl: null,
            customWebUrl: null,
            isMenuVisible: false,

            setEnvId: (id: EnvType) => set({ currentEnvId: id }),
            setCustomUrl: (type, url) =>
                set((state) => ({
                    [type === 'api' ? 'customApiUrl' : 'customWebUrl']: url,
                })),
            toggleMenu: (visible) =>
                set((state) => ({
                    isMenuVisible: visible !== undefined ? visible : !state.isMenuVisible,
                })),
        }),
        {
            name: 'dev-kit-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist environment settings, not UI state like visibility
            partialize: (state) => ({
                currentEnvId: state.currentEnvId,
                customApiUrl: state.customApiUrl,
                customWebUrl: state.customWebUrl,
            }),
        }
    )
);
