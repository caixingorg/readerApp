import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './resources/en.json';
import zh from './resources/zh.json';

const RESOURCES = {
    en: { translation: en },
    zh: { translation: zh },
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lang: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user-language');
            if (savedLanguage && savedLanguage !== 'system') {
                callback(savedLanguage);
                return;
            }
        } catch (error) {
            console.log('Error reading language', error);
        }

        const locales = Localization.getLocales();
        const systemLanguage = locales[0]?.languageCode;

        // Default to 'zh' if system is 'zh', otherwise 'en'
        // You can expand this logic as needed
        if (systemLanguage === 'zh') {
            callback('zh');
        } else {
            callback('en');
        }
    },
    init: () => {},
    cacheUserLanguage: async (language: string) => {
        try {
            await AsyncStorage.setItem('user-language', language);
        } catch (error) {
            console.log('Error saving language', error);
        }
    },
};

i18n.use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
        resources: RESOURCES,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        react: {
            useSuspense: false, // Avoids issues on Android if view loaded before i18n
        },
    });

export default i18n;
