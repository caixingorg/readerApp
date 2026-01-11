import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import * as Brightness from 'expo-brightness';
import * as FileSystem from 'expo-file-system/legacy';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import Box from '@/components/Box';
import Text from '@/components/Text';
import ScreenLayout from '@/components/ScreenLayout';
import { Theme } from '@/theme/theme';
import { version } from '../../../../package.json';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLibrarySettings } from '@/features/library/stores/useLibrarySettings';
import { useReaderSettings } from '@/features/reader/stores/useReaderSettings';
import { DataExportService } from '@/features/settings/utils/DataExportService';
import { BookRepository } from '@/services/database/BookRepository';

import FontSizeSlider from '@/features/settings/components/FontSizeSlider';
import BrightnessControl from '@/features/settings/components/BrightnessControl';
import SelectionModal, { OptionItem } from '@/features/settings/components/SelectionModal';
import SettingsGroup from '@/features/settings/components/SettingsGroup';
import SettingsRow from '@/features/settings/components/SettingsRow';

const SettingsScreen: React.FC = () => {
    const theme = useTheme<Theme>();
    const navigation = useNavigation<any>();

    // Global Stores
    const { mode, setMode } = useThemeStore();
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useState<string>('system'); // Default, will sync with effect

    // Global Settings
    const { autoBackupEnabled, setAutoBackupEnabled } = useReaderSettings();
    const {} = useLibrarySettings();

    // Local State
    const [fontFamily, setFontFamily] = useState('Inter'); // Mock
    const [brightness, setBrightness] = useState(0.5);
    const [showFontModal, setShowFontModal] = useState(false);
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Sync local language state
    useEffect(() => {
        const loadLanguage = async () => {
            const saved = await AsyncStorage.getItem('user-language');
            setLanguage(saved || 'system');
        };
        loadLanguage();
    }, []);

    const handleLanguageChange = async (val: string) => {
        setLanguage(val);
        await AsyncStorage.setItem('user-language', val);
        if (val === 'system') {
            const locales = Localization.getLocales();
            const systemLanguage = locales[0]?.languageCode;
            i18n.changeLanguage(systemLanguage === 'zh' ? 'zh' : 'en');
        } else {
            i18n.changeLanguage(val);
        }
        setShowLanguageModal(false);
    };

    // Brightness Permission & Listener
    useEffect(() => {
        (async () => {
            const { status } = await Brightness.requestPermissionsAsync();
            if (status === 'granted') {
                const current = await Brightness.getBrightnessAsync();
                setBrightness(current);
            }
        })();
    }, []);

    const handleBrightnessChange = async (val: number) => {
        setBrightness(val);
        await Brightness.setBrightnessAsync(val);
    };

    // Font Options
    const fontOptions: OptionItem[] = [
        { label: 'Inter', value: 'Inter', badge: 'Ag' },
        { label: 'System Sans', value: 'System', badge: 'Ag' },
        { label: 'Lora Serif', value: 'Lora', badge: 'Ag' },
        { label: 'Monospace', value: 'Monospace', badge: 'Ag' },
    ];

    const languageOptions: OptionItem[] = [
        {
            label: t('settings.general.language_opts.system'),
            value: 'system',
            icon: 'settings-outline',
        },
        { label: t('settings.general.language_opts.en'), value: 'en', icon: 'language-outline' },
        { label: t('settings.general.language_opts.zh'), value: 'zh', icon: 'language-outline' },
    ];

    // --- Actions ---

    const handleResetLibrary = () => {
        Alert.alert(t('settings.data.reset_alert.title'), t('settings.data.reset_alert.message'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('settings.data.reset_alert.confirm'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await BookRepository.deleteAll();
                        // Clear directories
                        const docsDir = FileSystem.documentDirectory + 'books/';
                        await FileSystem.deleteAsync(docsDir, { idempotent: true });
                        const cacheDir = (FileSystem.cacheDirectory || '') + 'books/';
                        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                        Alert.alert(
                            t('settings.data.reset_alert.success_title'),
                            t('settings.data.reset_alert.success_message'),
                        );
                    } catch (e) {
                        Alert.alert(
                            t('settings.data.reset_alert.error_title'),
                            'Reset failed: ' + e,
                        );
                    }
                },
            },
        ]);
    };

    return (
        <ScreenLayout>
            {/* Premium Header */}
            <Box
                paddingHorizontal="m"
                paddingTop="l"
                paddingBottom="m"
                backgroundColor="mainBackground"
            >
                {/* Title Block */}
                <Box>
                    <Text
                        variant="header"
                        fontSize={34}
                        lineHeight={40}
                        fontWeight="800"
                        color="textPrimary"
                    >
                        {t('settings.title')}
                    </Text>
                </Box>
            </Box>

            <Box flex={1} backgroundColor="mainBackground">
                <ScrollView
                    contentContainerStyle={{
                        padding: theme.spacing.m,
                        paddingBottom: theme.spacing.xl * 2,
                    }}
                >
                    {/* SECTION 1: APPEARANCE */}
                    <SettingsGroup title={t('settings.groups.appearance')}>
                        <SettingsRow
                            label={t('settings.general.language')}
                            type="value"
                            value={
                                language === 'system'
                                    ? t('settings.general.language_opts.system')
                                    : language === 'en'
                                      ? t('settings.general.language_opts.en')
                                      : t('settings.general.language_opts.zh')
                            }
                            icon="language"
                            onPress={() => setShowLanguageModal(true)}
                        />
                        <SettingsRow
                            label={t('settings.appearance.theme')}
                            type="value"
                            value={
                                mode === 'system'
                                    ? t('settings.appearance.theme_opts.system')
                                    : mode === 'dark'
                                      ? t('settings.appearance.theme_opts.dark')
                                      : t('settings.appearance.theme_opts.light')
                            }
                            icon="moon"
                            onPress={() => {
                                setMode(mode === 'dark' ? 'light' : 'dark');
                            }}
                        />
                        <SettingsRow
                            label={t('settings.appearance.font_family')}
                            type="value"
                            value={fontFamily}
                            icon="text"
                            onPress={() => setShowFontModal(true)}
                        />
                    </SettingsGroup>

                    {/* Brightness Slider Standalone */}
                    <Box marginBottom="l">
                        <BrightnessControl
                            brightness={brightness}
                            onBrightnessChange={handleBrightnessChange}
                            autoBrightness={true}
                        />
                    </Box>

                    {/* SECTION 2: READING EXPERIENCE */}
                    <SettingsGroup title={t('settings.groups.reading')}>
                        {/* 
                            Note: TTSSettingsScreen is not yet in the official nav types, 
                            so we cast navigation to any or just leave as string
                        */}
                        <SettingsRow
                            label="朗读设置" // TODO: i18n
                            icon="mic"
                            onPress={() => navigation.navigate('TTSSettings')}
                        />
                    </SettingsGroup>

                    {/* SECTION 3: DATA & STORAGE */}
                    <SettingsGroup title={t('settings.groups.data')}>
                        <SettingsRow
                            label={t('settings.data.backup')}
                            icon="cloud-upload"
                            onPress={DataExportService.exportData}
                        />
                        <SettingsRow
                            label={t('settings.data.auto_backup')}
                            type="toggle"
                            value={autoBackupEnabled}
                            onValueChange={setAutoBackupEnabled}
                            icon="save"
                        />
                        <SettingsRow
                            label={t('settings.data.reset')}
                            isDestructive
                            icon="trash"
                            onPress={handleResetLibrary}
                            showDivider={false} // Last item
                        />
                    </SettingsGroup>

                    {/* SECTION 4: ABOUT */}
                    <SettingsGroup title={t('settings.groups.about')}>
                        <SettingsRow
                            label={t('settings.about.version')}
                            type="value"
                            value={version}
                            icon="information"
                            onPress={() => {}} // No-op
                            showDivider={false} // Last item
                        />
                    </SettingsGroup>

                    {/* Footer */}
                    <Box alignItems="center" marginTop="m">
                        <Text variant="caption" color="textTertiary">
                            {t('settings.about.designed_by')}
                        </Text>
                    </Box>
                </ScrollView>
            </Box>

            {/* Modals */}
            <SelectionModal
                visible={showLanguageModal}
                title={t('settings.general.language_opts.title')}
                options={languageOptions}
                selectedValue={language}
                onSelect={(val) => handleLanguageChange(val)}
                onClose={() => setShowLanguageModal(false)}
                variant="list"
            />
            <SelectionModal
                visible={showFontModal}
                title={t('settings.appearance.font_family')}
                options={fontOptions}
                selectedValue={fontFamily}
                onSelect={(val) => {
                    setFontFamily(val);
                    setShowFontModal(false);
                }}
                onClose={() => setShowFontModal(false)}
                variant="list"
            />
        </ScreenLayout>
    );
};

const styles = StyleSheet.create({});

export default SettingsScreen;
